import { test, expect } from '@playwright/test';

test('dashboard is protected - redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
});

// Note: To test actual dashboard content, we would need to setUp authentication state.
// For this connectivity test, verifying protection is sufficient to prove E2E works.
