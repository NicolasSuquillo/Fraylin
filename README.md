# Fraylin — Tienda Web, Catálogo y Panel Administrativo

Sitio web comercial, catálogo compartible en PDF, checkout con Payphone / Transferencia, seguimiento público de pedidos y panel administrativo para **Fraylin Acabados para la Construcción**.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Base de datos:** PostgreSQL / Neon con Drizzle ORM
- **Estilos:** Tailwind CSS v4 + Lucide Icons
- **Almacenamiento:** Vercel Blob (imágenes de productos, galería y avatares)
- **Pagos:** Payphone Cajita de Pagos + Transferencia / Deuna + Registro manual en tienda
- **PDFs:** `@react-pdf/renderer` (catálogo descargable y comprobantes de pedido)
- **PWA:** `@ducanh2912/next-pwa` para panel administrativo instalable en móvil

---

## Configuración local

1. Instala las dependencias:

```bash
npm install
```

2. Crea `.env.local` tomando como base `.env.example` y completa las credenciales de Neon, sesión, Vercel Blob, Payphone (si aplica) e integración con `FraylinPortal`.

3. Aplica las migraciones de Drizzle:

```bash
npm run db:migrate
```

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre `http://localhost:3000` para la tienda pública o `http://localhost:3000/admin` para el panel administrativo.

---

## Funcionalidades principales

- **Tienda y Catálogo:** Vitrina pública, búsqueda, filtros por categoría, ficha técnica y exportación de catálogo PDF.
- **Checkout y Seguimiento (`/seguimiento/[codigo]`):** Pago en línea con Payphone o por transferencia/Deuna, más consulta pública de trazabilidad y reseñas verificadas.
- **Panel Admin (`/admin`):**
  - Gestión de inventario, precios (tarjeta/transferencia/costo/margen), categorías, galería y reseñas.
  - Creación de **pedidos manuales / externos** (`/admin/orders/new`) seleccionando productos del inventario, con descuento automático de stock y sincronización inmediata hacia **FraylinPortal**.
  - Gestión de estados de entrega, cobro, comprobantes PDF y contacto directo por WhatsApp.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción (`next build --webpack`) |
| `npm run start` | Servidor de producción |
| `npm run lint` | Verificación con ESLint |
| `npm test` | Pruebas unitarias con Vitest |
| `npm run db:generate` | Genera migraciones Drizzle |
| `npm run db:migrate` | Ejecuta migraciones Drizzle |
