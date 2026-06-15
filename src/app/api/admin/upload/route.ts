import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/admin-auth";
import { extname } from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Vercel limita el body de funciones serverless a 4.5 MB
const MAX_FILE_BYTES = 4 * 1024 * 1024;

const EXT_ALIASES: Record<string, string> = {
  ".jpeg": ".jpg",
  ".tiff": ".tif",
};

function normalizeExt(raw: string): string {
  const lower = raw.toLowerCase();
  return EXT_ALIASES[lower] ?? lower;
}

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

  if (destination === "gallery" || destination === "payments") {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }
    const ext = normalizeExt(extname(file.name) || ".jpg");
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

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  const ext = normalizeExt(extname(file.name) || ".jpg");
  const base = sanitize(file.name.slice(0, file.name.lastIndexOf(".")) || file.name);
  const filename = `${Date.now()}-${base}${ext}`;

  const blob = await put(`products/${safeCategory}/${filename}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return NextResponse.json({ src: blob.url }, { status: 201 });
}
