## Milestone: **MVP 1.0 — Personal & “Casa”**

**Objetivo:** Cuentas, categorías, transacciones (ingreso/gasto), multi-moneda manual, presupuestos, reportes básicos, espacio compartido.

### 1) Fundamentos de producto (UX/seguridad/app)

**Issue:** **App shell + navegación inicial (Dashboard, Transacciones, Presupuestos, Reportes, Configuración)**
**Descripción:** Estructura de rutas, layout, navbar con cambio de sección y espacio activo, estado de carga vacíos.
**CA:**

- Secciones accesibles desde navbar.
- “Space switcher” visible (aunque solo haya 1).
- Estados “sin datos” claros.
  **DoD:** Navegación sin errores; a11y básica (focus visible, labels).

**Issue:** **Onboarding: crear espacio por defecto tras primer login**
**Descripción:** Si el usuario no tiene espacio, crear “Casa” con moneda base configurada.
**CA:** Tras login inicial, existe 1 espacio “Casa”; muestra moneda base y categorías iniciales.
**DoD:** Redirección estable a Dashboard; sin duplicados en recargas.

---

### 2) Cuentas y Categorías

**Issue:** **CRUD de Cuentas (efectivo, tarjeta, banco, otro)**
**Descripción:** Crear/editar/eliminar cuentas con saldo inicial y moneda de la cuenta.
**CA:** Puedo crear al menos 2 cuentas y ver saldos.
**DoD:** Validaciones (nombre único por espacio), feedback de éxito/error.

**Issue:** **CRUD de Categorías (con soporte jerárquico simple)**
**Descripción:** Crear/editar/eliminar categorías; opcional parent (1 nivel).
**CA:** Puedo crear “Hogar > Muebles” y asignar a transacciones.
**DoD:** Evita loops parent = self; nombre único por espacio.

---

### 3) Transacciones & Multi-moneda (manual)

**Issue:** **Alta rápida de Gasto / Ingreso**
**Descripción:** Form para registrar monto original, moneda original, tasa a moneda base, cuenta, categoría, fecha, nota.
**CA:** Guardado exitoso; aparece en lista; totales actualizados.
**DoD:** Validaciones (monto > 0, tasa > 0, fecha válida); feedback; atajo “+”.

**Issue:** **Lista de transacciones con filtros**
**Descripción:** Tabla con paginación, filtros por rango de fechas, cuenta, categoría, tipo.
**CA:** Filtros combinables; limpieza de filtros; exportación respeta filtros (ver issue de export).
**DoD:** Rendimiento fluido; columnas esenciales visibles.

**Issue:** **Moneda base del espacio + conversión manual**
**Descripción:** En Configuración, elegir moneda base; al crear transacción en otra moneda, ingresar tasa manual.
**CA:** Totales en dashboard/reportes se muestran en moneda base; detalle muestra valor original + tasa.
**DoD:** Cambio de moneda base solo afecta transacciones futuras; las anteriores mantienen sus valores convertidos.

---

### 4) Presupuestos

**Issue:** **Presupuesto mensual por categoría**
**Descripción:** Crear presupuesto del mes; asignar montos por categoría.
**CA:** Barra de progreso por categoría (gastado vs plan), alertas al 80% y 100%.
**DoD:** Mes normalizado (día 1); UI para copiar presupuesto del mes previo.

**Issue:** **Dashboard de presupuesto**
**Descripción:** Tarjetas/resumen de ejecución presupuestal del mes.
**CA:** Total asignado, gastado y % de utilización por categoría y total.
**DoD:** Estados “sin presupuesto” y “sin transacciones” tratados.

---

### 5) Reportes & Export

**Issue:** **Reporte: Gasto por categoría (mes)**
**Descripción:** Gráfico (torta o barras) + tabla con totales por categoría en moneda base.
**CA:** Selector de mes; drill-down abre lista filtrada.
**DoD:** Numeración/formatos locales coherentes.

**Issue:** **Reporte: Cashflow por mes**
**Descripción:** Serie mensual (ingresos, gastos y neto).
**CA:** Selección de rango (últimos 6/12 meses).
**DoD:** Línea/área clara; hover con valores.

**Issue:** **Export CSV de transacciones**
**Descripción:** Descargar CSV con columnas clave y filtros aplicados.
**CA:** Archivo abre en Excel/Sheets; separador consistente; fechas ISO.
**DoD:** Valores numéricos sin símbolos; incluye moneda original y convertida.

---

### 6) Grupo “Casa” (compartido)

**Issue:** **Gestión de miembros del espacio (invitar/expulsar, roles owner/member)**
**Descripción:** Invitar por email; listado de miembros; quitar acceso.
**CA:** Al invitar, el miembro ve y crea transacciones del mismo espacio.
**DoD:** Solo owner puede invitar/quitar; feedback claro.

