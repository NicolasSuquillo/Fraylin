import { asc } from "drizzle-orm";
import { db } from "@/db";
import { galleryItems } from "@/db/schema";
import type { GalleryItem } from "@/types";

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const rows = await db
    .select()
    .from(galleryItems)
    .orderBy(asc(galleryItems.position));
  return rows.map((row) => ({
    src: row.src,
    alt: row.alt,
    caption: row.caption ?? undefined,
  }));
}
