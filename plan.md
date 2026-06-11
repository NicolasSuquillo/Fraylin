# Plan: Migración del catálogo a Supabase Postgres + Compras online con Payphone

**Proyecto:** Fraylin — Next.js 16.2.4, React 19.2.4, TypeScript, Tailwind v4, App Router.
**Objetivo:** reemplazar la persistencia JSON-en-disco por Supabase Postgres, mover uploads a Vercel Blob, y agregar carrito + checkout con Payphone (Cajita de Pagos). Deploy en Vercel.

## ⚠️ Regla obligatoria antes de codificar

`AGENTS.md` advierte: esta versión de Next.js tiene breaking changes respecto a tu training data. **Antes de escribir código de cada fase, lee la guía relevante en `node_modules/next/dist/docs/`** (Route Handlers, caching/revalidate, `next/script`, `next/image` remotePatterns, Server/Client Components, `searchParams`/`params` como Promise). No asumas APIs de memoria.

## Decisiones de producto (NO re-decidir)

1. **Deploy: Vercel.** El filesystem es efímero — todo lo que hoy escribe a disco debe migrar.
2. **Payphone: Cajita de Pagos** (widget JS embebido) + confirmación server-side vía API `V2/Confirm`.
3. **Carrito completo** (varios productos, cantidades) con persistencia en `localStorage`.
4. **Checkout como invitado**: nombre, teléfono, email, dirección. Sin cuentas de cliente.
5. **Modo mixto de precios**: producto con `priceCents` numérico → comprable online; producto sin él → solo CTA de WhatsApp para cotizar (flujo actual). El admin decide por producto.
6. **Imágenes nuevas → Vercel Blob.** Las existentes se quedan en `public/products/` y `public/gallery/` (estáticas versionadas en git, servidas por CDN de Vercel; costo cero, sin migración).
7. **Stock simple**: campo cantidad opcional por producto (`NULL` = sin control); se descuenta al confirmar pago; `0` = "Agotado". Editable en admin.
8. **Envío**: se captura la dirección pero NO se cobra en el checkout; se coordina por WhatsApp tras el pago.
9. **Precios incluyen IVA 15%** (precio final al consumidor, estándar B2C Ecuador). Todo en **centavos USD** (integer).

## Convenciones del repo a respetar

- Imports con alias `@/` (`@/lib/...`, `@/components/...`, `@/types`).
- API admin protegida con `if (!(await getSession())) return 401` usando `getSession()` de `src/lib/admin-auth.ts` — **no cambiar este mecanismo de auth**.
- Route handlers: `params` y `searchParams` son `Promise` en esta versión (`await params`).
- Textos de UI y errores en español.
- Patrón admin: `page.tsx` Server Component + componente cliente (`XxxManager.tsx`/`XxxTable.tsx`), ver `src/app/admin/products/`.

---

## Fase 0 — Preparación (sin código)

