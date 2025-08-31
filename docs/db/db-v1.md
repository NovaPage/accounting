# 1) Visión general

## Objetivo

- Registrar **ingresos/gastos** y **transferencias** por **cuentas** (Bancolombia, Nequi, Efectivo, Tarjeta, etc.).
- Clasificar por **categorías** y planificar con **presupuestos**.
- Soportar **multimoneda** con trazabilidad: **monto original**, **tasa** usada y **monto en moneda base del espacio**.
- **Compartir** datos por **espacios** (p. ej. “Casa”) con **RLS** fuerte.
- Base contable de **doble partida** (journals/lines) lista para crecer a P\&L, activos, inventario, etc.

## Principios de diseño

- **Multi-tenant** por `space_id`.
- **Ledger real**: cada operación = **journal** con 1..N **journal_lines**, el journal **debe balancear** (débitos = créditos en moneda de espacio).
- **Multimoneda reproducible** por línea: `amount_original`, `currency_original`, `fx_rate_to_space`, `amount_space`.
- **RLS simple** con `is_space_member()`.
- **Crecimiento sin rehacer**: módulos nuevos se apoyan en el ledger.

---

# 2) Esquema y entidades

## Dominios/Enums

- `currency_code` (TEXT, ISO-4217, 3 letras, mayúsculas)
- `money_amount` (NUMERIC(20,6))
- `account_type` = `cash | bank | card | other`
- `member_role` = `owner | member`
- `line_direction` = `debit | credit`

> **Dinero siempre en NUMERIC**, nunca en `float`.

## Diagrama (ASCII)

```
spaces (1) ──< space_members >── (auth.users)
   │
   ├─< accounts
   │
   ├─< categories
   │
   ├─< journals ──< journal_lines >── accounts
   │                       └───(opt)── categories
   │
   └─< budgets ──< budget_items >── categories
```

> **Nota:** Storage/adjuntos se pospone a **MVP 1.1** (no es necesario ahora).

---

# 3) Tablas (campos, claves, reglas)

## 3.1 `spaces`

- **Campos**: `id`, `name`, `currency_code`, `owner_user_id`, `is_archived`, `created_at`, `updated_at`
- **Uso**: contenedor lógico multi-tenant. `currency_code` = **moneda base** del espacio.
- **Índices**: `owner_user_id`
- **Trigger**: `_upd_spaces`
- **RLS**: `select` miembros; `insert/update/delete` dueño.

## 3.2 `space_members`

- **Campos**: `space_id`, `user_id`, `role`, `joined_at` — **PK** `(space_id, user_id)`
- **RLS**: `select` miembros; `all` solo **owner** del `space`.

## 3.3 `accounts`

- **Campos**: `id`, `space_id`, `name`, `type`, `currency_code`, `opening_balance`, `allow_negative`, `is_archived`, `order_index`, `created_at`, `updated_at`
- **Único**: `(space_id, name)`
- **Uso**: Bancolombia, Nequi, Efectivo, Tarjeta; `allow_negative=true` para tarjetas.
- **Índice**: `space_id`; **trigger** `_upd_accounts`
- **RLS**: CRUD si miembro del `space`.

## 3.4 `categories`

- **Campos**: `id`, `space_id`, `name`, `parent_id`, `is_archived`, `created_at`, `updated_at`
- **Único**: `(space_id, parent_id, name)`
- **Índices**: `space_id`, `parent_id`; **trigger** `_upd_categories`
- **RLS**: CRUD si miembro del `space`.

## 3.5 `journals`

- **Campos**: `id`, `space_id`, `journal_date`, `memo`, `created_by`, `created_at`, `updated_at`
- **Índice**: `(space_id, journal_date)`; **trigger** `_upd_journals`
- **RLS**: CRUD si miembro del `space`.

## 3.6 `journal_lines`

- **Campos**: `id`, `journal_id`, `account_id`, `direction`,
  `amount_original`, `currency_original`, `fx_rate_to_space`, `amount_space`,
  `category_id?`, `memo`, `created_at`, `updated_at`
- **Índices**: `journal_id`, `account_id`, `category_id`
- **Triggers**:
  - `_calc_jline_amount_space_*` (INS/UPD) → `amount_space = round(amount_original * fx_rate_to_space, 6)`
  - `_upd_journal_lines`
  - `_journal_must_balance` (**constraint deferrable**) → el journal **debe** balancear en `amount_space`

