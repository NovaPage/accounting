import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación y Protección de Rutas', () => {
  test('La página de login carga correctamente con el título y elementos de UI', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Orbit/);
    await expect(page.getByText('Inicia sesión')).toBeVisible();
    await expect(page.getByText('Continuar con Google')).toBeVisible();
    await expect(page.getByRole('tab', { name: /Iniciar sesión/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Entrar$/i })).toBeVisible();
  });

  test('Permite alternar entre pestañas Iniciar sesión y Crear cuenta', async ({ page }) => {
    await page.goto('/login');
    const tabSignup = page.getByRole('tab', { name: /Crear cuenta/i });
    await expect(tabSignup).toBeVisible();
    await tabSignup.click();

    await expect(page.getByRole('button', { name: /Crear cuenta/i })).toBeVisible();
    await expect(page.getByLabel(/Confirmar contraseña/i)).toBeVisible();
  });

  test('Validación de formulario de login muestra errores en campos vacíos o inválidos', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.getByRole('button', { name: /^Entrar$/i });
    await submitBtn.click();
    await expect(page.getByText(/Correo inválido/i)).toBeVisible();
  });

  test('Rutas protegidas redirigen al login cuando no hay sesión activa', async ({ page }) => {
    const protectedPaths = [
      '/dashboard',
      '/dashboard/settings/profile',
      '/dashboard/settings/space',
      '/dashboard/reports',
    ];

    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp('.*login.*'));
    }
  });
});
