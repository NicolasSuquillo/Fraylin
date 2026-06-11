"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FULFILLMENT_STATUSES } from "@/types";

const LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  coordinado: "Coordinado",
  entregado: "Entregado",
};

interface Props {
  orderId: string;
  value: string;
}

export default function FulfillmentSelect({ orderId, value }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  // Estado local optimista: el prop solo se actualiza tras router.refresh()
  const [current, setCurrent] = useState(value);
  const [error, setError] = useState(false);

  async function handleChange(newValue: string) {
    const previous = current;
    setCurrent(newValue);
    setError(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentStatus: newValue }),
      });
      if (!res.ok) {
        setCurrent(previous);
        setError(true);
        return;
      }
      router.refresh();
    } catch {
      setCurrent(previous);
      setError(true);
    } finally {
      setSaving(false);
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
