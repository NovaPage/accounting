import { test, expect } from '@playwright/test';

test('transaction drawer is protected', async ({ page }) => {
    // Even if we don't have a direct URL for the drawer (it's likely a state in the dashboard),
    // we can test that visiting a protected page that might contain it (like /dashboard or /transactions if it existed) redirects.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
});
