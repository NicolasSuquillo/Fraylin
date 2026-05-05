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

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(readData());
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const product: Product = await req.json();
  const data = readData();

  if (data.products.find((p: Product) => p.id === product.id)) {
    return NextResponse.json({ error: "ID ya existe" }, { status: 409 });
  }

  data.products.push(product);
  writeData(data);
  return NextResponse.json({ ok: true }, { status: 201 });
}
