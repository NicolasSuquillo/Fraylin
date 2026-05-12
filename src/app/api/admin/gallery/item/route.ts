import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import { tryDeletePublicUpload } from "@/lib/delete-public-upload";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { GalleryItem } from "@/types";

const DATA_PATH = join(process.cwd(), "src/data/gallery.json");

function readData(): { items: GalleryItem[] } {
  return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
}

function writeData(data: { items: GalleryItem[] }) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

/** Quita una entrada por `src`, borra el archivo en disco y persiste gallery.json */
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

  const raw = body.src?.trim();
  if (!raw) {
    return NextResponse.json({ error: "Falta src" }, { status: 400 });
  }

  const data = readData();
  const normalized = raw;
  const items = data.items.filter((it) => it.src.trim() !== normalized);

  writeData({ items });

  tryDeletePublicUpload(normalized);

  return NextResponse.json({
    ok: true,
    remaining: items.length,
  });
}
