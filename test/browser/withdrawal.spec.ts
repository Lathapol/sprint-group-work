import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

test('TEST-12-05 UI: owner confirms withdrawal and can still read retained history', async ({ page }) => {
  const title = 'Browser withdrawal ' + randomUUID();
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  try {
    await page.goto('/');
    await page.getByLabel('Username').fill('requester1');
    await page.getByLabel('Password').fill(process.env.SEED_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('link', { name: 'New request', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Category', { exact: true }).selectOption('PURCHASE');
    await page.getByLabel('Amount (THB)', { exact: true }).fill('25.50');
    await page.getByLabel('Justification', { exact: true }).fill('Synthetic browser withdrawal');
    await page.getByRole('button', { name: 'Submit request', exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Withdraw request', exact: true }).click();
    await expect(page.getByText('Withdrawn', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Withdraw request', exact: true })).toHaveCount(0);
    const history = page.getByRole('region', { name: 'Request history', exact: true });
    await expect(history.getByRole('listitem')).toHaveCount(2);
    await expect(history.getByText('Reason: Requester withdrew the request.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByLabel('Username').fill('reviewer1');
    await page.getByLabel('Password').fill(process.env.SEED_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('button', { name: 'Queue', exact: true }).click();
    await expect(page.getByRole('link', { name: title, exact: true })).toHaveCount(0);
  } finally {
    await db.requestHistory.deleteMany({ where: { request: { title } } });
    await db.request.deleteMany({ where: { title } });
    await db.$disconnect();
  }
});
