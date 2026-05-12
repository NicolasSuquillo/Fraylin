import galleryData from "../data/gallery.json";
import type { GalleryItem } from "@/types";

export function getGalleryItems(): GalleryItem[] {
  const data = galleryData as { items: GalleryItem[] };
  return data.items ?? [];
}
