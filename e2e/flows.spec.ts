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

  test('Crear un nuevo espacio lo muestra como seleccionable en el selector de espacios', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Abrir el selector de espacios en el header
    const switcherBtn = page.getByRole('button', { name: /Cambiar espacio/i });
    await expect(switcherBtn).toBeVisible();
    await switcherBtn.click();

    // Clic en Crear nuevo espacio
    const createItem = page.getByRole('menuitem', { name: /Crear nuevo espacio/i });
    await expect(createItem).toBeVisible();
    await createItem.click();

    // Rellenar formulario del diálogo
    const spaceNameInput = page.getByLabel('Nombre');
    await expect(spaceNameInput).toBeVisible();
    const uniqueName = `Negocio ${Date.now().toString().slice(-4)}`;
    await spaceNameInput.fill(uniqueName);

    // Guardar
    const saveBtn = page.getByRole('button', { name: /Crear Espacio/i });
    await saveBtn.click();

    // Debe recargar al dashboard con el nuevo espacio activo
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // El botón del switcher ahora debe mostrar el nombre del nuevo espacio
    await expect(page.getByRole('button', { name: /Cambiar espacio/i })).toContainText(uniqueName, { timeout: 10000 });

    // Al abrir el dropdown de nuevo, deben verse los espacios disponibles
    await page.getByRole('button', { name: /Cambiar espacio/i }).click();
    await expect(page.getByRole('menuitem', { name: uniqueName })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Personal/i })).toBeVisible();
  });

  test('Invitar a un miembro por email lo agrega a la lista de miembros', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // 1. Navegar a Espacio -> Miembros
    await page.goto('/dashboard/settings/space/members');
    await expect(page.getByText('Gestión de Miembros')).toBeVisible({ timeout: 10000 });

    // El usuario actual debe figurar como Propietario / "Tú"
    await expect(page.getByText('Tú')).toBeVisible();
    await expect(page.getByText('Propietario').first()).toBeVisible();

    // 2. Abrir diálogo de invitar
    const inviteBtn = page.getByRole('button', { name: /Invitar/i });
    await expect(inviteBtn).toBeVisible();
    await inviteBtn.click();

    // Diálogo debe estar visible
    await expect(page.getByText('Invitar miembro')).toBeVisible({ timeout: 5000 });

    // 3. Introducir correo registrado (ej: admin@novapage.com.co)
    const emailInput = page.getByLabel('Email');
    await emailInput.fill('admin@novapage.com.co');

    // 4. Enviar invitación
    await page.getByRole('button', { name: /Enviar invitación/i }).click();

    // 5. Verificar que admin@novapage.com.co ahora aparece en la lista de miembros
    await expect(page.getByText('admin@novapage.com.co')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Miembro').first()).toBeVisible();
  });
});

