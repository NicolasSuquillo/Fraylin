import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import { tryDeletePublicUploads } from "@/lib/delete-public-upload";
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

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(readData());
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

  const previous = readData();
  writeData({ items });

  const oldSrcs = new Set(previous.items.map((i) => i.src.trim()).filter(Boolean));
  const newSrcs = new Set(items.map((i) => i.src.trim()));
  const removedSrcs = [...oldSrcs].filter((s) => !newSrcs.has(s));
  tryDeletePublicUploads(removedSrcs);

  return NextResponse.json({ ok: true });
}
