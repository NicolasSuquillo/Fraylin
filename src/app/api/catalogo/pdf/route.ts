import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts, getCategories } from "@/lib/products";
import { buildCatalogoBuffer } from "@/lib/pdf/catalogo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category")?.trim() || undefined;

  const [categories, products] = await Promise.all([
    getCategories(),
    getCatalogProducts(category),
  ]);

  if (category && !categories.some((c) => c.slug === category)) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  try {
    const buffer = await buildCatalogoBuffer({
      products,
      categories,
      categoryFilter: category,
    });

    const filename = category
      ? `catalogo-fraylin-${category}.pdf`
      : "catalogo-fraylin.pdf";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("Error generando PDF del catálogo:", err);
    return NextResponse.json(
      { error: "No se pudo generar el PDF" },
      { status: 500 }
    );
  }
}
