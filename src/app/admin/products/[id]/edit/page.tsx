import { getSession } from "@/lib/admin-auth";
import { redirect, notFound } from "next/navigation";
import { readFileSync } from "fs";
import { join } from "path";
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
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar: {product.name}</h1>
      <ProductForm categories={categories} products={products} initial={product} mode="edit" />
    </div>
  );
}
