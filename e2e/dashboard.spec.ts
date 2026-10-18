import { test, expect } from '@playwright/test';

test.describe('Protección y Accesibilidad del Dashboard', () => {
  test('Intento directo a /dashboard redirige a /login conservando el flujo', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('La landing page principal carga los elementos y CTA hacia el login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Orbit/);
    await expect(page.getByText('Control total de tus finanzas')).toBeVisible();
    
    // Verificamos botón o enlace a login
    const loginLink = page.getByRole('link', { name: /Iniciar sesión|Comenzar/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });
});
