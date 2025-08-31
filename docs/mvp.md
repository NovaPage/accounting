# MVP — Finanzas personales y “Casa” compartida

## 1) Objetivo del MVP

Ayudar(te) a:

- **Registrar** ingresos y gastos por **categorías** y **cuentas**.
- **Ver** tu situación: saldo, flujo de caja, gasto por categoría.
- **Planificar** con **presupuestos** simples.
- **Soportar varias monedas** sin dolor.
- **Compartir** datos con tu pareja en el grupo **“Casa”**.
- **Exportar/Reportar** lo básico (tablas y gráficos).
- Dejar un **andamio** para crecer a contabilidad de negocios (fase siguiente).

## 2) Fuera de alcance (MVP)

- Conciliación bancaria automática / conexión a bancos.
- Facturación, impuestos, asientos contables dobles completos.
- Inventario avanzado (solo base para crecer).
- Automatizaciones complejas o IA.

---

## 3) Personas y casos de uso

- **Tú (individual)**: registrar rápidamente compras (ej. “mesa 1 USD”), ver gasto por categoría y presupuesto del mes.
- **Pareja (grupo “Casa”)**: ambos ven/crean transacciones en el mismo espacio; presupuestos y reportes compartidos.
- **Tú como negocio (fase 2)**: separar un “Espacio de negocio” para gastos de anuncios, capital, inventario y activos.

---

## 4) Funcionalidades (priorizadas)

### Fase 1 — Personal (MVP 1.0)

1. **Cuentas**: efectivo, tarjeta, banco; saldo inicial opcional.
2. **Categorías**: jerárquicas simples (p. ej., Hogar > Muebles).
3. **Transacciones**:
   - Ingreso / Gasto (más tarde Transferencia).
   - Fecha, monto, moneda, nota, categoría, cuenta.
   - **Multi-moneda**: guardar monto **original** + **tasa** usada + **moneda base** del espacio.
   - Adjuntos (ticket/foto) opcional.

4. **Presupuestos**:
   - Mensuales por categoría.
   - Progreso: gastado vs asignado.

5. **Reportes/Estadística**:
   - Gasto por categoría (torta/barras).
   - Evolución mensual (línea/área).
   - Flujo de caja (ingresos – gastos).
   - Exportar CSV.

6. **Monedas**:
   - Moneda base del espacio (ej. COP, USD).
   - Conversión al **registrar** (manual o con tasa guardada del día).
   - Mostrar totales en moneda base; ver original al pasar el mouse.

7. **Grupos (Casa, básico)**:
   - Crear grupo.
   - Invitar miembro por email (debe tener cuenta).
   - **Roles**: owner (tú), member (pareja).
   - Todo lo creado en “Casa” es visible/editable por ambos (RLS).

8. **Seguridad/Acceso**:
   - Autenticación Supabase.
   - RLS: aislamiento por `space_id` + membresía.

### Fase 1.1 — Calidad de vida

- **Transferencias** entre cuentas.
- **Recurrentes** (plantillas: arriendo, suscripciones).
- Búsqueda y filtros.
- Atajos rápidos (teclado).
- Modo offline (fuera de MVP si complica).

### Fase 2 — Negocios (MVP Business, base)

1. **Espacio de negocio** separado (como “Casa”, pero privado):
   - Cuentas del negocio (caja, banco).

2. **Gastos de anuncios** (categoría “Marketing/Ads” + etiqueta campaña).
3. **Capital**:
   - Aportes / retiros (tracking simple).

4. **Inventario básico**:
   - Ítems (nombre, SKU, costo, existencias).
   - Movimientos: compra (↑ stock, ↑ costo), ajuste, venta (↓ stock).
   - Valuación simple **FIFO** o promedio ponderado (elige uno).

5. **Activos**:
   - Alta de activo (costo, fecha).
   - Depreciación lineal (mensual) opcional.

6. **Reportes business**:
   - P\&L simplificado (ingresos – COGS – gastos).
   - Valor inventario.
   - Resumen activos.

---

## 5) Historias de usuario (clave + criterios de aceptación)

- **Como usuario,** quiero **crear un presupuesto mensual por categoría** para controlar mis gastos.
  **CA:** puedo asignar COP/USD por categoría, ver barra de progreso y alertas al 80% y 100%.
- **Como usuario,** quiero **añadir un gasto** (ej. “mesa 1 USD”) con categoría y cuenta.
  **CA:** veo el gasto en lista; totales actualizados; conversión a moneda base guardada.
- **Como usuario,** quiero **cambiar la moneda base** del espacio.
  **CA:** futuras transacciones usan esa base; las anteriores conservan su tasa registrada; reportes muestran en base.
- **Como pareja,** quiero **compartir el espacio “Casa”** para que ambos veamos y editemos lo mismo.
  **CA:** invito por email; la otra persona acepta; ambos vemos/creamos transacciones; permisos respetados.
- **Como usuario,** quiero **ver reportes claros** por categoría y mes.
  **CA:** gráficos + tablas; export CSV; filtros por fechas.

---

## 6) Modelado de datos (Supabase — tablas mínimas)

> Nombres de columnas/relaciones en inglés; UI en español.

**spaces**

- `id (uuid, pk)`, `name`, `currency_code (text)`, `owner_user_id (uuid, fk auth.users)`

