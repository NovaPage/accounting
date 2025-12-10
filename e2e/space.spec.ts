import { test, expect } from '@playwright/test';

test('create space UI is accessible', async ({ page }) => {
    await page.goto('/dashboard');

    // 1. Open Space Switcher
    const switcher = page.locator('button[aria-label="Cambiar espacio"]');
    await expect(switcher).toBeVisible();
    await expect(switcher).toBeEnabled();

    await switcher.click();

    // 2. Verify "Crear nuevo espacio" option exists
    const createOption = page.getByText('Crear nuevo espacio');
    await expect(createOption).toBeVisible();
});
