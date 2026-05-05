import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { readFileSync } from "fs";
import { join } from "path";
import type { Product, Category } from "@/types";
import ProductsTable from "./ProductsTable";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const data = JSON.parse(readFileSync(join(process.cwd(), "src/data/products.json"), "utf-8"));
  const products: Product[] = data.products;
  const categories: Category[] = data.categories;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <a
          href="/admin/products/new"
          className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Agregar producto
        </a>
      </div>
      <ProductsTable products={products} categories={categories} />
    </div>
  );
}
