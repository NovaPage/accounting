# Buenas prácticas (estrictas)

## Arquitectura y capas (MCP)

- **Modelo (DB/Server)**
  - **Qué es:** migraciones SQL, funciones RPC, RLS, helpers de servidor.
  - **Reglas:**
    - SQL versionado en `supabase/migrations/*` con **comentarios**, `SET search_path=public;`, `SECURITY DEFINER` cuando aplique.
    - **Nunca** exponer lógica de negocio en la UI.
    - RLS **enable** y políticas por `space_id` (principio: _deny by default_).
    - RPC “seguro”: usa `auth.uid()` dentro de la función; evita parámetros sensibles desde cliente.

- **Contrato (tipos/schemas)**
  - **Qué es:** `src/types/*`, Zod schemas compartidos, constantes, query keys.
  - **Reglas:**
    - **Sin `any`** y sin tipos gigantes; modela **lo que consume** la UI (no toda la tabla).
    - `zod` para validar **inputs de formularios** y **payloads**.
    - **Una sola fuente** de truth para keys (`src/lib/queryKeys.ts`) y constantes (`src/lib/constants.ts`).

- **Presentación (UI/Client)**
  - **Qué es:** `src/components/*`, `src/hooks/*` (estado de UI), providers cliente.
  - **Reglas:**
    - **UI en español**, **nombres y comentarios en inglés** dentro del código.
    - Accesibilidad: `aria-*`, foco gestionado, contraste, mensajes de error útiles.
    - **Nada de IO de negocio** directo: usar server actions / SSR / hooks con fetchers dedicados.

## Frontera Server/Client (Next 15)

- **Server-only** (lleva o asume `"use server"`):
  - `src/lib/onboarding.ts`, `src/lib/space.ts`, `src/lib/supabase/server.ts`, guards SSR (`/app/.../guards`), route handlers y server actions.
  - **No** importar estos módulos desde componentes cliente.

- **Client-only** (lleva `"use client"`):
  - Componentes UI, hooks de estado (`useTransactionDrawer`), providers cliente, `getBrowserClient()`.

- **Reglas:**
  - Cookies **httpOnly**: solo escribirlas desde **Server Actions** o **Route Handlers**.
  - Resolver `spaceId` en **SSR** (guard) y pasarlo a cliente via **props** si hace falta.
  - **Prohibido** que un módulo cliente importe uno server.

## Supabase

- **Clientes**
  - `getServerComponentClient()` para RSC/Server Actions (**no** en `unstable_cache`).
  - `getRouteHandlerClient()` para handlers con escritura de cookies.
  - `getBrowserClient()` **solo** en cliente.

- **RLS y seguridad**
  - Políticas por `space_id`; nunca filtrar en UI lo que debe filtrar la DB.
  - RPC con `SECURITY DEFINER` solo cuando sea imprescindible; **limita** su alcance y registra auditoría.

- **Onboarding**
  - RPC idempotente `onboard_first_login` (grants a `authenticated`).
  - Lo invoca `ensureOnboarded()` en servidor.

## React Query

- **Keys**
  - Defínelas en `src/lib/queryKeys.ts` (única fuente).
  - Ej.: `space: ["space", spaceId]`, `accounts.list(spaceId)`.

- **Fetchers**
  - En **server** (SSR) o en client con **server action/handler** de por medio.
  - **Evita** hacer `.from()` directo desde cliente para datos sensibles. Si lo haces, garantiza RLS correcta.

- **Mutaciones**
  - Invalida keys específicas (no barres todo el cache).
  - Toasts claros en español (éxito/error), botón **disabled** durante submit.

## Formularios (RHF + Zod)

- **Schemas**
  - En `src/types/schemas/*`.
  - Validan **shape** y **mensajes** de error (español).

- **RHF**
  - `resolver: zodResolver(schema)`, `defaultValues` completos, `mode: "onSubmit"` o `"onChange"` según UX.

- **UX**
  - Estados: loading/empty/error.
  - Campos accesibles: `Label` + `Input` + `aria-invalid`/`aria-describedBy`.

## Logging & Telemetría

- `src/lib/logging.ts`: `logInfo`, `logWarn`, `logError` (no PII).
- `src/lib/telemetry.ts`: `track(event, props)` no bloqueante.
- **Niveles consistentes** y mensajes en inglés (usuario en español).

## Cookies & espacio activo

- Leer cookie en **SSR**; si falta, **onboarding** y continuar (no bloquear si no se pudo escribir).
- Persistir cookie **solo** en Server Action/Route Handler (ej.: Space Switcher).
- **Nunca** leer cookie httpOnly desde cliente.

## Accesibilidad & UX

- Focus management en modales/drawers.
- Teclas: `Esc` cierra, `Tab` navega, `Enter` confirma donde aplique.
- Empty states empáticos y en español.

## Rendimiento

- Evita renders extra: memoriza listas/tablas.
- Carga perezosa (lazy) de formularios del Drawer.
- No abuses de `suspense` sin fallback útil.

## Código y repositorio

