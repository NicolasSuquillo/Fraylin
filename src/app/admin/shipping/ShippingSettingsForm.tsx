"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parsePriceInput } from "@/lib/money";
import type { PricingSettings } from "@/lib/pricing";

const inputClass =
  "w-32 px-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-amber-500";

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function ShippingSettingsForm({ pricing }: { pricing: PricingSettings }) {
  const router = useRouter();
  const [zoneValues, setZoneValues] = useState<Record<string, string>>(
    Object.fromEntries(pricing.zones.map((z) => [z.id, centsToInput(z.cents)]))
  );
  const [zoneLabels, setZoneLabels] = useState<Record<string, string>>(
    Object.fromEntries(pricing.zones.map((z) => [z.id, z.label]))
  );
  const [installationValue, setInstallationValue] = useState(centsToInput(pricing.installationCents));
  const [shippingEnabled, setShippingEnabled] = useState(pricing.shippingEnabled);
  const [installationEnabled, setInstallationEnabled] = useState(pricing.installationEnabled);
  const [shippingDescription, setShippingDescription] = useState(pricing.shippingDescription);
  const [installationDescription, setInstallationDescription] = useState(
    pricing.installationDescription
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const zones: Record<string, number> = {};
    const labels: Record<string, string> = {};
    for (const zone of pricing.zones) {
      const cents = parsePriceInput(zoneValues[zone.id] ?? "");
      if (cents == null) {
        setError(`Precio inválido para "${zone.label}"`);
        return;
      }
      zones[zone.id] = cents;

      const label = (zoneLabels[zone.id] ?? "").trim();
      if (!label) {
        setError(`Nombre inválido para "${zone.label}"`);
        return;
      }
      labels[zone.id] = label;
    }

    const installationCents = parsePriceInput(installationValue);
    if (installationCents == null) {
      setError("Precio de instalación inválido");
      return;
    }

    if (!shippingDescription.trim()) {
      setError("El texto de envío no puede estar vacío");
      return;
    }

    if (!installationDescription.trim()) {
      setError("El texto de instalación no puede estar vacío");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zones,
          zoneLabels: labels,
          installationCents,
          shippingEnabled,
          installationEnabled,
          shippingDescription: shippingDescription.trim(),
          installationDescription: installationDescription.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Error al guardar");
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Sin conexión: no se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Zonas de envío</h2>
        <label className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <input
            type="checkbox"
            checked={shippingEnabled}
            onChange={(e) => setShippingEnabled(e.target.checked)}
            className="accent-amber-600"
          />
          <span className="text-sm text-gray-700">Permitir seleccionar envío en el checkout</span>
        </label>
        <div className="flex flex-col gap-3">
          {pricing.zones.map((zone) => (
            <div key={zone.id} className="flex items-center justify-between gap-3">
              <input
                type="text"
                value={zoneLabels[zone.id] ?? ""}
                onChange={(e) =>
                  setZoneLabels((v) => ({ ...v, [zone.id]: e.target.value }))
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1">
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={zoneValues[zone.id]}
                  onChange={(e) =>
                    setZoneValues((v) => ({ ...v, [zone.id]: e.target.value }))
                  }
                  className={inputClass}
                />
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1">
          <label className="text-sm text-gray-700" htmlFor="shippingDescription">
            Texto mostrado en el checkout
          </label>
          <textarea
            id="shippingDescription"
            value={shippingDescription}
            onChange={(e) => setShippingDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Instalación</h2>
        <label className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <input
            type="checkbox"
            checked={installationEnabled}
            onChange={(e) => setInstallationEnabled(e.target.checked)}
            className="accent-amber-600"
          />
          <span className="text-sm text-gray-700">Permitir agregar instalación en el checkout</span>
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-700">Costo fijo por pedido</span>
          <span className="flex items-center gap-1">
            <span className="text-sm text-gray-500">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={installationValue}
              onChange={(e) => setInstallationValue(e.target.value)}
              className={inputClass}
            />
          </span>
        </label>
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1">
          <label className="text-sm text-gray-700" htmlFor="installationDescription">
            Texto mostrado en el checkout
          </label>
          <textarea
            id="installationDescription"
            value={installationDescription}
            onChange={(e) => setInstallationDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Precios guardados.</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
