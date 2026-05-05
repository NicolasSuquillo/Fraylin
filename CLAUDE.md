# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # dev server at localhost:3000
npm run build    # production build
npm run lint     # eslint
```

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS v4
- Framer Motion for animations, `@use-gesture/react` for drag/swipe
- Lucide React for icons (icon names in `products.json` map to Lucide components)

## Architecture

Single-page site. One route: `src/app/page.tsx` composes all sections top-to-bottom.

```
src/
  app/          # layout.tsx (global chrome) + page.tsx (section composition)
  components/
    layout/     # Header, Footer
    sections/   # HeroSection, ServiciosSection, ProductosSection, GaleriaSection, NosotrosSection, ContactoSection
    products/   # CategoryTabs, ProductCard, ProductModal
    ui/         # FloatingWhatsApp, ScrollToTop, SafeImage, ImageGallery, SectionHeading
  lib/
    constants.ts   # BUSINESS object — all contact info, WhatsApp numbers, social links
    products.ts    # accessor fns over products.json (getAllProducts, getCategories, etc.)
  types/index.ts   # Product, Category, GalleryItem, Service interfaces
  data/
    products.json  # source of truth for catalog — categories + products arrays
public/
  products/<category-slug>/   # product images referenced in products.json
```

## Adding products

Edit `src/data/products.json`. Each product needs `id`, `category` (matching a category `slug`), `name`, `images` (array of `{src, alt}`). Optional: `price`, `description`, `featured`.

Images go in `public/products/<category-slug>/`.

## WhatsApp integration

`buildWhatsAppUrl(number, message)` in `src/lib/constants.ts` builds `wa.me` links. Numbers stored as `BUSINESS.whatsapp[]`. All order CTAs route through WhatsApp — no backend.

## Tailwind v4 note

Config is via `postcss.config.mjs` + CSS `@import "tailwindcss"` — no `tailwind.config.js`. Custom tokens go in CSS with `@theme`.
