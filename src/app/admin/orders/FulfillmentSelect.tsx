"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FULFILLMENT_STATUSES, type FulfillmentStatus } from "@/types";

const LABELS: Record<FulfillmentStatus, string> = {
  nuevo: "Nuevo",
  preparando: "En preparación",
  coordinado: "Coordinado",
  entregado: "Entregado",
};

interface Props {
  orderId: string;
  value: FulfillmentStatus;
}

export default function FulfillmentSelect({ orderId, value }: Props) {
  const router = useRouter();
  const requestIdRef = useRef(0);
  const safeValue: FulfillmentStatus = FULFILLMENT_STATUSES.includes(value) ? value : "nuevo";
  const [saving, setSaving] = useState(false);
  // Estado local optimista: el prop solo se actualiza tras router.refresh()
  const [current, setCurrent] = useState<FulfillmentStatus>(safeValue);
  const [prevSafeValue, setPrevSafeValue] = useState<FulfillmentStatus>(safeValue);
  const [error, setError] = useState(false);

  if (!saving && safeValue !== prevSafeValue) {
    setPrevSafeValue(safeValue);
    setCurrent(safeValue);
    setError(false);
  }

  async function handleChange(newValue: string) {
    if (!FULFILLMENT_STATUSES.includes(newValue as FulfillmentStatus)) return;
    const nextValue = newValue as FulfillmentStatus;
    const requestId = ++requestIdRef.current;
    const previous = current;
    setCurrent(nextValue);
    setError(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentStatus: nextValue }),
      });
      if (!res.ok) {
        if (requestIdRef.current === requestId) {
          setCurrent(previous);
          setError(true);
          router.refresh();
        }
        return;
      }
      if (requestIdRef.current === requestId) {
        router.refresh();
      }
    } catch {
      if (requestIdRef.current === requestId) {
        setCurrent(previous);
        setError(true);
        router.refresh();
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setSaving(false);
      }
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <select
        value={current}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
        aria-label="Estado de entrega"
      >
        {FULFILLMENT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {LABELS[status] ?? status}
          </option>
        ))}
      </select>
      {error && <span className="text-[11px] text-red-600">No se guardó, reintenta</span>}
    </span>
  );
}