1. Crear proyecto en Supabase → obtener `DATABASE_URL` (cadena **pooled**, puerto 6543, modo "Transaction").
2. Crear store de Vercel Blob en el proyecto Vercel → `BLOB_READ_WRITE_TOKEN`.
3. Crear aplicación tipo **Cajita de Pagos** en la consola de desarrolladores de Payphone (https://docs.payphone.app) → `PAYPHONE_TOKEN` y `PAYPHONE_STORE_ID`. Configurar en la consola la **URL de respuesta**: `<dominio>/checkout/respuesta`. ⚠️ Verificar en docs si la responseUrl se configura por aplicación (consola) o por transacción.
4. Dependencias:
   ```bash
   npm i drizzle-orm postgres @vercel/blob
   npm i -D drizzle-kit tsx dotenv
   ```
5. Variables de entorno (`.env.local` y Vercel):

| Variable | Uso | Llega al navegador |
|---|---|---|
| `DATABASE_URL` | Supabase pooled (pgbouncer, puerto 6543) | No |
| `SESSION_SECRET` | Ya existe (admin auth) | No |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (auto en Vercel) | No |
| `PAYPHONE_TOKEN` | Cajita + API Confirm | Sí (la Cajita lo exige por diseño; la autoridad real es la confirmación server-side) |
| `PAYPHONE_STORE_ID` | Cajita | Sí |
| `NEXT_PUBLIC_SITE_URL` | Links absolutos / responseUrl | Sí |

**Verificación:** `npm run dev` sigue funcionando igual.

---

## Estado actual (pausa)

- **Fase 0**: proyecto Supabase creado, `.env.local` con `DATABASE_URL` (actualmente conexión directa 5432).
- **Fase 1**: código completo y type-checked —`drizzle.config.ts`, `src/db/index.ts`, `src/db/schema.ts` (incl. `orders`/`order_items` para Fase 5), `scripts/seed.ts`, scripts npm `db:generate/migrate/seed`. `db:generate` corrió OK → `drizzle/0000_bitter_albert_cleary.sql`.
- **BLOQUEADO**: `db:migrate` y `db:seed` no corren — red actual sin salida TCP a Postgres de Supabase.
  - Pooler `aws-1-us-east-2.pooler.supabase.com:6543` → timeout (3 IPs probadas).
  - Directa `db.gwbcviovpbxugqfjqqkd.supabase.co:5432` → falla DNS (host IPv6-only).
- Pendiente al retomar: resolver conectividad (otra red/VPN), decidir `DATABASE_URL` (pooled 6543) vs `DIRECT_URL` (5432, solo migraciones), correr `db:migrate` + `db:seed`, verificar conteos (8 categorías, 13 productos, 10 galería), seguir con Fase 2.

---

## Fase 1 — Esquema de BD, migraciones y seed (la web sigue leyendo JSON)

### Archivos nuevos

- `drizzle.config.ts` (raíz): `schema: "./src/db/schema.ts"`, `out: "./drizzle"`, `dialect: "postgresql"`, `dbCredentials: { url: process.env.DATABASE_URL! }`.
- `src/db/index.ts`:
  ```ts
  import { drizzle } from "drizzle-orm/postgres-js";
  import postgres from "postgres";
  import * as schema from "./schema";
  const client = postgres(process.env.DATABASE_URL!, { prepare: false }); // pgbouncer: prepare=false
  export const db = drizzle(client, { schema });
  ```
- `src/db/schema.ts` — esquema completo (incluir `relations` de Drizzle para `products ↔ product_images` y `orders ↔ order_items`):

  ```ts
  import { pgTable, text, integer, boolean, timestamp, serial, uuid, jsonb, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";

  export const categories = pgTable("categories", {
    slug: text("slug").primaryKey(),
    label: text("label").notNull(),
    icon: text("icon").notNull(),               // nombre de icono Lucide
    description: text("description"),
    position: integer("position").notNull().default(0),
  });

  export const products = pgTable("products", {
    id: text("id").primaryKey(),                // conservar IDs actuales
    categorySlug: text("category_slug").notNull()
      .references(() => categories.slug, { onUpdate: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    displayPrice: text("display_price"),        // texto libre: "Desde $95" (cotización)
    priceCents: integer("price_cents"),         // NULL => no comprable online
    stock: integer("stock"),                    // NULL => sin control; 0 => agotado
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }, (t) => [
    index("products_category_idx").on(t.categorySlug),
    index("products_featured_idx").on(t.featured),
  ]);

  export const productImages = pgTable("product_images", {
    id: serial("id").primaryKey(),
    productId: text("product_id").notNull()
      .references(() => products.id, { onDelete: "cascade", onUpdate: "cascade" }),
    src: text("src").notNull(),                 // "/products/..." (legacy) o URL de Blob
    alt: text("alt").notNull(),
    position: integer("position").notNull().default(0),
  }, (t) => [index("product_images_product_idx").on(t.productId)]);

  export const galleryItems = pgTable("gallery_items", {
    id: serial("id").primaryKey(),
    src: text("src").notNull(),
    alt: text("alt").notNull(),
    caption: text("caption"),
    position: integer("position").notNull().default(0),
  });

  export const orderStatusEnum = pgEnum("order_status",
    ["pending", "processing", "paid", "failed", "cancelled"]);

  export const orders = pgTable("orders", {
    id: uuid("id").primaryKey().defaultRandom(),
    clientTransactionId: text("client_transaction_id").notNull(), // ⚠️ verificar longitud máx. en docs Payphone
    status: orderStatusEnum("status").notNull().default("pending"),
    fulfillmentStatus: text("fulfillment_status").notNull().default("nuevo"), // nuevo|coordinado|entregado
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerAddress: text("customer_address").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),  // base imponible
    taxCents: integer("tax_cents").notNull(),            // IVA 15%
    totalCents: integer("total_cents").notNull(),        // lo que cobra Payphone
    payphoneTransactionId: text("payphone_transaction_id"),
    payphoneStatusCode: integer("payphone_status_code"),
    payphoneRaw: jsonb("payphone_raw"),                  // respuesta completa de Confirm
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  }, (t) => [
    uniqueIndex("orders_client_tx_idx").on(t.clientTransactionId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
  ]);

  export const orderItems = pgTable("order_items", {
    id: serial("id").primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id"),               // sin FK estricta: snapshot sobrevive si se borra el producto
    productName: text("product_name").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  }, (t) => [index("order_items_order_idx").on(t.orderId)]);
  ```

- `scripts/seed.ts`: carga `dotenv` (`.env.local`), lee `src/data/products.json` y `src/data/gallery.json` con `readFileSync`, inserta categorías/productos/imágenes/galería conservando IDs y orden (`position` = índice del array). Mapeo: `price` texto → `displayPrice`; `priceCents = null`; `stock = null`. Idempotente (`onConflictDoNothing()` o flag `--reset` que trunca catálogo). **No borrar los JSON todavía.**
- Scripts npm: `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`, `"db:seed": "tsx scripts/seed.ts"`.

**Verificación:** `npm run db:generate && npm run db:migrate && npm run db:seed` sin errores; en Supabase: 8 `categories`, 13 `products`, imágenes y galería pobladas. La web sigue sirviendo desde JSON.

---

## Fase 2 — Capa de datos sobre Postgres (la web cambia de fuente, idéntica visualmente)

### Tipos (`src/types/index.ts`)

Extender `Product` manteniendo compatibilidad con componentes existentes:
```ts
export interface Product {
  id: string;
  category: string;          // = categorySlug (mantener nombre para no tocar componentes)
  name: string;
  price?: string;            // = displayPrice (texto, cotización)
  priceCents?: number | null;
  stock?: number | null;
  description?: string;
  images: ProductImage[];
  featured?: boolean;
}
```
Tipos nuevos: `OrderStatus`, `Order`, `OrderItem`, `CartItem { productId, name, priceCents, image, quantity, stock }`, `CheckoutCustomer { name, phone, email, address }`.

### Helper nuevo `src/lib/money.ts`

- `formatUSD(cents: number): string` → `"$12.50"`
- `parsePriceInput(input: string): number | null` → admin escribe `"12.50"` → `1250`
- `computeTaxBreakdown(totalCents: number): { subtotalCents; taxCents }` → `subtotal = Math.round(total / 1.15)`, `tax = total - subtotal`

### `src/lib/products.ts` y `src/lib/gallery.ts` — reescribir async sobre Drizzle

```ts
export async function getAllProducts(): Promise<Product[]>
export async function getCategories(): Promise<Category[]>
export async function getFeaturedProducts(): Promise<Product[]>
export async function getProductsByCategory(slug: string): Promise<Product[]>
export async function getGalleryItems(): Promise<GalleryItem[]>
```
Usar `db.query.products.findMany({ with: { images: ... } })` con imágenes ordenadas por `position`; mapear `categorySlug → category`, `displayPrice → price`.

### `src/app/page.tsx`

`export default async function Home()` + `Promise.all` de los cuatro getters. **Caching:** la página deja de ser SSG pura — usar ISR (`export const revalidate = 3600`) + `revalidatePath("/")` desde cada mutación admin para refresco inmediato. ⚠️ Leer la doc local de Next sobre el modelo de caché de ESTA versión (puede usar `"use cache"` / `cacheLife` / etc.) y adoptar el mecanismo que indique.

### API admin → queries (reemplazar `fs`, mantener rutas, contratos JSON y validaciones)

- `src/app/api/admin/products/route.ts`: `GET` devuelve `{ products, categories }` desde BD (mismo shape actual); `POST` inserta producto + imágenes; 409 si id existe.
- `src/app/api/admin/products/[id]/route.ts`: `PUT` actualiza producto y borra/reinserta `product_images`; detectar imágenes huérfanas como hoy y limpiarlas; `DELETE` elimina (cascade) + limpieza de archivos.
- `src/app/api/admin/categories/route.ts` y `[slug]/route.ts`: CRUD sobre `categories`; mantener el 409 si la categoría tiene productos al eliminar; renombre de slug vía update del PK (el `onUpdate: cascade` propaga).
- `src/app/api/admin/gallery/route.ts` y `gallery/item/route.ts`: CRUD sobre `gallery_items` respetando `position`.
- **Todas las mutaciones terminan con `revalidatePath("/")`.**
- `ProductForm.tsx` (admin): añadir campos **"Precio online (USD)"** (numérico opcional → `priceCents` vía `parsePriceInput`) y **"Stock"** (numérico opcional, vacío = sin control). El campo `price` texto existente se re-etiqueta "Precio referencial / texto (cotización)".

**Verificación:** `npm run build` pasa; home idéntica visualmente; CRUD completo en `/admin` funciona y los cambios aparecen en la home; `grep products.json` solo aparece en `scripts/seed.ts`.

---

## Fase 3 — Uploads a Vercel Blob

- Reescribir `src/app/api/admin/upload/route.ts`: misma validación MIME y sanitización de nombre; reemplazar `mkdirSync/writeFileSync` por:
  ```ts
  const blob = await put(`products/${category}/${filename}`, file, { access: "public" });
  return NextResponse.json({ src: blob.url }, { status: 201 });
  ```
  (o `gallery/${filename}`). ⚠️ Límite de body ~4.5 MB en Vercel: si las fotos lo superan, usar client uploads de `@vercel/blob` (`upload` + `handleUpload`) según su doc.
- `src/lib/delete-public-upload.ts`: nueva `tryDeleteUploads(srcs: string[])` — si `src` es URL de Blob (`https://...blob.vercel-storage.com`) → `del(src)`; si empieza con `/products/` o `/gallery/` → no-op en producción (estáticos del repo), borrado local solo en dev. Actualizar call-sites.
- `next.config.ts`: `images.remotePatterns` para `*.public.blob.vercel-storage.com` (⚠️ sintaxis exacta en doc local de Next).

**Verificación:** subir imagen desde admin devuelve URL de Blob y se renderiza en home y admin; borrar producto con imagen Blob la elimina del store; imágenes antiguas de `/public` siguen funcionando.

---

## Fase 4 — Carrito (client-side)

### Componentes nuevos (`src/components/cart/`)

- `CartProvider.tsx` (`"use client"`): Context con
  ```ts
  interface CartContextValue {
    items: CartItem[];
    addItem(item: Omit<CartItem, "quantity">, qty?: number): void;
    removeItem(productId: string): void;
    setQuantity(productId: string, qty: number): void;
    clear(): void;
    totalCents: number;
    count: number;
    isOpen: boolean; open(): void; close(): void;
  }
  export function useCart(): CartContextValue
  ```
  Persistencia en `localStorage` (clave `fraylin_cart_v1`), hidratación en `useEffect` (evitar mismatch SSR). Cantidad limitada por `stock` cuando no es null.
- `CartButton.tsx`: icono `ShoppingCart` (lucide) + badge `count`; abre drawer.
- `CartDrawer.tsx`: panel lateral — líneas (imagen, nombre, `formatUSD`, stepper, eliminar), total, botón "Finalizar compra" → `/checkout`, nota "El envío se coordina por WhatsApp".
- `AddToCartButton.tsx`: botón con selector de cantidad; deshabilitado con "Agotado" si `stock === 0`.

### Integraciones en existentes

- `src/app/layout.tsx`: envolver `{children}` en `<CartProvider>` (server layout + provider cliente con children — patrón estándar) y montar `<CartDrawer />`.
- `src/components/layout/Header.tsx`: añadir `<CartButton />`.
- `src/components/products/ProductModal.tsx`: `const buyable = product.priceCents != null;` — si buyable: precio `formatUSD`, `<AddToCartButton>`, WhatsApp debajo como alternativa; si no: flujo actual (solo WhatsApp con `price` texto).
- `src/components/products/ProductCard.tsx`: mostrar `formatUSD(priceCents)` si existe, sino `price` texto; overlay "Agotado" si `buyable && stock === 0`.

**Verificación:** agregar/quitar/cambiar cantidades funciona y persiste tras recargar; badge correcto; productos sin `priceCents` no muestran botón de carrito; `npm run build` sin errores de boundaries.

---

## Fase 5 — Checkout + Payphone Cajita

### 5.1 `src/app/api/checkout/route.ts` (nuevo, público)

`POST { customer: CheckoutCustomer, items: { productId, quantity }[] }`:
1. Validar campos no vacíos, quantities enteros ≥ 1.
2. **Recalcular precios desde BD — nunca confiar en el cliente.** 400 si algún producto no existe, no tiene `priceCents`, o `stock !== null && stock < quantity`.
3. `computeTaxBreakdown` → `subtotalCents`, `taxCents`, `totalCents`.
4. Generar `clientTransactionId` único corto (ej. `FR` + base36 timestamp + random). ⚠️ Verificar longitud/charset máximo en docs Payphone.
5. Insertar `orders` (`pending`) + `order_items` (snapshot de nombre y precio).
6. Responder `{ orderId, clientTransactionId, totalCents, subtotalCents, taxCents }`.

### 5.2 `src/app/checkout/page.tsx` (server) + `CheckoutClient.tsx` (cliente)

- `page.tsx` lee `process.env.PAYPHONE_TOKEN` / `PAYPHONE_STORE_ID` y los pasa como props (la Cajita los necesita en el navegador por diseño; la seguridad real es la confirmación server-side).
- `CheckoutClient.tsx`, dos pasos:
  1. Resumen del carrito + formulario invitado → `POST /api/checkout`. Si 400 por stock: mostrar mensaje y ajustar carrito.
  2. Renderizar la Cajita:
     - Cargar JS y CSS del CDN de Payphone con `next/script` (lazy). ⚠️ **Verificar URLs y versión exactas del CDN en docs oficiales** (orientativo: `https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js` y `.css`).
     - Inicializar (⚠️ verificar nombres exactos de parámetros en docs; montos SIEMPRE en centavos y la suma debe cuadrar o Payphone rechaza):
       ```js
       new PPaymentButtonBox({
         token, storeId,
         clientTransactionId,
         amount: totalCents,
         amountWithTax: subtotalCents,   // base gravada con IVA
         tax: taxCents,
         amountWithoutTax: 0, service: 0, tip: 0,
         currency: "USD",
         reference: `Pedido Fraylin ${clientTransactionId}`,
         lang: "es",
       }).render("pp-button");
       ```
     - `<div id="pp-button" />` como target.
- Guardar `clientTransactionId`/`orderId` en `sessionStorage` para que la página de respuesta limpie el carrito.

### 5.3 Confirmación

- `src/lib/payphone.ts` (server-only):
  ```ts
  export async function confirmPayphoneTransaction(id: number, clientTxId: string): Promise<PayphoneConfirmResponse>
  // POST https://pay.payphonetodoesposible.com/api/button/V2/Confirm
  // Authorization: Bearer PAYPHONE_TOKEN — body { id, clientTxId }
  ```
  ⚠️ Verificar URL base, nombres de campos y códigos (orientativo: `statusCode 3` = aprobado, `2` = cancelado). **Confirm solo puede llamarse UNA vez por transacción** — persistir la respuesta completa.
- `src/lib/orders.ts`: `finalizeOrder(orderId, payphoneId)`:
  1. **Guard de idempotencia**: `UPDATE orders SET status='processing' WHERE id=$1 AND status='pending' RETURNING *`. Si 0 filas → ya confirmada/en proceso → releer y devolver estado actual. (Con `postgres-js` sí hay transacciones interactivas reales — usar `db.transaction()` para guard + descuento de stock atómico.)
  2. Llamar `confirmPayphoneTransaction`.
  3. Aprobada → `status='paid'`, guardar `payphoneTransactionId`, `payphoneStatusCode`, `payphoneRaw`, `confirmedAt`; descontar stock por item: `UPDATE products SET stock = GREATEST(stock - qty, 0) WHERE id=$x AND stock IS NOT NULL`.
  4. Cancelada/fallida → `status='cancelled'`/`'failed'` + guardar raw. **Nunca marcar pagado por query string sin Confirm.**
- `src/app/checkout/respuesta/page.tsx` (Server Component dinámico): `await searchParams` con `id` y `clientTransactionId`. ⚠️ Verificar nombres exactos de los query params del redirect y qué llega al **cancelar** (típico: `id=0`). Buscar orden por `clientTransactionId`; si `id` válido → `finalizeOrder`. Render:
  - Pagado: éxito + resumen + botón WhatsApp prearmado (`buildWhatsAppUrl(BUSINESS.whatsapp[0].number, "Hola, acabo de pagar el pedido <clientTransactionId>...")`) para coordinar envío + componente cliente `ClearCartOnSuccess.tsx` que llama `clear()`.
  - Cancelado/fallido: mensaje + volver a `/checkout` (carrito intacto).

**Verificación:** con credenciales de prueba de Payphone: carrito → formulario → orden `pending` → Cajita → pago de prueba → redirect → orden `paid`, stock descontado **exactamente una vez** (recargar la página de respuesta NO debe duplicar descuento ni re-llamar Confirm); cancelación marca `cancelled` sin tocar stock.

---

## Fase 6 — Admin de pedidos

- `src/app/admin/orders/page.tsx` (server, patrón de `admin/products/page.tsx`): lista desc por fecha.
- `src/app/admin/orders/OrdersTable.tsx` (cliente): fecha, cliente, teléfono, total (`formatUSD`), badge de estado, link a detalle.
- `src/app/admin/orders/[id]/page.tsx`: detalle — items, montos, datos y dirección del cliente, IDs Payphone, botón WhatsApp al cliente, select de `fulfillmentStatus` (`nuevo | coordinado | entregado`).
- `src/app/api/admin/orders/route.ts` (`GET`) y `src/app/api/admin/orders/[id]/route.ts` (`GET`, `PATCH` fulfillment) — protegidos con `getSession()`.
- Navegación admin: añadir entrada "Pedidos".

**Verificación:** pedidos de prueba visibles en `/admin/orders`; detalle correcto; 401 sin sesión.

---

## Fase 7 — Deploy y limpieza

1. Env vars en Vercel (Production y Preview; token de prueba de Payphone en Preview si existe).
2. `npm run db:migrate` y `npm run db:seed` contra Supabase de producción.
3. Configurar responseUrl de producción en la consola Payphone.
4. Smoke test en producción con un pago real pequeño; reembolsar si aplica.
5. Limpieza: eliminar `src/data/products.json`, `src/data/gallery.json` y código `fs` muerto; actualizar `CLAUDE.md`/`AGENTS.md` con la nueva arquitectura (BD, Blob, Payphone, scripts `db:*`).

---

## Riesgos / consulta obligatoria a docs oficiales

1. **CDN y versión de la Cajita** (`payphone-payment-box.js/.css`) y nombre del constructor (`PPaymentButtonBox`) — verificar en https://docs.payphone.app.
2. **Parámetros de la Cajita**: semántica exacta de `amount / amountWithTax / amountWithoutTax / tax / service / tip` (centavos; la suma debe cuadrar), `currency`, `reference`, longitud y unicidad de `clientTransactionId`.
3. **Endpoint Confirm V2**: URL, shape del body (`id`, `clientTxId` vs `clientTransactionId`), códigos de estado, y la regla de **una sola llamada por transacción**.
4. **responseUrl**: dónde se configura y query params exactos del redirect, incluido el caso de cancelación.
5. **Modelo de caché de Next 16.2.4**: leer `node_modules/next/dist/docs/` antes de implementar ISR/revalidación.
6. **Pool de Supabase**: usar la cadena pooled (pgbouncer, puerto 6543, modo "Transaction") con `prepare: false` en `postgres-js`. No implementar descuento de stock sin idempotencia (guard de UPDATE condicional + `db.transaction()`).
7. **Límite de upload en Vercel** (~4.5 MB): client uploads de `@vercel/blob` si hace falta.
8. **Token Payphone en el cliente**: inherente al diseño de la Cajita; mitigación = recálculo server-side de montos + Confirm obligatorio.
9. **Oversell**: el stock no se reserva en `pending`; aceptable a esta escala (se valida al crear orden, se descuenta al confirmar con `GREATEST(...,0)`).
