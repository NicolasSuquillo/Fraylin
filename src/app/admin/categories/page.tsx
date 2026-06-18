import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { getAllProducts, getCategories } from "@/lib/products";
import CategoriesManager from "./CategoriesManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);
  const productCounts = Object.fromEntries(
    categories.map((c) => [c.slug, products.filter((p) => p.category === c.slug).length])
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Slug, nombre e ícono se reflejan en la web pública.
          </p>
        </div>
      </div>
      <CategoriesManager categories={categories} productCounts={productCounts} />
    </div>
  );
}
