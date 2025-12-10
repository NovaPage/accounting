import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/login');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Orbit/);
});

test('landing page is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Orbit/);
    await expect(page.getByText('Control total de tus finanzas')).toBeVisible();
});

test('dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
});
