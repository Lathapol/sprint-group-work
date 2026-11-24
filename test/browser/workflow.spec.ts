import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

test('requester submits and retrieves a reviewer rejection', async ({ page }) => {
  const title = 'Browser request ' + randomUUID();
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  async function login(username: string) {
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(process.env.SEED_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();
  }

  try {
    await page.goto('/');
    await login('requester1');
    await page.getByRole('link', { name: 'New request' }).click();
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Category').selectOption('PURCHASE');
    await page.getByLabel('Amount (THB)').fill('0');
    await page.getByLabel('Justification').fill('Replace lab equipment');
    await page.getByRole('button', { name: 'Submit request' }).click();
    await expect(page.getByText('Enter a positive THB amount', { exact: false })).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue(title);
    await page.getByLabel('Amount (THB)').fill('99.50');
    await page.getByRole('button', { name: 'Submit request' }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText('Pending', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();

    await login('reviewer1');
    await page.getByRole('button', { name: 'Queue' }).click();
    await page.getByRole('link', { name: title }).click();
    await page.getByRole('button', { name: 'Claim request' }).click();
    await expect(page.getByText('In review', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Request history', exact: true })
      .getByText('Pending → In review', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Enter a valid decision reason.');
    await page.getByLabel('Decision reason (required for rejection or return)').fill('Budget limit');
    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    await expect(page.getByText('Rejected', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Request history', exact: true })
      .getByText('In review → Rejected', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();

    await login('requester1');
    await page.getByRole('link', { name: title }).click();
    const detail = page.locator('section').filter({ has: page.getByRole('heading', { name: title }) });
    await expect(detail.getByText('Rejected', { exact: true })).toBeVisible();
    await expect(detail.getByText('Budget limit', { exact: true })).toBeVisible();
  } finally {
    try {
      await db.$transaction([
        db.requestHistory.deleteMany({ where: { request: { title } } }),
        db.request.deleteMany({ where: { title } }),
      ]);
    } finally {
      await db.$disconnect();
    }
  }
});