**space_members**

- `space_id (fk)`, `user_id (fk)`, `role (enum: owner|member)`, `joined_at`

**accounts**

- `id`, `space_id`, `name`, `type (enum: cash|bank|card|other)`, `currency_code`, `opening_balance (numeric)`

**categories**

- `id`, `space_id`, `name`, `parent_id (nullable fk categories.id)`

**transactions**

- `id`, `space_id`, `account_id (fk)`, `type (enum: income|expense|transfer)`
- `amount_original (numeric)`, `currency_original (text)`
- `fx_rate_to_space (numeric)` _(ej. 1 USD → 4000 COP)_
- `amount_space (numeric)` _(= original × fx_rate)_
- `category_id (nullable)`, `memo (text)`, `date (date)`, `created_by (user_id)`

**transaction_splits** _(opcional si quieres dividir una compra en varias categorías)_

- `id`, `transaction_id`, `category_id`, `amount_space`

**budgets**

- `id`, `space_id`, `month (date: 2025-08-01)`, `currency_code` (= `spaces.currency_code`)

**budget_items**

- `id`, `budget_id`, `category_id`, `amount_planned (numeric)`

**recurring_rules** _(fase 1.1)_

- `id`, `space_id`, `template (jsonb: type, account_id, category_id, amount_original, currency_original, memo)`, `interval (enum)`, `next_run_at (timestamptz)`

**attachments**

- `id`, `space_id`, `transaction_id`, `file_path (storage)`

**business (fase 2)**

- `businesses` (id, space_id, name)
- `inventory_items` (id, business_id, sku, name, cost_method enum: fifo|wavg)
- `inventory_movements` (id, item_id, type: purchase|sale|adjustment, qty, unit_cost, date)
- `assets` (id, business_id, name, cost, start_date, useful_life_months)
- `asset_movements` (id, asset_id, type: add|depr|dispose, amount, date)

**RLS (idea)**

- `spaces`: owner y miembros del `space_id`.
- Todas las tablas con `space_id`: `policy using ( exists(select 1 from space_members where space_id = table.space_id and user_id = auth.uid()) )`.

---

## 7) Flujos clave

- **Alta rápida de gasto**: elegir cuenta → monto/moneda → categoría → guardar.
  - Si moneda ≠ base, pedir tasa o prellenar con la última tasa del día (manual para MVP).

- **Presupuesto mensual**: al entrar al mes, crear `budgets` + `budget_items`.
  - Barra de progreso por categoría y total.

- **Grupo “Casa”**: crear `space` → invitar email → aceptar → listo.
  - Todo se filtra por `space_id`.

- **Reportes**:
  - **Gasto por categoría** (mes seleccionable).
  - **Cashflow** por meses.
  - **Presupuesto vs real**.
  - **Export CSV** desde la tabla de transacciones filtradas.

---

## 8) Monedas — decisiones MVP

- **Moneda base por espacio** (`spaces.currency_code`).
- Guardar **monto original**, **moneda original** y **tasa usada** por transacción.
- Reportes suman `amount_space`.
- **Fuente de tasas**: MVP manual (input rápido, recordando la última usada).
  - (Futuro: proveedor de FX diario y caché por fecha).

---

## 9) Interfaz (pantallas)

- **Dashboard**: tarjetas rápidas (saldo por cuenta, gasto del mes, presupuesto, gráfico por categoría).
- **Transacciones**: tabla con filtros (fecha, cuenta, categoría, búsqueda).
- **Agregar transacción**: modal/drawer accesible desde todas.
- **Presupuestos**: vista mensual, tabla + barras.
- **Reportes**: categoría, cashflow, presupuesto vs real; descarga CSV.
- **Espacios/Grupo**: listar espacios, crear “Casa”, invitar/gestionar miembros.
- **Configuración**: moneda base, categorías, cuentas, export general.

---

## 10) Éxito y métricas

- **Time-to-Log (TTL):** < 8s para crear un gasto desde el dashboard.
- **Compleción de presupuesto:** % categorías con presupuesto asignado.
- **Retención**: usuario vuelve y registra ≥ 3 transacciones en 7 días.
- **Error rate** de RLS: 0 (sin fugas/denegaciones erróneas).
- **Navegación**: 80% acciones desde atajos o botón global “+”.

---

## 11) Roadmap sugerido (2–4 semanas por fase)

- **Semana 1–2 (MVP 1.0):**
  Cuentas, categorías, transacciones (ingreso/gasto), multi-moneda manual, reportes básicos, presupuestos simples, export CSV, grupo “Casa” con RLS.
- **Semana 3 (1.1):**
  Transferencias, recurrentes, mejoras de UX (filtros, atajos, adjuntos), pulir reportes.
- **Semana 4–6 (Fase 2 Business):**
  Espacio negocio, ads spend, capital, inventario básico (FIFO o WAVG), activos + depreciación simple, P\&L lite.

---

## 12) Backlog (ordenado)

1. Transferencias y reconciliación básica.
2. Recurrentes con notificación (sonner/toast).
3. Importación CSV (plantilla).
4. Etiquetas (tags) y centros de costo (negocio).
5. Tasas de cambio automáticas (proveedor externo).
6. Widgets de presupuesto en dashboard.
7. Multi-espacio rápidos (switch en navbar).

---
