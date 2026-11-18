"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Package, PackageCheck, Save, Truck, Wrench } from "lucide-react";
import { FULFILLMENT_STATUSES, type FulfillmentStatus } from "@/types";

const STEP_META: Array<{
  value: FulfillmentStatus;
  label: string;
  Icon: typeof Package;
}> = [
  { value: "nuevo", label: "Recibido", Icon: Package },
  { value: "preparando", label: "En preparación", Icon: Wrench },
  { value: "coordinado", label: "Coordinado", Icon: Truck },
  { value: "entregado", label: "Entregado", Icon: PackageCheck },
];

export default function TrackingUpdateForm({
  orderId,
  initialStatus,
  initialNote,
}: {
  orderId: string;
  initialStatus: FulfillmentStatus;
  initialNote: string | null;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const safeInitialStatus: FulfillmentStatus = FULFILLMENT_STATUSES.includes(initialStatus)
    ? initialStatus
    : "nuevo";
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>(safeInitialStatus);
  const [trackingNote, setTrackingNote] = useState(initialNote ?? "");
  const [prevInitialStatus, setPrevInitialStatus] = useState<FulfillmentStatus>(safeInitialStatus);
  const [prevInitialNote, setPrevInitialNote] = useState<string | null>(initialNote);
  const [eventDescription, setEventDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!saving && (safeInitialStatus !== prevInitialStatus || initialNote !== prevInitialNote)) {
    setPrevInitialStatus(safeInitialStatus);
    setPrevInitialNote(initialNote);
    setFulfillmentStatus(safeInitialStatus);
    setTrackingNote(initialNote ?? "");
  }

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentStatus,
          trackingNote: trackingNote.trim() || null,
          eventDescription: eventDescription.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la actualización");
        router.refresh();
        return;
      }
      setPrevInitialStatus(fulfillmentStatus);
      setPrevInitialNote(trackingNote.trim() || null);
      setEventDescription("");
      setSaved(true);
      router.refresh();
    } catch {
      setError("Error de conexión al guardar");
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-800">
          Seguimiento y estado de entrega (sincronizado con Portal)
        </h2>
      </div>

      <div>
        <span className="block text-xs font-medium text-gray-600 mb-2">
          Etapa actual de entrega
        </span>
        <div role="radiogroup" aria-label="Etapa actual de entrega" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STEP_META.map(({ value, label, Icon }) => {
            const active = fulfillmentStatus === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={saving}
                onClick={() => setFulfillmentStatus(value)}
                className={`flex items-center justify-center sm:justify-start gap-2 min-h-[46px] rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                  active
                    ? "border-amber-500 bg-amber-100 text-amber-950 ring-2 ring-amber-500/20"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? "text-amber-700" : "text-gray-400"}`}
                  aria-hidden
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Detalle para el historial (opcional)
        </label>
        <input
          type="text"
          maxLength={500}
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
          disabled={saving}
          placeholder="Ej. Enviado con transporte interno, guía #123"
          className="w-full min-h-[42px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Nota pública para el cliente (visible en seguimiento)
        </label>
        <textarea
          rows={2}
          maxLength={1000}
          value={trackingNote}
          onChange={(e) => setTrackingNote(e.target.value)}
          disabled={saving}
          placeholder="Indicaciones de entrega, horario estimado o número de contacto..."
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 resize-none"
        />
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full sm:w-auto min-h-[46px] items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Guardando…" : saved ? "Guardado y sincronizado" : "Actualizar seguimiento"}
        </button>
      </div>
    </form>
  );
}
