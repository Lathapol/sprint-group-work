import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

test('TEST-10-04 UI: real decision counts, reload, loading empty and retry', async ({ page }) => {
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  const title = 'Summary UI ' + randomUUID();
  const reviewer = await db.user.create({ data: { username: 'summary-reviewer-' + randomUUID(), role: 'REVIEWER', passwordHash: await hash(process.env.SEED_PASSWORD!, 10) } });
  let mode: 'actual' | 'empty' | 'error' | 'hold' = 'actual';
  let actual: any;
  let release: (() => void) | undefined;
  await page.route('**/api/reports/summary', async route => {
    if (mode === 'error') {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Synthetic summary read failure' } }) });
      return;
    }
    if (mode === 'empty') {
      actual = { total: 0, byState: ['PENDING', 'IN_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED', 'WITHDRAWN'].map(state => ({ state, count: 0 })),
        byCategory: ['FUNDING', 'PURCHASE', 'TRAVEL', 'REIMBURSEMENT'].map(category => ({ category, count: 0 })), byReviewer: [], unattributedDecisions: 0 };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: actual }) });
      return;
    }
    if (mode === 'hold') await new Promise<void>(resolve => { release = resolve; });
    // Observe and forward the real server snapshot unchanged. Other parallel
    // browser fixtures can change global counts; compare to this same response.
    const response = await route.fetch();
    actual = (await response.json()).data;
    await route.fulfill({ response });
  });
  async function login(username: string) {
    await page.getByLabel('Username', { exact: true }).fill(username);
    await page.getByLabel('Password', { exact: true }).fill(process.env.SEED_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  async function matchesActual() {
    await expect.poll(() => actual !== undefined).toBe(true);
    await expect(page.getByTestId('summary-total')).toHaveText(String(actual.total));
    const states: Record<string, string> = { PENDING: 'Pending', IN_REVIEW: 'In review', RETURNED: 'Returned', APPROVED: 'Approved', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn' };
    for (const row of actual.byState) {
      const tableRow = page.getByRole('table', { name: 'Requests by state', exact: true }).getByRole('row')
        .filter({ has: page.getByRole('cell', { name: states[row.state], exact: true }) });
      await expect(tableRow.getByRole('cell').last()).toHaveText(String(row.count));
    }
    for (const row of actual.byCategory) {
      const label = row.category.charAt(0) + row.category.slice(1).toLowerCase();
      const tableRow = page.getByRole('table', { name: 'Requests by category', exact: true }).getByRole('row')
        .filter({ has: page.getByRole('cell', { name: label, exact: true }) });
      await expect(tableRow.getByRole('cell').last()).toHaveText(String(row.count));
    }
  }
  try {
    await page.goto('/');
    await login('requester1');
    await expect(page.getByRole('heading', { name: 'My requests', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Decision summary', exact: true })).toHaveCount(0);
    await page.goto('/summary');
    await expect(page.getByText('Page unavailable.', { exact: false })).toBeVisible();
    await page.getByRole('link', { name: 'Back to requests', exact: true }).click();
    await page.getByRole('link', { name: 'New request', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'New request', exact: true })).toBeVisible();
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Category', { exact: true }).selectOption('PURCHASE');
    await page.getByLabel('Amount (THB)', { exact: true }).fill('42.50');
    await page.getByLabel('Justification', { exact: true }).fill('Synthetic decision summary check');
    await page.getByRole('button', { name: 'Submit request', exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await login(reviewer.username);
    await page.getByRole('link', { name: 'Decision summary', exact: true }).click();
    await matchesActual();
    await expect(page.getByRole('table', { name: 'Decisions by reviewer', exact: true }).getByText(reviewer.username, { exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Back to requests', exact: true }).click();
    await page.getByRole('link', { name: title, exact: true }).click();
    await page.getByRole('button', { name: 'Claim request', exact: true }).click();
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByText('Approved', { exact: true })).toBeVisible();
    actual = undefined;
    await page.getByRole('link', { name: 'Back to requests', exact: true }).click();
    await page.getByRole('link', { name: 'Decision summary', exact: true }).click();
    await matchesActual();
    const decisionRow = page.getByRole('table', { name: 'Decisions by reviewer', exact: true }).getByRole('row')
      .filter({ has: page.getByRole('cell', { name: reviewer.username, exact: true }) });
    await expect(decisionRow.getByRole('cell')).toHaveText([reviewer.username, '1', '0', '1']);
    await page.screenshot({ path: test.info().outputPath('summary.png'), fullPage: true });
    actual = undefined;
    await page.reload();
    await matchesActual();
    await expect(decisionRow.getByRole('cell')).toHaveText([reviewer.username, '1', '0', '1']);
    mode = 'error';
    await page.reload();
    await expect(page.getByRole('alert')).toHaveText('Synthetic summary read failure');
    mode = 'actual'; actual = undefined;
    await page.getByRole('button', { name: 'Retry summary', exact: true }).click();
    await matchesActual();
    mode = 'empty';
    await page.reload();
    await expect(page.getByText('No requests yet.', { exact: true })).toBeVisible();
    await expect(page.getByText('No attributed decisions yet.', { exact: true })).toBeVisible();
    await matchesActual();
    mode = 'hold'; actual = undefined;
    await page.reload();
    await expect(page.getByText('Loading summary…', { exact: true })).toBeVisible();
    mode = 'actual'; release?.();
    await matchesActual();
  } finally {
    release?.();
    await db.requestHistory.deleteMany({ where: { request: { title } } });
    await db.request.deleteMany({ where: { title } });
    await db.session.deleteMany({ where: { userId: reviewer.id } });
    await db.user.delete({ where: { id: reviewer.id } });
    await db.$disconnect();
  }
});
