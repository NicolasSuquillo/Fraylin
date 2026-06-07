import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import { mkdirSync, writeFileSync } from "fs";
import { join, extname } from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

  if (destination === "gallery") {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }
    const ext = normalizeExt(extname(file.name) || ".jpg");
    const base = sanitize(file.name.slice(0, file.name.lastIndexOf(".")) || file.name);
    const filename = `${Date.now()}-${base}${ext}`;
    const dir = join(process.cwd(), "public", "gallery");
    mkdirSync(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(join(dir, filename), buffer);
    return NextResponse.json({ src: `/gallery/${filename}` }, { status: 201 });
  }

  if (!category) {
    return NextResponse.json({ error: "Faltan campos: file, category" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  const ext = normalizeExt(extname(file.name) || ".jpg");
  const base = sanitize(file.name.slice(0, file.name.lastIndexOf(".")) || file.name);
  const filename = `${Date.now()}-${base}${ext}`;

  const dir = join(process.cwd(), "public", "products", category);
  mkdirSync(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(join(dir, filename), buffer);

  return NextResponse.json({ src: `/products/${category}/${filename}` }, { status: 201 });
}
