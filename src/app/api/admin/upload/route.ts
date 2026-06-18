import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/admin-auth";
import { detectImageType, extensionForImageType } from "@/lib/image-sniff";

// Vercel limita el body de funciones serverless a 4.5 MB
const MAX_FILE_BYTES = 4 * 1024 * 1024;

function sanitize(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const category = form.get("category") as string | null;
  const destination = form.get("destination") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera los 4 MB. Redúcela antes de subirla." },
      { status: 413 }
    );
  }

  // Verificar el tipo real por firma de bytes (no por el Content-Type declarado,
  // que es falsificable). Cierra la subida de contenido arbitrario con MIME falso.
  const detectedType = await detectImageType(file);
  if (!detectedType) {
    return NextResponse.json(
      { error: "El archivo no es una imagen válida (JPG, PNG, WEBP o GIF)" },
      { status: 400 }
    );
  }

  // La extensión se deriva del tipo REAL detectado por bytes, no del nombre
  // original (controlado por el cliente): evita polyglots con extensión engañosa.
  const ext = extensionForImageType(detectedType);

  if (destination === "gallery" || destination === "payments") {
    const base = sanitize(file.name.slice(0, file.name.lastIndexOf(".")) || file.name);
    const filename = `${Date.now()}-${base}${ext}`;
    const blob = await put(`${destination}/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return NextResponse.json({ src: blob.url }, { status: 201 });
  }

  // Sanitizar evita que un slug malicioso (p. ej. "../x") escape el prefijo products/.
  const safeCategory = category ? sanitize(category) : "";
  if (!safeCategory) {
    return NextResponse.json({ error: "Faltan campos: file, category" }, { status: 400 });
  }

  const base = sanitize(file.name.slice(0, file.name.lastIndexOf(".")) || file.name);
  const filename = `${Date.now()}-${base}${ext}`;

  const blob = await put(`products/${safeCategory}/${filename}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return NextResponse.json({ src: blob.url }, { status: 201 });
}
