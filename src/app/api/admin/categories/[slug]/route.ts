import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Category, Product } from "@/types";

const DATA_PATH = join(process.cwd(), "src/data/products.json");

function readData() {
  return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
}

function writeData(data: unknown) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { slug } = await params;
  const updated: Category = await req.json();
  const data = readData();
  const idx = data.categories.findIndex((c: Category) => c.slug === slug);

  if (idx === -1) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  data.categories[idx] = updated;
  writeData(data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { slug } = await params;
  const data = readData();
  const hasProducts = data.products.some((p: Product) => p.category === slug);

  if (hasProducts) {
    return NextResponse.json(
      { error: "No se puede eliminar: hay productos en esta categoría" },
      { status: 409 }
    );
  }

  data.categories = data.categories.filter((c: Category) => c.slug !== slug);
  writeData(data);
  return NextResponse.json({ ok: true });
}
