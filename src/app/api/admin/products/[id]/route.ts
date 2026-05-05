import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Product } from "@/types";

const DATA_PATH = join(process.cwd(), "src/data/products.json");

function readData() {
  return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
}

function writeData(data: unknown) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const updated: Product = await req.json();
  const data = readData();
  const idx = data.products.findIndex((p: Product) => p.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  data.products[idx] = updated;
  writeData(data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const data = readData();
  const idx = data.products.findIndex((p: Product) => p.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  data.products.splice(idx, 1);
  writeData(data);
  return NextResponse.json({ ok: true });
}
