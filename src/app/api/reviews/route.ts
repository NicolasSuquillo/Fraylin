import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { createReview } from "@/lib/reviews";
import { detectImageType, extensionForImageType } from "@/lib/image-sniff";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min
// Topes de longitud: endpoint público sin autenticación; evita inflar la BD con
// payloads gigantes de spam.
const MAX_AUTHOR_NAME = 80;
const MAX_BODY = 1000;

export async function POST(req: NextRequest) {
  // Endpoint público: frenar spam de reseñas e inflado del Blob storage.
  if (!checkRateLimit(`reviews:${getClientIp(req)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Demasiadas reseñas seguidas. Intenta de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const form = await req.formData();
  const authorName = (form.get("authorName") as string | null)?.trim();
  const ratingRaw = form.get("rating") as string | null;
  const body = (form.get("body") as string | null)?.trim();
  const avatar = form.get("avatar") as File | null;

  if (!authorName || !ratingRaw || !body) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  if (authorName.length > MAX_AUTHOR_NAME) {
    return NextResponse.json(
      { error: `El nombre supera los ${MAX_AUTHOR_NAME} caracteres` },
      { status: 400 }
    );
  }
  if (body.length > MAX_BODY) {
    return NextResponse.json(
      { error: `La reseña supera los ${MAX_BODY} caracteres` },
      { status: 400 }
    );
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
    // Verificar el tipo real por firma de bytes, no por el Content-Type declarado
    // (falsificable). Evita subir contenido arbitrario al Blob público.
    const detectedType = await detectImageType(avatar);
    if (!detectedType) {
      return NextResponse.json(
        { error: "El archivo no es una imagen válida (JPG, PNG, WEBP o GIF)" },
        { status: 400 }
      );
    }
    // Extensión derivada del tipo real detectado, no del nombre original.
    const ext = extensionForImageType(detectedType);
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
