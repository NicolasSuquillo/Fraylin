"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";

interface Props {
  comprobanteEnabled: boolean;
  comprobanteShowRuc: boolean;
}

export default function ComprobanteSettingsForm({ comprobanteEnabled, comprobanteShowRuc }: Props) {
  const [enabled, setEnabled]   = useState(comprobanteEnabled);
  const [showRuc, setShowRuc]   = useState(comprobanteShowRuc);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      try {
        const res = await fetch("/api/admin/settings/comprobante", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comprobanteEnabled: enabled, comprobanteShowRuc: showRuc }),
        });
        if (!res.ok) throw new Error("Error al guardar");
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch {
        setError("No se pudo guardar. Intenta de nuevo.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm max-w-lg">
      <h2 className="text-base font-semibold text-gray-800 mb-5">Comprobante de compra PDF</h2>

      <div className="space-y-4">
        <Toggle
          id="comprobante-enabled"
          checked={enabled}
          onChange={setEnabled}
          label="Mostrar botón de descarga"
          description='Muestra "Descargar comprobante" en la página de confirmación de pago del cliente.'
        />
        <Toggle
          id="comprobante-ruc"
          checked={showRuc}
          onChange={setShowRuc}
          label="Mostrar RUC en el PDF"
          description={`Incluye "RUC: 1709460248001" en el encabezado del comprobante.`}
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <Check size={15} /> Guardado
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}

function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-4 cursor-pointer group">
      <div className="mt-0.5 relative shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-10 h-6 rounded-full transition-colors ${checked ? "bg-amber-600" : "bg-gray-200"}`}
        />
        <div
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </label>
  );
}