- **RLS**: CRUD si miembro del `space` del journal.

> **Convención de asientos (recomendada):** crea dos **cuentas nominales** por espacio (tipo `other`, `allow_negative=true`):
> **`Expenses (nominal)`** y **`Income (nominal)`**.
>
> - **Gasto**: `debit` a `Expenses (nominal)` con `category_id`, `credit` a cuenta de dinero (Bancolombia/Nequi/etc.).
> - **Ingreso**: `debit` a cuenta de dinero, `credit` a `Income (nominal)` con `category_id`.
> - **Transferencia**: `debit` a destino, `credit` a origen (sin `category_id`).

> **Saldos**: omite las nominales en vistas/queries de “dinero” (ver §6.1).

## 3.7 `budgets` / `budget_items`

- **`budgets`**: `id`, `space_id`, `month` (normalizada a día 1), `currency_code`, `created_at`, `updated_at`
- **`budget_items`**: `id`, `budget_id`, `category_id`, `amount_planned`, `created_at`, `updated_at`
- **Índices**: `budgets.space_id`, `budget_items.budget_id`
- **Triggers**: `_norm_budget_month_*`, `_upd_*`
- **RLS**: CRUD para miembros (y a través del `budget` en `budget_items`).

---

# 4) Reglas de integridad y triggers

## 4.1 Timestamps

`tg_set_updated_at()` mantiene `updated_at` en tablas core.

## 4.2 `amount_space`

`tg_jline_compute_amount_space()` asegura cálculo y redondeo consistentes.

## 4.3 Balance del journal

`_journal_must_balance` (deferrable) valida que **Σ débitos – Σ créditos = 0** por journal en moneda de espacio.

---

# 5) RLS (Row-Level Security)

## 5.1 Función base

`is_space_member(p_space_id uuid)` → `exists` en `space_members` con `auth.uid()`.

## 5.2 Políticas

- `spaces`: `select` miembros; `insert/update/delete` dueño.
- `space_members`: `select` miembros; `all` solo owner.
- `accounts/categories/journals/budgets`: `using/with check` = `is_space_member(space_id)`.
- `journal_lines/budget_items`: `using/with check` a través del padre (`journals`/`budgets`).

> **Test mental**: Usuario A nunca puede ver/escribir datos de espacio B.

---

# 6) Vistas para reportes

## 6.1 `v_account_balances`

**Qué muestra:** `opening_balance + Σ(débitos – créditos)` por **cuenta** en **moneda de espacio**.
**Recomendación:** filtra **solo cuentas de dinero**:

- En UI/queries, usa `accounts.type IN ('cash','bank','card')`.
- Si prefieres incorporarlo en la vista, actualízala con ese `WHERE`.

## 6.2 `v_by_category_month`

Por **mes** y **categoría**: **débitos** (gasto) y **créditos** (ingreso) en `amount_space`.

## 6.3 `v_cashflow_month`

Por **mes**: `income_space`, `expense_space`, `net_space` (pragmático para finanzas personales).

## 6.4 `v_budget_vs_actual`

Por **mes** y **categoría**: `budget_space` vs `expense_actual_space` + `utilization_ratio`.

> Las vistas heredan RLS de tablas base; no requieren policies extra.

---

# 7) Storage (adjuntos) — **Opcional / MVP 1.1**

- **Estado actual:** **no necesario**. Los scripts **000–006** bastan para el MVP.
- **Cuándo activarlo:** si quieres **fotos de recibos/facturas**, o exportes persistentes.
- **Cómo activarlo después:** crear bucket **privado** `attachments` y añadir 4 policies (read/insert/update/delete) **desde la UI de Storage**, con la convención de ruta `name = {space_id}/{journal_id}/{filename}` y condición:

  ```
  bucket_id = 'attachments'
  and exists (
    select 1 from public.space_members m
    where m.user_id = auth.uid()
      and m.space_id::text = split_part(name, '/', 1)
  )
  ```

---

# 8) Patrones de uso (operaciones)

## 8.1 Gasto (p. ej., “Mesa 1 USD” en Nequi)

