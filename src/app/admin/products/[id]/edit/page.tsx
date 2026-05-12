import { getSession } from "@/lib/admin-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { readFileSync } from "fs";
import { join } from "path";
import { ChevronLeft } from "lucide-react";
import type { Product, Category } from "@/types";
import ProductForm from "../../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const { id } = await params;
  const data = JSON.parse(readFileSync(join(process.cwd(), "src/data/products.json"), "utf-8"));
  const product: Product | undefined = data.products.find((p: Product) => p.id === id);
  const categories: Category[] = data.categories;

  if (!product) notFound();

  const products: Product[] = data.products;

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-950 mb-4 min-h-[44px] -ml-1 px-1 rounded-lg hover:bg-amber-50"
      >
        <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
        Productos
      </Link>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 leading-snug">
        Editar: <span className="break-words">{product.name}</span>
      </h1>
      <ProductForm categories={categories} products={products} initial={product} mode="edit" />
    </div>
  );
}
