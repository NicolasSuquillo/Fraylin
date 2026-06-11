import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllProducts, getCategories } from "@/lib/products";
import ProductsTable from "./ProductsTable";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center min-h-[48px] w-full sm:w-auto rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.99] sm:min-h-0 sm:px-4 sm:py-2.5"
        >
          + Agregar producto
        </Link>
      </div>
      <ProductsTable products={products} categories={categories} />
    </div>
  );
}