- **Journal**: `journal_date`, `memo="Mesa"`.
- **Lines**:
  1. `debit` → `Expenses (nominal)` con `category_id=Muebles`, `amount_original=1`, `currency_original=USD`, `fx_rate_to_space=TRM`.
  2. `credit` → `Nequi` por el mismo `amount_space`.

- **Efecto**: baja saldo de Nequi; gasto categorizado; journal balanceado.

## 8.2 Ingreso (salario a Bancolombia)

1. `debit` → `Bancolombia`
2. `credit` → `Income (nominal)` con `category_id=Sueldo`

## 8.3 Transferencia (Bancolombia → Nequi)

1. `debit` → `Nequi`
2. `credit` → `Bancolombia`
   _(habitualmente sin `category_id`)_

## 8.4 Tarjeta (compra y pago)

- **Compra**: `credit` a **Tarjeta** (sube deuda), `debit` a `Expenses (nominal)` con categoría.
- **Pago**: `debit` Tarjeta, `credit` Bancolombia (transferencia).

---

# 9) Rendimiento e índices

- Queries frecuentes por **space + fecha** (journals / lines) e **space + categoría** (lines).
- Paginación en listas; evita `select *` en móvil.
- Para dashboard (si crece), considerar **caché** o vistas materializadas por mes.

---

# 10) Convenciones y validaciones

- **Nombres** en **inglés** (tablas/columnas). UI en español.
- **Moneda** ISO-4217; valida en app.
- **Fechas**: `journal_date` para lógicas; `created_at` para auditoría.
- **Tasa FX**: `> 0` (CHECK + validación app).
- **Mes**: normaliza a día 1 en `budgets`.
- **Soft-delete**: `is_archived` en maestros.

---

# 11) Seguridad

- **RLS** en todas las tablas.
- `auth.uid()` se compara en `is_space_member()`.
- Operaciones administrativas/seed: usar **service role** solo en backend (nunca en cliente).

---

# 12) Migraciones

- Versiona en archivos: `000_types.sql`, `001_core.sql`, …, `006_views.sql`.
- Cambios **aditivos** cuando sea posible.
- Para columnas nuevas con datos: crea **nullable**, migra, luego `NOT NULL`/`CHECK`.

---

# 13) Pruebas recomendadas (SQL rápidas)

**Balance de un journal**

```sql
select sum(case when direction='debit' then amount_space else -amount_space end) as delta
from public.journal_lines
where journal_id = :journal_id;  -- esperado: delta = 0
```

**RLS por espacio**

```sql
-- Con un usuario A:
select 1
from public.accounts a
where a.space_id = 'SPACE_DE_OTRA_PERSONA';  -- debe devolver 0 filas
```

**Saldos por cuenta (solo dinero)**

```sql
select vab.*
from public.v_account_balances vab
join public.accounts a on a.id = vab.account_id
where a.type in ('cash','bank','card') and a.space_id = :space_id;
```

**Gasto por categoría del mes**

```sql
select *
from public.v_by_category_month
where space_id = :space_id
  and month = date_trunc('month', now())::date;
```

---

# 14) Extensiones y futuro

- **FX por fecha** (tabla de tasas + vistas “as-of”).
- **Inventario** (FIFO/WAVG) y posteo al ledger.
- **Activos** (depreciación).
- **Tags / centros de costo**.
- **Conciliación** (import CSV).
- **Materialized views** para dashboards pesados.

---

# 15) Buenas prácticas operativas

- Sembrar por espacio: `Expenses (nominal)`, `Income (nominal)` (tipo `other`, `allow_negative=true`) y **excluirlas** de saldos de “dinero”.
- Categorías base: Hogar, Alimentación, Transporte, Ocio.
- Validaciones UI: montos > 0, tasas > 0, moneda ISO, fecha válida.
- Logs: `created_by` en journals.
- Backups automáticos en Supabase.

---

## Resumen

- **Núcleo listo** con **000–006**: tablas, triggers, RLS y vistas.
- **Storage fuera del MVP** (activar en 1.1 si necesitas adjuntos).
- **Convención contable** clara con nominales para un ledger balanceado.
- **Reportes** y **presupuestos** ya soportados con el esquema actual.
