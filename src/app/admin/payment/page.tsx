import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { getTransferSettings } from "@/lib/pricing";
import TransferSettingsForm from "./TransferSettingsForm";

export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const transfer = await getTransferSettings();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Pagos</h1>
      <p className="text-sm text-gray-600 mb-6">
        Datos bancarios y código QR de Deuna que se muestran en el checkout cuando el
        cliente elige pagar por transferencia o Deuna.
      </p>
      <TransferSettingsForm transfer={transfer} />
    </div>
  );
}
