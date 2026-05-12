import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { readFileSync } from "fs";
import { join } from "path";
import type { Category } from "@/types";
import CategoriesManager from "./CategoriesManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const data = JSON.parse(readFileSync(join(process.cwd(), "src/data/products.json"), "utf-8"));
  const categories: Category[] = data.categories;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Categorías</h1>
      <p className="text-sm text-gray-600 mb-6">
        Slug, nombre e icono se reflejan en la web pública (pestañas de productos).
      </p>
      <CategoriesManager categories={categories} />
    </div>
  );
}
