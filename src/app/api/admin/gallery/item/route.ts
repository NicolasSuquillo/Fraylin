import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { tryDeletePublicUpload } from "@/lib/delete-public-upload";
import { db } from "@/db";
import { galleryItems } from "@/db/schema";

/** Quita una entrada por `src`, borra el archivo en disco y persiste en BD */
export async function DELETE(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { src?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const normalized = body.src?.trim();
  if (!normalized) {
    return NextResponse.json({ error: "Falta src" }, { status: 400 });
  }

  await db.delete(galleryItems).where(eq(galleryItems.src, normalized));

  await tryDeletePublicUpload(normalized);

  const remaining = await db.$count(galleryItems);

  revalidatePath("/");
  return NextResponse.json({ ok: true, remaining });
}
