import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });
import { db } from "../src/db";
import {
  categories,
  products,
  productImages,
  galleryItems,
  orderItems,
  orders,
} from "../src/db/schema";

interface JsonProduct {
  id: string;
  category: string;
  name: string;
  price?: string;
  description?: string;
  featured?: boolean;
  images: { src: string; alt: string }[];
}

interface JsonCategory {
  slug: string;
  label: string;
  icon: string;
  description?: string;
}

interface JsonGalleryItem {
  src: string;
  alt: string;
  caption?: string;
}

async function main() {
  const reset = process.argv.includes("--reset");

  const productsData = JSON.parse(
    readFileSync(join(process.cwd(), "src/data/products.json"), "utf-8")
  ) as { categories: JsonCategory[]; products: JsonProduct[] };

  const galleryData = JSON.parse(
    readFileSync(join(process.cwd(), "src/data/gallery.json"), "utf-8")
  ) as { items: JsonGalleryItem[] };

  if (reset) {
    console.log("--reset: limpiando tablas existentes...");
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(productImages);
    await db.delete(products);
    await db.delete(galleryItems);
    await db.delete(categories);
  }

  console.log(`Insertando ${productsData.categories.length} categorías...`);
  for (const [index, cat] of productsData.categories.entries()) {
    await db
      .insert(categories)
      .values({
        slug: cat.slug,
        label: cat.label,
        icon: cat.icon,
        description: cat.description ?? null,
        position: index,
      })
      .onConflictDoNothing();
  }

  console.log(`Insertando ${productsData.products.length} productos...`);
  for (const product of productsData.products) {
    await db
      .insert(products)
      .values({
        id: product.id,
        categorySlug: product.category,
        name: product.name,
        description: product.description ?? null,
        displayPrice: product.price ?? null,
        priceCents: null,
        stock: null,
        featured: product.featured ?? false,
      })
      .onConflictDoNothing();

    for (const [index, image] of product.images.entries()) {
      await db
        .insert(productImages)
        .values({
          productId: product.id,
          src: image.src,
          alt: image.alt,
          position: index,
        })
        .onConflictDoNothing();
    }
  }

  console.log(`Insertando ${galleryData.items.length} items de galería...`);
  for (const [index, item] of galleryData.items.entries()) {
    await db
      .insert(galleryItems)
      .values({
        src: item.src,
        alt: item.alt,
        caption: item.caption || null,
        position: index,
      })
      .onConflictDoNothing();
  }

  console.log("Seed completo.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