- **Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`.
- **Ramas**: `main` estable, `develop` integración, `feat/*` corta vida.
- **ESLint/Prettier** limpios; sin `any`; `strict` TS.

---

# Responsabilidades por carpeta/archivo (tu repo actual)

## `supabase/migrations/*`

- **Responsable de:** schema, vistas/materialized, funciones RPC, grants.
- **Reglas:** cada migración atómica, comentada y con `SET search_path=public;`.

## `src/lib/supabase/*`

- `server.ts`: **crear** clientes de servidor.
- `client.ts`: **crear** cliente de navegador (singleton).
- `env.ts`: leer y validar variables.
- **Reglas:** no mezclar clientes; nunca uses `getBrowserClient()` fuera de `"use client"`.

## `src/lib/*`

- `onboarding.ts` (server-only): invoca RPC y devuelve `spaceId`; telemetría y logs.
- `space.ts` (server-only): lectura cookie, `ensureActiveSpaceId`, `fetchUserSpaces` (RPC seguro), **no** se importa en cliente.
- `constants.ts`: tipos de cuenta (`MONEY_ACCOUNT_TYPES`), monedas soportadas, nombre de cookie, expiración, etc.
- `queryKeys.ts`: **única** fuente de keys de React Query.
- `logging.ts` / `telemetry.ts`: utilidades puras, sin dependencias de UI.
- **Reglas:** comentarios en inglés; sin IO de UI.

## `src/app/*`

- **Server Components**: páginas y layouts.
- `dashboard/guards/requireSpace.ts`: garantiza `spaceId` (onboarding + fallback), **no** escribe cookie aquí.
- `dashboard/page.tsx`: check auth, llama guard, renderiza UI.
- `dashboard/settings/space/page.tsx`: SSR + actions para cambio de moneda (si aplica).
- **Reglas:** redirecciones con `redirect()`, errores de usuario en español.

## `src/components/*`

- **Cliente** puro: Forms, Drawer, Lista de cuentas, Switcher visual, NavBar, etc.
- `transactions/TransactionDrawer.tsx`: Sheet + Tabs + lazy forms; sin persistencia (Hito 2).
- `accounts/*`: lista con vista `v_account_balances`, formularios, diag. archivar.
- `layout/SpaceSwitcher*.tsx`: UI + **Server Action** para persistir cookie.
- **Reglas:** accesibilidad; no IO de negocio; props claras.

## `src/hooks/*`

- `useTransactionDrawer.ts`: estado global (Zustand); API `open`, `close`, `setType`.
- **Reglas:** UI state only; sin fetch.

## `src/providers/*`

- `QueryProvider.tsx`, `ThemeProvider.tsx`: providers raíz.
- (Si usas un provider para el Drawer, es **cliente** y no hace IO.)

## `src/types/*`

- `database.ts` (generado), `types_auth.ts`, `global.d.ts`.
- **Reglas:** no editar el generado; crea tipos de dominio pequeños (`AccountRow`, `SpaceRow`…) en `types/domain` si los añades.

## `src/components/ui/*`

- Shadcn/ui component wrappers.
- **Reglas:** no meter lógica de negocio aquí; solo UI.

---

# Flujos clave (cómo se reparte cada responsabilidad)

1. **Entrar a `/dashboard`**
   - `DashboardPage` (SSR) → `getServerComponentClient().auth.getUser()` → si no user → `redirect("/login")`.
   - Llama `requireSpace()` (SSR) → intenta cookie → si falta → `ensureOnboarded()` (server) → devuelve `spaceId`.
   - Renderiza UI (Panel) con `GlobalAddButton` y **Drawer montado** (wrapper cliente).

2. **Cambiar de espacio (navbar)**
   - `SpaceSwitcher` (cliente) lista espacios (prop SSR o endpoint seguro).
   - Al seleccionar, llama **Server Action** `selectActiveSpaceId(id)` → **escribe cookie httpOnly** → `router.refresh()`.

3. **Cuentas**
   - `AccountList` (cliente) → consulta vista `v_account_balances` (filtra tipos de dinero).
   - `AccountForm` (cliente) valida con Zod, llama **Server Action** `upsertAccount` → invalida query → toasts.
   - `ArchiveAccountDialog` (cliente) llama **Server Action** `archiveAccount`.

4. **Drawer transacciones**
   - `GlobalAddButton` abre el Drawer (Zustand).
   - `TransactionDrawer` carga perezoso `{Expense,Income,Transfer}Form` (solo validación; sin persistir en Hito 1).

---

# Anti-patrones que evitamos

- Importar módulos con `"use server"` en componentes cliente (**prohibido**).
- Escribir cookies en RSC/SSR (Next 15 lo bloquea) → solo Server Action/Route Handler.
- Hacer filtros de seguridad en UI en lugar de RLS.
- Repetir keys de React Query (usar `queryKeys.ts`).
- Duplicar literales de UI (centraliza cuando formes i18n).

---

# DoD de Hito 1 (resumen rápido)

- Primer login crea “Casa”, nominales, categorías → **OK** (RPC + grants).
- `/dashboard` garantiza `spaceId` sin parpadeos.
- Space Switcher cambia de espacio y refresca la UI.
- Página `Settings → Space` muestra/cambia moneda base (futuras operaciones).
- Página de **Cuentas**: lista desde `v_account_balances`, crear/editar/archivar con toasts.
- Drawer transacciones (esqueleto) con tabs + validación superficial.

---
