import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { createReview } from "@/lib/reviews";
import { extname } from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const EXT_ALIASES: Record<string, string> = { ".jpeg": ".jpg" };
function normalizeExt(raw: string) {
  const lower = raw.toLowerCase();
  return EXT_ALIASES[lower] ?? lower;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const authorName = (form.get("authorName") as string | null)?.trim();
  const ratingRaw = form.get("rating") as string | null;
  const body = (form.get("body") as string | null)?.trim();
  const avatar = form.get("avatar") as File | null;

  if (!authorName || !ratingRaw || !body) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const rating = parseInt(ratingRaw, 10);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Calificación inválida (1-5)" }, { status: 400 });
  }

  let avatarUrl: string | undefined;
  if (avatar && avatar.size > 0) {
    if (avatar.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "La imagen supera los 2 MB" }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(avatar.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }
    const ext = normalizeExt(extname(avatar.name) || ".jpg");
    const filename = `${Date.now()}-avatar${ext}`;
    const blob = await put(`reviews/${filename}`, avatar, {
      access: "public",
      addRandomSuffix: false,
    });
    avatarUrl = blob.url;
  }

  await createReview({ authorName, rating, body, avatarUrl });
  return NextResponse.json({ ok: true }, { status: 201 });
}
