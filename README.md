# Accounting App

Este proyecto es una aplicación web desarrollada con [Next.js](https://nextjs.org), diseñada como base para sistemas contables modernos. Ha sido inicializada con [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) y sigue las mejores prácticas de desarrollo frontend.

## Características

- **Next.js 15+**: Arquitectura basada en el App Router.
- **Tipado Estricto**: Uso de TypeScript en todo el proyecto.
- **Gestión de Temas**: Implementación de [`ThemeProvider`](src/providers/ThemeProvider.tsx).
- **Gestión de Datos**: [`QueryProvider`](src/providers/QueryProvider.tsx) para manejo eficiente de datos.
- **Componentes Reutilizables**: Barra de navegación, pie de página y sistema de notificaciones.
- **Optimización de Fuentes**: Uso de [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) y [Geist](https://vercel.com/font).
- **Analítica y Rendimiento**: Integración con [Vercel Analytics](https://vercel.com/analytics) y Speed Insights.
- **Linting y Formateo**: Configuración con ESLint, Prettier y Husky para calidad de código.
- **Despliegue sencillo**: Preparado para Vercel.

## Estructura del Proyecto

```
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── providers/
│   └── ...
├── public/
├── docs/
├── .next/
├── .github/
│   └── workflows/
├── .husky/
│   └── pre-commit
├── package.json
├── tsconfig.json
├── ...
```

## Instalación

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd accounting
   ```
2. Instala las dependencias:
   ```bash
   pnpm install
   # o npm install, yarn install, bun install
   ```

## Uso en Desarrollo

Inicia el servidor de desarrollo:

```bash
pnpm dev
# o npm run dev, yarn dev, bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts Útiles

- `pnpm dev` — Inicia el servidor de desarrollo.
- `pnpm build` — Compila la aplicación para producción.
- `pnpm lint` — Ejecuta ESLint.
- `pnpm format` — Formatea el código con Prettier.

## Calidad de Código

- **ESLint**: Configuración en [.eslintrc.cjs](.eslintrc.cjs) y [eslint.config.mjs](eslint.config.mjs).
- **Prettier**: Configuración en [.prettierrc](.prettierrc).
- **Husky**: Pre-commit hooks en [.husky/pre-commit](.husky/pre-commit).
- **Lint-Staged**: Configuración en [.lintstagedrc.json](.lintstagedrc.json).

## Despliegue

La forma más sencilla de desplegar es usando [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Consulta la [documentación oficial de Next.js para despliegue](https://nextjs.org/docs/app/building-your-application/deploying).

## Personalización

Puedes comenzar a editar la página principal en [`src/app/page.tsx`](src/app/page.tsx). El proyecto está preparado para que agregues nuevas rutas y componentes fácilmente.

## Recursos

- [Documentación Next.js](https://nextjs.org/docs)
- [Tutorial interactivo Next.js](https://nextjs.org/learn)
- [Repositorio Next.js en GitHub](https://github.com/vercel/next.js)

---
