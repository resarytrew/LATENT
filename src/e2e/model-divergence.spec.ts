import { test, expect } from '@playwright/test';

test('creates mock divergence experiment and restores after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Source prompt').fill('Explain why the sky is blue.');
  await page.getByRole('button', { name: 'Start experiment' }).click();
  await expect(page.getByText('World A')).toBeVisible();
  await expect(page.getByText('completed')).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Create another reality' }).click();
  await expect(page.getByText('World B')).toBeVisible();
  await page.getByRole('button', { name: 'Run all' }).click();
  await expect(page.getByText('Divergence after character')).toBeVisible({ timeout: 30000 });
  await page.keyboard.press('c');
  await expect(page.getByLabel('Compare worlds')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.reload();
  await expect(page.getByText('World A')).toBeVisible();
  await expect(page.getByText('World B')).toBeVisible();
});
