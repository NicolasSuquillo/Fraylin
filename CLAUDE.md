# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # dev server at localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint
```

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS v4
- Lucide React for icons (category/service `icon` fields in JSON map to Lucide component names)
- Playfair Display via `next/font` (heading font; body uses Inter from CSS)

## Architecture

Public marketing site plus a password-protected admin panel. No database — catalog and gallery persist as JSON files on disk; images live under `public/`.

### Public site (`/`)

`src/app/page.tsx` composes all sections top-to-bottom. Product UI is grouped in `ProductsCatalog` (client component): featured carousel → full catalog → shared modal.

```
src/
  app/
    layout.tsx          # global metadata, Playfair font, hero image preloads
    page.tsx            # public home — section composition
    admin-login/        # login form → POST /api/admin/login
    admin/              # protected CRUD UI (layout checks session)
      products/         # list, new, [id]/edit
      categories/       # CategoriesManager
      gallery/          # GalleryManager
    api/admin/          # REST handlers (session-gated, write JSON + files)
  components/
    layout/             # Header, Footer
    sections/           # HeroSection, ServiciosSection, DestacadosSection,
                        # ProductosSection, GaleriaSection, NosotrosSection, ContactoSection
    products/           # ProductsCatalog, CategoryTabs, ProductCard, ProductModal, ProductSearch
    ui/                 # FloatingWhatsApp, ScrollToTop, SafeImage, ImageGallery,
                        # SectionHeading, Reveal (no-op wrapper)
  lib/
    constants.ts        # BUSINESS object — contact info, WhatsApp, social links
    products.ts         # read accessors over products.json
    gallery.ts          # read accessor over gallery.json
    admin-auth.ts       # HMAC-signed cookie session (24h)
    delete-public-upload.ts  # safe cleanup of uploaded images on delete
  types/index.ts        # Product, Category, GalleryItem, Service
  data/
    products.json       # categories + products arrays
    gallery.json        # { items: GalleryItem[] }
public/
  products/<category-slug>/   # product images
  gallery/                    # gallery images
```

### Admin panel (`/admin/*`)

- Login at `/admin-login`; session cookie `admin_session` (httpOnly).
- `admin/layout.tsx` redirects unauthenticated users to login.
- `/admin` redirects to `/admin/products`.
- CRUD for products, categories, and gallery items via `src/app/api/admin/*`.
- Image upload via `POST /api/admin/upload` → writes to `public/products/<slug>/` or `public/gallery/`.
- Deleting products/gallery items also removes orphaned files via `tryDeletePublicUpload(s)`.

### API routes (all require session except login)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/login` | POST | Authenticate, set cookie |
| `/api/admin/logout` | POST | Clear cookie |
| `/api/admin/products` | GET, POST | List / create product |
| `/api/admin/products/[id]` | PUT, DELETE | Update / delete product |
| `/api/admin/categories` | GET, POST | List / create category |
| `/api/admin/categories/[slug]` | PUT, DELETE | Update / delete category |
| `/api/admin/gallery` | GET, PUT | Read / replace gallery items |
| `/api/admin/gallery/item` | DELETE | Remove single gallery item |
| `/api/admin/upload` | POST | Upload image (`category` or `destination=gallery`) |

## Environment variables

```bash
ADMIN_PASSWORD=...    # required for admin login
SESSION_SECRET=...    # HMAC signing key (defaults to dev fallback if unset)
NEXTAUTH_URL=...      # optional; used for secure cookies and allowedDevOrigins in next.config.ts
```

## Adding products

**Via admin:** `/admin/products/new` — form uploads images and writes to `products.json`.

**Manually:** edit `src/data/products.json`. Each product needs `id`, `category` (matching a category `slug`), `name`, `images` (array of `{src, alt}`). Optional: `price`, `description`, `featured`.

Images go in `public/products/<category-slug>/`.

Category `icon` values must match a [Lucide](https://lucide.dev/icons/) export name (e.g. `"Droplets"`, `"Grid2X2"`).

## Gallery

Edit via `/admin/gallery` or manually in `src/data/gallery.json` (`items` array with `src`, `alt`, optional `caption`). Images in `public/gallery/`.

## WhatsApp integration

`buildWhatsAppUrl(number, message)` in `src/lib/constants.ts` builds `wa.me` links. Numbers stored as `BUSINESS.whatsapp[]`. All order CTAs route through WhatsApp — no checkout backend.

## Tailwind v4 note

Config is via `postcss.config.mjs` + CSS `@import "tailwindcss"` — no `tailwind.config.js`. Brand tokens and fonts are defined in `src/app/globals.css` with `:root` + `@theme inline`.
