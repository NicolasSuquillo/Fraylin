import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { tryDeletePublicUploads } from "@/lib/delete-public-upload";
import { db } from "@/db";
import { galleryItems } from "@/db/schema";
import { getGalleryItems } from "@/lib/gallery";
import type { GalleryItem } from "@/types";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json({ items: await getGalleryItems() });
}

export async function PUT(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const items = body.items as GalleryItem[] | undefined;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Se esperaba { items: [...] }" }, { status: 400 });
  }

  for (const item of items) {
    if (!item.src?.trim() || !item.alt?.trim()) {
      return NextResponse.json(
        { error: "Cada imagen debe tener URL y texto alternativo." },
        { status: 400 }
      );
    }
  }

  const previous = await getGalleryItems();

  await db.transaction(async (tx) => {
    await tx.delete(galleryItems);
    if (items.length > 0) {
      await tx.insert(galleryItems).values(
        items.map((item, index) => ({
          src: item.src.trim(),
          alt: item.alt.trim(),
          caption: item.caption?.trim() || null,
          position: index,
        }))
      );
    }
  });

  const oldSrcs = new Set(previous.map((i) => i.src.trim()).filter(Boolean));
  const newSrcs = new Set(items.map((i) => i.src.trim()));
  const removedSrcs = [...oldSrcs].filter((s) => !newSrcs.has(s));
  await tryDeletePublicUploads(removedSrcs);

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
