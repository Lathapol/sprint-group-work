import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

test('TEST-08-04 UI: filters and clear retain authorized All Queue Mine scopes', async ({ page }) => {
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  const marker = 'Filter UI ' + randomUUID();
  const owner = await db.user.findUniqueOrThrow({ where: { username: 'requester1' } });
  const other = await db.user.findUniqueOrThrow({ where: { username: 'requester2' } });
  const reviewer = await db.user.findUniqueOrThrow({ where: { username: 'reviewer1' } });
  const reviewer2 = await db.user.findUniqueOrThrow({ where: { username: 'reviewer2' } });
  async function fixture(suffix: string, category: 'PURCHASE' | 'TRAVEL', state: 'PENDING' | 'IN_REVIEW' | 'RETURNED', who = owner, assigned = reviewer) {
    return db.request.create({ data: { title: marker + ' ' + suffix, justification: 'Synthetic filter UI fixture', category,
      state, amount: '25', createdAt: new Date('2026-02-28T12:00:00Z'), requesterId: who.id,
      reviewerId: state === 'PENDING' ? null : assigned.id, decisionReason: state === 'RETURNED' ? 'Synthetic return' : null } });
  }
  async function login(username: string) {
    await page.getByLabel('Username', { exact: true }).fill(username);
    await page.getByLabel('Password', { exact: true }).fill(process.env.SEED_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  const links = () => page.getByRole('listitem').getByRole('link').filter({ hasText: marker });
  try {
    await fixture('Pending purchase', 'PURCHASE', 'PENDING');
    await fixture('Mine travel', 'TRAVEL', 'IN_REVIEW');
    await fixture('Mine returned', 'PURCHASE', 'RETURNED');
    await fixture('Other reviewer', 'PURCHASE', 'IN_REVIEW', owner, reviewer2);
    await fixture('Private other owner', 'PURCHASE', 'PENDING', other);
    await page.goto('/');
    await login('requester1');
    await page.getByLabel('Search title or justification', { exact: true }).fill(marker);
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(links()).toHaveCount(4);
    await page.getByLabel('Filter category', { exact: true }).selectOption('TRAVEL');
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(links()).toHaveCount(1);
    await expect(links()).toHaveText(marker + ' Mine travel');
    await page.getByLabel('Filter category', { exact: true }).selectOption('');
    await page.getByLabel('Filter state', { exact: true }).selectOption('RETURNED');
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(links()).toHaveCount(1);
    await expect(links()).toHaveText(marker + ' Mine returned');
    await page.getByLabel('Created from (UTC)', { exact: true }).fill('2026-03-01');
    await page.getByLabel('Created through (UTC)', { exact: true }).fill('2026-02-28');
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Search title or justification')).toHaveValue(marker);
    await expect(page.getByLabel('Created from (UTC)')).toHaveValue('2026-03-01');
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByLabel('Search title or justification')).toHaveValue('');
    await expect(links()).toHaveCount(4);
    await page.getByLabel('Search title or justification').fill(marker + ' missing');
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(page.getByText('No requests in this view.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await login('reviewer1');
    await page.getByLabel('Search title or justification').fill(marker);
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(links()).toHaveCount(5);
    await page.getByRole('button', { name: 'Queue', exact: true }).click();
    await expect(links()).toHaveCount(2);
    await expect(page.getByLabel('Filter state')).toBeDisabled();
    await page.getByLabel('Filter category').selectOption('TRAVEL');
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(page.getByText('No requests in this view.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Queue', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(links()).toHaveCount(2);
    await page.getByRole('button', { name: 'Mine', exact: true }).click();
    await expect(links()).toHaveCount(2);
    await page.getByLabel('Search title or justification').fill(marker);
    await page.getByLabel('Filter category').selectOption('PURCHASE');
    await page.getByLabel('Created from (UTC)').fill('2026-02-28');
    await page.getByLabel('Created through (UTC)').fill('2026-02-28');
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(links()).toHaveCount(1);
    await expect(links()).toHaveText(marker + ' Mine returned');
    await page.screenshot({ path: test.info().outputPath('filtered-mine.png'), fullPage: true });
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Mine', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(links()).toHaveCount(2);
    // Retrying the same submitted filters must issue a new read, retaining inputs on an error.
    await page.getByLabel('Search title or justification').fill(marker);
    let blocked = true;
    await page.route('**/api/requests?*', async route => {
      if (blocked) await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Synthetic temporary read failure' } }) });
      else await route.continue();
    });
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Synthetic temporary read failure');
    await expect(page.getByLabel('Search title or justification')).toHaveValue(marker);
    blocked = false;
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(links()).toHaveCount(2);
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(links()).toHaveCount(5);
    await page.getByRole('link', { name: marker + ' Pending purchase', exact: true }).click();
    await page.getByRole('button', { name: 'Claim request' }).click();
    await expect(page.getByText('In review', { exact: true })).toBeVisible();
  } finally {
    await db.requestHistory.deleteMany({ where: { request: { title: { startsWith: marker } } } });
    await db.request.deleteMany({ where: { title: { startsWith: marker } } });
    await db.$disconnect();
  }
});
