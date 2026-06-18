import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { getPricingSettings } from "@/lib/pricing";
import ShippingSettingsForm from "./ShippingSettingsForm";

export const dynamic = "force-dynamic";

export default async function ShippingSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const pricing = await getPricingSettings();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Envío e instalación</h1>
      <p className="text-sm text-gray-600 mb-6">
        Precios que se muestran y cobran en el checkout por zona de envío y por el servicio de
        instalación.
      </p>
      <ShippingSettingsForm pricing={pricing} />
    </div>
  );
}
