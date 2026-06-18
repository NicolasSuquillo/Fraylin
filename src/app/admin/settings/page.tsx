import { getPricingSettings } from "@/lib/pricing";
import ComprobanteSettingsForm from "./ComprobanteSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getPricingSettings();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Configuración</h1>
      <ComprobanteSettingsForm
        comprobanteEnabled={settings.comprobanteEnabled}
        comprobanteShowRuc={settings.comprobanteShowRuc}
      />
    </div>
  );
}
