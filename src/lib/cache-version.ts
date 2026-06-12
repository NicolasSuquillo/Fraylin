import { db } from "@/db";
import { cacheMeta } from "@/db/schema";
import { eq } from "drizzle-orm";

const CATALOG_KEY = "catalog";

/** Marca el catálogo como cambiado; llamar junto a cada revalidatePath("/"). */
export async function touchCatalogVersion(): Promise<void> {
  await db
    .insert(cacheMeta)
    .values({ key: CATALOG_KEY, updatedAt: new Date() })
    .onConflictDoUpdate({ target: cacheMeta.key, set: { updatedAt: new Date() } });
}

/** Timestamp (ms) de la última escritura de catálogo, o 0 si nunca se tocó. */
export async function getCatalogVersion(): Promise<number> {
  const row = await db.query.cacheMeta.findFirst({
    where: eq(cacheMeta.key, CATALOG_KEY),
  });
  return row?.updatedAt.getTime() ?? 0;
}
