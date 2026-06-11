# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # dev server at localhost:3000
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint
npm run db:generate  # drizzle-kit generate (SQL migrations from schema)
npm run db:migrate   # drizzle-kit migrate (apply migrations to DATABASE_URL)
```

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS v4
- Drizzle ORM + `postgres-js` over Supabase Postgres (pooled/pgbouncer, `prepare: false`)
- Vercel Blob for image uploads
- Payphone "Cajita de Pagos" for online checkout (server-side Confirm)
- Lucide React for icons (category/service `icon` fields map to Lucide component names)
- Playfair Display via `next/font` (heading font; body uses Inter from CSS)

## Architecture

Public marketing site + store, plus a password-protected admin panel. Catalog, gallery, and orders live in Supabase Postgres (schema in `src/db/schema.ts`, migrations in `drizzle/`). Legacy images live under `public/`; new uploads go to Vercel Blob.

### Public site (`/`)

`src/app/page.tsx` is an async Server Component (`revalidate = 3600`; admin mutations call `revalidatePath("/")`). Product UI is grouped in `ProductsCatalog` (client component): featured carousel → full catalog → shared modal.

```
src/
  app/
    layout.tsx          # global metadata, Playfair font, CartProvider + CartDrawer
    page.tsx            # public home — async, reads catalog/gallery from DB
    checkout/           # page (server, passes Payphone env) + CheckoutClient
      respuesta/        # Payphone redirect target — finalizes/cancels order
    admin-login/        # login form → POST /api/admin/login
    admin/              # protected CRUD UI (layout checks session)
      products/         # list, new, [id]/edit
      categories/       # CategoriesManager
      gallery/          # GalleryManager
      orders/           # OrdersTable, [id] detail, fulfillment select
    api/
      checkout/         # POST — public, creates pending order (prices from DB)
      admin/            # REST handlers (session-gated)
  components/
    layout/             # Header (includes CartButton), Footer
    sections/           # HeroSection, ServiciosSection, DestacadosSection,
                        # ProductosSection, GaleriaSection, NosotrosSection, ContactoSection
    products/           # ProductsCatalog, CategoryTabs, ProductCard, ProductModal, ProductSearch
    cart/               # CartProvider (localStorage), CartDrawer, CartButton, AddToCartButton
    ui/                 # FloatingWhatsApp, ScrollToTop, SafeImage, ImageGallery,
                        # SectionHeading, Reveal (IntersectionObserver scroll-reveal),
                        # WhatsAppButton (hero/card/compact variants)
  db/
    index.ts            # drizzle(postgres(DATABASE_URL, { prepare: false }))
    schema.ts           # categories, products, product_images, gallery_items, orders, order_items
  lib/
    constants.ts        # BUSINESS object — contact info, WhatsApp, social links
    products.ts         # async read accessors over DB (maps categorySlug→category)
    gallery.ts          # async read accessor over DB
    money.ts            # formatUSD, parsePriceInput, computeTaxBreakdown (IVA 15%)
    orders.ts           # finalizeOrder/cancelOrder (idempotent), admin getters
    payphone.ts         # server-only Confirm API call
    admin-auth.ts       # HMAC-signed cookie session (24h)
    delete-public-upload.ts  # del() for Blob URLs; legacy /products|/gallery only deleted in dev
  types/index.ts        # Product, Category, GalleryItem, Service, Order, CartItem, ...
drizzle/                # SQL migrations
public/
  products/<category-slug>/   # legacy product images (static, versioned in git)
  gallery/                    # legacy gallery images
```

### Pricing & checkout (mixed mode)

- Product with `priceCents` (integer, USD cents, IVA 15% included) → buyable online: AddToCartButton, cart, Payphone checkout. `stock`: `NULL` = no control, `0` = "Agotado".
- Product without `priceCents` → quote flow: WhatsApp CTA with free-text `price` (displayPrice).
- Checkout flow: `POST /api/checkout` recalculates prices from DB, creates order `pending` + item snapshots → Cajita de Pagos widget (CDN `box/v2.0`, `PPaymentButtonBox`) → redirect to `/checkout/respuesta` → `finalizeOrder` calls Payphone Confirm server-side (single call, response persisted) → `paid` + stock decrement, atomic and idempotent (`db.transaction` + conditional UPDATE guard). Cancel (`id=0`) → `cancelled`, stock untouched. **Never mark paid from query string without Confirm.**
- Shipping is coordinated via WhatsApp after payment (address captured, not charged).

### Admin panel (`/admin/*`)

- Login at `/admin-login`; session cookie `admin_session` (httpOnly).
- `admin/layout.tsx` redirects unauthenticated users to login.
- `/admin` redirects to `/admin/products`.
- CRUD for products (incl. online price/stock), categories, gallery, and order management (fulfillment: `nuevo | coordinado | entregado`).
- Image upload via `POST /api/admin/upload` → Vercel Blob `put()` under `products/<slug>/` or `gallery/`.
- Deleting products/gallery items also removes orphaned Blob files via `tryDeletePublicUpload(s)`.

### API routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/checkout` | POST | Public — create pending order (server-side price/stock validation) |
| `/api/admin/login` | POST | Authenticate, set cookie |
| `/api/admin/logout` | POST | Clear cookie |
| `/api/admin/products` | GET, POST | List / create product |
| `/api/admin/products/[id]` | PUT, DELETE | Update / delete product |
| `/api/admin/categories` | GET, POST | List / create category |
| `/api/admin/categories/[slug]` | PUT, DELETE | Update / delete category |
| `/api/admin/gallery` | GET, PUT | Read / replace gallery items |
| `/api/admin/gallery/item` | DELETE | Remove single gallery item |
| `/api/admin/upload` | POST | Upload image to Blob (`category` or `destination=gallery`) |
| `/api/admin/orders` | GET | List orders |
| `/api/admin/orders/[id]` | GET, PATCH | Order detail / update fulfillmentStatus |

All `/api/admin/*` (except login) gate with `if (!(await getSession())) return 401` from `src/lib/admin-auth.ts`. All admin mutations end with `revalidatePath("/")`.

## Environment variables

```bash
ADMIN_PASSWORD=...    # required for admin login
SESSION_SECRET=...    # HMAC signing key (defaults to dev fallback if unset)
NEXTAUTH_URL=...      # optional; used for secure cookies and allowedDevOrigins in next.config.ts
DATABASE_URL=...      # Supabase pooled connection (pgbouncer, port 6543, prepare:false)
BLOB_READ_WRITE_TOKEN=... # Vercel Blob (auto-set on Vercel)
PAYPHONE_TOKEN=...     # Cajita de Pagos + Confirm API (security is the server-side Confirm call)
PAYPHONE_STORE_ID=...  # Cajita de Pagos (optional — empty works)
NEXT_PUBLIC_SITE_URL=... # absolute links / Payphone responseUrl
```

## Managing content

Products, categories, and gallery are managed via `/admin` (writes go to Postgres; images to Blob). Category `icon` values must match a [Lucide](https://lucide.dev/icons/) export name (e.g. `"Droplets"`, `"Grid2X2"`).

## WhatsApp integration

`buildWhatsAppUrl(number, message)` in `src/lib/constants.ts` builds `wa.me` links. Numbers stored as `BUSINESS.whatsapp[]`. Quote CTAs and post-payment shipping coordination route through WhatsApp.

## Tailwind v4 note

Config is via `postcss.config.mjs` + CSS `@import "tailwindcss"` — no `tailwind.config.js`. Brand tokens and fonts are defined in `src/app/globals.css` with `:root` + `@theme inline`.