**Issue:** **Selector de espacio y aislamiento de datos**
**Descripción:** Cambiar entre espacios desde navbar; todo filtra por espacio activo.
**CA:** Transacciones, cuentas, categorías, presupuestos y reportes cambian con el espacio.
**DoD:** Sin “fugas” entre espacios al navegar o filtrar.

---

### 7) Calidad de UX (dentro del MVP)

**Issue:** **Crear transacción desde cualquier vista (botón global “+”)**
**Descripción:** Botón fijo con modal/drawer de alta rápida.
**CA:** Abre el mismo form; respeta espacio/moneda por defecto.
**DoD:** Atajo de teclado (p. ej., `Shift + N`).

**Issue:** **Toasts y estados vacíos**
**Descripción:** Mensajes de éxito/error; placeholders útiles sin datos.
**CA:** Consistencia de mensajes y estilos.
**DoD:** Sin duplicación de strings; accesibles (`aria-live`).

---

## Milestone: **MVP 1.1 — Quality of Life**

**Objetivo:** Transferencias, recurrentes, adjuntos, búsqueda avanzada.

**Issue:** **Transferencias entre cuentas**
**Descripción:** Flujo para mover fondos entre cuentas, sin afectar gasto/ingreso neto.
**CA:** Debita una, acredita otra; aparece como “transfer”.
**DoD:** No duplica en reportes de gasto/ingreso.

**Issue:** **Transacciones recurrentes (plantillas)**
**Descripción:** Crear reglas simples (mensual/semanal) con recordatorio y pre-llenado.
**CA:** Generación manual (click “aplicar ahora”); vista de próximas.
**DoD:** Evita duplicados si se aplica dos veces.

**Issue:** **Adjuntos en transacciones (recibos)**
**Descripción:** Subir/ver/borrar archivos por transacción.
**CA:** Vista previa miniatura + descarga.
**DoD:** Límite de tamaño y tipo; mensajes claros.

**Issue:** **Búsqueda y filtros avanzados**
**Descripción:** Texto libre + filtros combinables (rango, cuenta, categoría, tipo, min/max).
**CA:** Persistencia temporal de filtros al navegar.
**DoD:** Rendimiento con lista grande.

**Issue:** **Importación CSV (plantilla)**
**Descripción:** Subir CSV con columnas estándar; mapeo de categorías opcional.
**CA:** Vista previa y validación antes de importar.
**DoD:** Reporte de errores y filas saltadas.

---

## Milestone: **Fase 2 — Negocio (base)**

**Objetivo:** Estructura mínima para contabilidad simple de negocio.

**Issue:** **Espacio de negocio (separado de “Casa”)**
**Descripción:** Crear espacio “Negocio” con cuentas propias; switch entre espacios.
**CA:** Aislamiento total de datos.
**DoD:** UI deja claro en qué espacio estás.

**Issue:** **Seguimiento de gasto en anuncios**
**Descripción:** Categoría “Marketing/Ads” + etiqueta de campaña; reporte por campaña.
**CA:** Ver total por campaña y periodo.
**DoD:** Export de campañas a CSV.

**Issue:** **Capital: aportes y retiros**
**Descripción:** Registro simple de aportes/retiros como transacciones de tipo capital.
**CA:** Resumen de capital neto en dashboard negocio.
**DoD:** No contamina gasto operativo.

**Issue:** **Inventario básico (items + movimientos)**
**Descripción:** Alta de ítems (SKU, nombre, costo), movimientos (compra/venta/ajuste) y existencias.
**CA:** Stock actual correcto; costo unitario por método elegido (FIFO o promedio).
**DoD:** Validaciones de stock negativo (según política).

**Issue:** **Activos y depreciación lineal**
**Descripción:** Alta de activos con costo, vida útil y depreciación mensual simple.
**CA:** Tabla de depreciaciones por mes.
**DoD:** Baja/venta de activo con ajuste.

**Issue:** **Reporte P\&L simplificado**
**Descripción:** Ingresos – COGS – gastos (operativos y marketing).
**CA:** Selección de periodo; ver neto.
**DoD:** Export CSV.

---

## Sugerencia de **labels** (para usar en GitHub)

- `type:feature`, `type:bug`, `type:docs`, `type:chore`
- `area:ui`, `area:api`, `area:data`, `area:auth`
- `priority:p0`, `priority:p1`, `priority:p2`
- `good first issue`, `help wanted`

## Sugerencia de **estimación** (story points)

- S: 1–2 pts · M: 3–5 pts · L: 8–13 pts
  (Asignar a cada issue al crearlo.)

---
