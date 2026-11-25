import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

test('TEST-07-03 UI: returned edits resubmit to the same reviewer and retain history', async ({ page }) => {
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  const title = 'Returned UI ' + randomUUID();
  async function login(username: string) {
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(process.env.SEED_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  try {
    await page.goto('/');
    await login('requester1');
    await page.getByRole('link', { name: 'New request' }).click();
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Category', { exact: true }).selectOption('PURCHASE');
    await page.getByLabel('Amount (THB)', { exact: true }).fill('99.50');
    await page.getByLabel('Justification', { exact: true }).fill('Synthetic returned request');
    await page.getByRole('button', { name: 'Submit request', exact: true }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await login('reviewer1');
    await page.getByRole('button', { name: 'Queue', exact: true }).click();
    await page.getByRole('link', { name: title }).click();
    await page.getByRole('button', { name: 'Claim request' }).click();
    await page.getByRole('button', { name: 'Return request', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Enter a valid decision reason.');
    await page.getByLabel('Decision reason (required for rejection or return)').fill('Revise the estimate');
    await page.getByRole('button', { name: 'Return request', exact: true }).click();
    await expect(page.getByText('Returned', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await login('requester1');
    await page.getByRole('link', { name: title }).click();
    await expect(page.getByRole('heading', { name: 'Edit returned request' })).toBeVisible();
    await expect(page.getByLabel('Amount (THB)', { exact: true })).toHaveValue('99.5');
    await page.getByLabel('Amount (THB)', { exact: true }).fill('0');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByText('Enter a positive THB amount', { exact: false })).toBeVisible();
    await expect(page.getByLabel('Amount (THB)', { exact: true })).toHaveValue('0');
    await page.getByLabel('Amount (THB)', { exact: true }).fill('149.75');
    await page.getByLabel('Justification', { exact: true }).fill('Revised synthetic estimate');
    await expect(page.getByRole('button', { name: 'Resubmit request' })).toBeDisabled();
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByText('Edited', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resubmit request' })).toBeEnabled();
    await page.getByRole('button', { name: 'Resubmit request' }).click();
    await expect(page.getByText('In review', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Edit returned request' })).toHaveCount(0);
    await expect(page.getByText('Reason: Revise the estimate', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await login('reviewer1');
    await page.getByRole('button', { name: 'Queue', exact: true }).click();
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);
    await page.getByRole('button', { name: 'Mine', exact: true }).click();
    await page.getByRole('link', { name: title }).click();
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByText('Approved', { exact: true })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('returned-cycle.png'), fullPage: true });
    await page.getByRole('button', { name: 'Sign out' }).click();
    await login('requester1');
    await page.getByRole('link', { name: title }).click();
    const detail = page.locator('section').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
    await expect(detail.getByText('149.75', { exact: true })).toBeVisible();
    await expect(detail.getByText('Revised synthetic estimate', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Request history' }).getByRole('listitem')).toHaveCount(6);
  } finally {
    await db.requestHistory.deleteMany({ where: { request: { title } } });
    await db.request.deleteMany({ where: { title } });
    await db.$disconnect();
  }
});
