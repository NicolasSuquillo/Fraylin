"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parsePriceInput, transferToCardCents } from "@/lib/money";
import type { PricingSettings } from "@/lib/pricing";

const inputClass =
  "w-28 px-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-amber-500";

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function ShippingSettingsForm({ pricing }: { pricing: PricingSettings }) {
  const router = useRouter();
  // Precio transferencia (base) y precio tarjeta (auto = transfer + comisión Payphone, editable) por zona.
  const [zoneTransferValues, setZoneTransferValues] = useState<Record<string, string>>(
    Object.fromEntries(pricing.zones.map((z) => [z.id, centsToInput(z.transferCents)]))
  );
  const [zoneCardValues, setZoneCardValues] = useState<Record<string, string>>(
    Object.fromEntries(pricing.zones.map((z) => [z.id, centsToInput(z.cents)]))
  );
  const [zoneLabels, setZoneLabels] = useState<Record<string, string>>(
    Object.fromEntries(pricing.zones.map((z) => [z.id, z.label]))
  );
  const [installTransferValue, setInstallTransferValue] = useState(
    centsToInput(pricing.installationTransferCents)
  );
  const [installCardValue, setInstallCardValue] = useState(centsToInput(pricing.installationCents));
  const [feePctValue, setFeePctValue] = useState((pricing.payphoneFeeBps / 100).toString());
  const [shippingEnabled, setShippingEnabled] = useState(pricing.shippingEnabled);
  const [installationEnabled, setInstallationEnabled] = useState(pricing.installationEnabled);
  const [shippingDescription, setShippingDescription] = useState(pricing.shippingDescription);
  const [installationDescription, setInstallationDescription] = useState(
    pricing.installationDescription
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Comisión actual en basis points, derivada del input de porcentaje.
  function currentFeeBps(): number {
    const pct = Number((feePctValue || "0").replace(",", "."));
    if (!Number.isFinite(pct) || pct < 0) return pricing.payphoneFeeBps;
    return Math.round(pct * 100);
  }

  // Recalcula tarjeta desde un valor transferencia (string) con la comisión vigente.
  function cardFromTransfer(transferStr: string, feeBps: number): string {
    const transferCents = parsePriceInput(transferStr);
    if (transferCents == null) return "";
    return centsToInput(transferToCardCents(transferCents, feeBps));
  }

  function handleZoneTransferChange(zoneId: string, value: string) {
    setZoneTransferValues((v) => ({ ...v, [zoneId]: value }));
    setZoneCardValues((v) => ({ ...v, [zoneId]: cardFromTransfer(value, currentFeeBps()) }));
  }

  function handleInstallTransferChange(value: string) {
    setInstallTransferValue(value);
    setInstallCardValue(cardFromTransfer(value, currentFeeBps()));
  }

  // Al cambiar la comisión, recalcula todos los precios tarjeta desde sus precios transferencia.
  function handleFeeChange(value: string) {
    setFeePctValue(value);
    const pct = Number((value || "0").replace(",", "."));
    if (!Number.isFinite(pct) || pct < 0) return;
    const feeBps = Math.round(pct * 100);
    setZoneCardValues((prev) => {
      const next: Record<string, string> = {};
      for (const id of Object.keys(prev)) {
        next[id] = cardFromTransfer(zoneTransferValues[id] ?? "", feeBps);
      }
      return next;
    });
    setInstallCardValue(cardFromTransfer(installTransferValue, feeBps));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const zones: Record<string, number> = {};
    const zonesTransfer: Record<string, number> = {};
    const labels: Record<string, string> = {};
    for (const zone of pricing.zones) {
      const transferCents = parsePriceInput(zoneTransferValues[zone.id] ?? "");
      const cardCents = parsePriceInput(zoneCardValues[zone.id] ?? "");
      if (transferCents == null || cardCents == null) {
        setError(`Precio inválido para "${zone.label}"`);
        return;
      }
      zonesTransfer[zone.id] = transferCents;
      zones[zone.id] = cardCents;

      const label = (zoneLabels[zone.id] ?? "").trim();
      if (!label) {
        setError(`Nombre inválido para "${zone.label}"`);
        return;
      }
      labels[zone.id] = label;
    }

    const installationTransferCents = parsePriceInput(installTransferValue);
    const installationCents = parsePriceInput(installCardValue);
    if (installationTransferCents == null || installationCents == null) {
      setError("Precio de instalación inválido");
      return;
    }

    const feePct = Number((feePctValue || "").replace(",", "."));
    if (!Number.isFinite(feePct) || feePct < 0 || feePct > 100) {
      setError("Comisión Payphone inválida (porcentaje entre 0 y 100)");
      return;
    }
    const payphoneFeeBps = Math.round(feePct * 100);

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
          zonesTransfer,
          zoneLabels: labels,
          installationCents,
          installationTransferCents,
          payphoneFeeBps,
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
      {/* Comisión Payphone */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">Comisión Payphone</h2>
        <p className="text-xs text-gray-500 mb-3">
          Se suma al precio transferencia para calcular el precio con tarjeta. Default 5.75% (5% + IVA).
        </p>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-700">Comisión por transacción (%)</span>
          <span className="flex items-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              value={feePctValue}
              onChange={(e) => handleFeeChange(e.target.value)}
              className={inputClass}
            />
            <span className="text-sm text-gray-500">%</span>
          </span>
        </label>
      </div>

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
        <div className="hidden sm:flex items-center justify-end gap-3 mb-1 pr-1 text-[11px] text-gray-400">
          <span className="w-28 text-right">Transferencia</span>
          <span className="w-28 text-right">Tarjeta</span>
        </div>
        <div className="flex flex-col gap-3">
          {pricing.zones.map((zone) => (
            <div key={zone.id} className="flex items-center justify-between gap-3 flex-wrap">
              <input
                type="text"
                value={zoneLabels[zone.id] ?? ""}
                onChange={(e) =>
                  setZoneLabels((v) => ({ ...v, [zone.id]: e.target.value }))
                }
                className="flex-1 min-w-[140px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1">
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={zoneTransferValues[zone.id]}
                  onChange={(e) => handleZoneTransferChange(zone.id, e.target.value)}
                  className={inputClass}
                  aria-label={`Precio transferencia ${zone.label}`}
                />
              </span>
              <span className="flex items-center gap-1">
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={zoneCardValues[zone.id]}
                  onChange={(e) =>
                    setZoneCardValues((v) => ({ ...v, [zone.id]: e.target.value }))
                  }
                  className={inputClass}
                  aria-label={`Precio tarjeta ${zone.label}`}
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm text-gray-700">Costo fijo por pedido</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={installTransferValue}
                onChange={(e) => handleInstallTransferChange(e.target.value)}
                className={inputClass}
                aria-label="Precio instalación transferencia"
              />
            </span>
            <span className="flex items-center gap-1">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={installCardValue}
                onChange={(e) => setInstallCardValue(e.target.value)}
                className={inputClass}
                aria-label="Precio instalación tarjeta"
              />
            </span>
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1 text-right">Transferencia · Tarjeta</p>
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
