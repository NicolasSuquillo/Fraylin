import { NextResponse } from "next/server";
import { getCatalogVersion } from "@/lib/cache-version";

export async function GET() {
  const version = await getCatalogVersion();
  return NextResponse.json({ version }, { headers: { "Cache-Control": "no-store" } });
}
