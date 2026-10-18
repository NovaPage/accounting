import { test, expect } from '@playwright/test';

test.describe('Protección y accesibilidad de Espacios y Transacciones', () => {
  test('Ruta de configuración de espacios está protegida contra accesos no autorizados', async ({ page }) => {
    await page.goto('/dashboard/settings/space');
    await expect(page).toHaveURL(/.*login/);
  });

  test('Ruta de miembros de espacio está protegida contra accesos no autorizados', async ({ page }) => {
    await page.goto('/dashboard/settings/space/members');
    await expect(page).toHaveURL(/.*login/);
  });
});
