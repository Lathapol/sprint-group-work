import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

test('TEST-06-03: history renders safe reasons and retries a failed read', async ({ page, browser }) => {
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  const reviewer = await browser.newContext({ baseURL: 'http://127.0.0.1:4173' });
  let id: number | undefined;
  const title = 'History UI ' + randomUUID();
  const reason = '<img src=x onerror=alert(1)> synthetic rejection';
  try {
    await page.goto('/');
    await page.getByLabel('Username').fill('requester1');
    await page.getByLabel('Password').fill(process.env.SEED_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'My requests' })).toBeVisible();
    const created = await page.request.post('/api/requests', {
      data: { title, category: 'PURCHASE', amount: '49.50', justification: 'Synthetic UI history check' },
    });
    expect(created.status()).toBe(201);
    id = (await created.json()).data.id;
    expect((await reviewer.request.post('/api/auth/login', {
      data: { username: 'reviewer1', password: process.env.SEED_PASSWORD },
    })).status()).toBe(200);
    expect((await reviewer.request.post(`/api/requests/${id}/claim`, { data: {} })).status()).toBe(200);
    expect((await reviewer.request.post(`/api/requests/${id}/reject`, { data: { reason } })).status()).toBe(200);

    let calls = 0;
    await page.route(`**/api/requests/${id}/history`, async route => {
      if (++calls === 1) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'History temporarily unavailable.' } }) });
      } else await route.continue();
    });
    await page.goto('/requests/' + id);
    const history = page.getByRole('region', { name: 'Request history', exact: true });
    await expect(history.getByRole('alert')).toHaveText('History temporarily unavailable.');
    await history.getByRole('button', { name: 'Retry history' }).click();
    await expect(history.getByRole('listitem')).toHaveCount(3);
    await expect(history.getByRole('listitem').nth(0)).toContainText('Created → Pending');
    await expect(history.getByRole('listitem').nth(1)).toContainText('Pending → In review');
    await expect(history.getByRole('listitem').nth(2)).toContainText('In review → Rejected');
    await expect(history.getByText('Reason: ' + reason, { exact: true })).toBeVisible();
    await expect(history.locator('img')).toHaveCount(0);
    await expect(history.getByText(/UTC/).first()).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('history.png'), fullPage: true });

    // Legacy empty history gets a real empty state rather than an invented event.
    await db.requestHistory.deleteMany({ where: { requestId: id } });
    await page.reload();
    await expect(history.getByText('No history recorded for this request.')).toBeVisible();
  } finally {
    await reviewer.close();
    if (id !== undefined) {
      await db.requestHistory.deleteMany({ where: { requestId: id } });
      await db.request.deleteMany({ where: { id } });
    }
    await db.$disconnect();
  }
});
