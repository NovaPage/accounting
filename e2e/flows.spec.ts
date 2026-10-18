import { test, expect } from '@playwright/test';

test.describe('Flujos de Usuario: Espacios y Agregar Transacción', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log('[BROWSER LOG]', msg.text()));
    page.on('pageerror', (err) => console.log('[PAGE ERROR]', err));

    // 1. Iniciar sesión con el usuario de pruebas
    await page.goto('/login');
    await page.locator('#email-in').fill('e2e_tester@novapage.com.co');
    await page.locator('#password-in').fill('Test123456!');
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    // Debe llegar al dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
  });

  test('El botón Agregar abre el diálogo de transacciones en Desktop', async ({ page }) => {
    // Esperar a que la página esté completamente hidratada
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Localizar el botón Agregar en la barra superior desktop
    const addBtn = page.locator('header').getByRole('button', { name: /Agregar/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // El drawer/diálogo debe abrirse y mostrar las pestañas
    await expect(page.getByRole('dialog').or(page.getByRole('dialog'))).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('tab', { name: 'Gasto' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('tab', { name: 'Ingreso' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Transf.' })).toBeVisible();
  });

  test('Navegar a la configuración de Espacio no debe rebotar a Principal', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Clic en la pestaña Espacio de la navegación de cabecera
    const spaceTab = page.locator('header').getByRole('link', { name: /Espacio/i });
    await expect(spaceTab).toBeVisible();
    await spaceTab.click();

    // Esperar navegación a /dashboard/settings/space
    await expect(page).toHaveURL(/.*\/dashboard\/settings\/space/, { timeout: 10000 });

    // Debe mostrar la vista de Ajustes del Espacio sin rebotar al dashboard
    await expect(page.getByText('Ajustes del Espacio')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Configura los detalles de tu espacio de trabajo actual.')).toBeVisible();
  });

  test('En vista móvil, el botón FAB central abre el Sheet de transacción y la barra inferior permite ir a Espacio', async ({ page }) => {
    // Cambiar a viewport móvil (iPhone 13 / Pixel)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Botón FAB central (+)
    const fabButton = page.getByRole('button', { name: /Registrar nueva transacción/i });
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    // Debe abrirse el Sheet
    await expect(page.getByText('Agregar transacción')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('tab', { name: 'Gasto' })).toBeVisible();

    // Cerrar sheet presionando Escape
    await page.keyboard.press('Escape');

    // Navegar a Espacio desde la barra inferior móvil
    const mobileSpaceLink = page.locator('nav[aria-label="Navegación móvil"]').getByRole('link', { name: 'Espacio' });
    await expect(mobileSpaceLink).toBeVisible();
    await mobileSpaceLink.click();

    await expect(page).toHaveURL(/.*\/dashboard\/settings\/space/, { timeout: 10000 });
    await expect(page.getByText('Ajustes del Espacio')).toBeVisible({ timeout: 5000 });
  });
});
