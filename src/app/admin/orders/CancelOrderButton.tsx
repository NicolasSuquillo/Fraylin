"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";

interface Props {
  orderId: string;
}

export default function CancelOrderButton({ orderId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (
      !window.confirm(
        "¿Cancelar este pedido? Se liberará el stock reservado y el cliente deberá crear uno nuevo."
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo cancelar el pedido");
        return;
      }
      router.refresh();
    } catch {
      setError("Sin conexión: no se pudo cancelar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={saving}
        className="inline-flex items-center gap-2 min-h-[48px] rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <XCircle className="h-4 w-4" aria-hidden />
        )}
        Cancelar pedido
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
