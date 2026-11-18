import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/admin-auth";
import { getPricingSettings } from "@/lib/pricing";
import { getAllProducts, getCategories } from "@/lib/products";
import NewOrderForm from "./NewOrderForm";

export const dynamic = "force-dynamic";

export default async function NewManualOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const [{ productId }, products, categories, pricing] = await Promise.all([
    searchParams,
    getAllProducts(),
    getCategories(),
    getPricingSettings(),
  ]);

  const initialProductId =
    productId && products.some((p) => p.id === productId) ? productId : undefined;

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <div className="mb-5">
        <Link
          href="/admin/orders"
          className="inline-flex min-h-[44px] sm:min-h-0 items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a pedidos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Crear pedido manual
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Registra ventas realizadas por WhatsApp, en tienda física o por fuera de la web. El pedido
          se sincronizará automáticamente con Portal Fraylin para su seguimiento.
        </p>
      </div>

      <NewOrderForm
        products={products}
        categories={categories}
        zones={pricing.zones}
        defaultInstallationCents={pricing.installationTransferCents}
        initialProductId={initialProductId}
      />
    </div>
  );
}

