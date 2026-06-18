"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/ui/SafeImage";
import type { TransferSettings } from "@/lib/pricing";

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500";

export default function TransferSettingsForm({ transfer }: { transfer: TransferSettings }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(transfer.enabled);
  const [qrImageUrl, setQrImageUrl] = useState(transfer.qrImageUrl);
  const [bankName, setBankName] = useState(transfer.bankName);
  const [accountType, setAccountType] = useState(transfer.accountType);
  const [accountNumber, setAccountNumber] = useState(transfer.accountNumber);
  const [accountHolder, setAccountHolder] = useState(transfer.accountHolder);
  const [accountId, setAccountId] = useState(transfer.accountId);
  const [instructions, setInstructions] = useState(transfer.instructions);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("destination", "payments");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (res.ok) {
        const { src } = await res.json();
        setQrImageUrl(src);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "No se pudo subir la imagen");
      }
    } catch {
      setError("Sin conexión: no se pudo subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!instructions.trim()) {
      setError("El texto de instrucciones no puede estar vacío");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/transfer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          qrImageUrl,
          bankName: bankName.trim(),
          accountType: accountType.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          accountId: accountId.trim(),
          instructions: instructions.trim(),
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
        <label className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="accent-amber-600"
          />
          <span className="text-sm text-gray-700">
            Mostrar datos de transferencia/Deuna en el checkout
          </span>
        </label>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Banco</span>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Tipo de cuenta</span>
            <input
              type="text"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              placeholder="Ahorros / Corriente"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Número de cuenta</span>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Titular</span>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Cédula / RUC</span>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
          <span className="text-sm text-gray-700">QR de Deuna</span>
          {qrImageUrl && (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <SafeImage src={qrImageUrl} alt="QR de Deuna" fill className="object-contain" sizes="128px" />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id="qrFile"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 border border-amber-300 bg-amber-50 text-amber-900 text-sm font-semibold rounded-lg hover:bg-amber-100 disabled:opacity-50"
            >
              {uploading ? "Subiendo…" : qrImageUrl ? "Cambiar QR" : "Subir QR"}
            </button>
            {qrImageUrl && (
              <button
                type="button"
                onClick={() => setQrImageUrl(null)}
                className="px-4 py-2 border border-red-200 bg-red-50 text-red-800 text-sm font-semibold rounded-lg hover:bg-red-100"
              >
                Quitar QR
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1">
          <label className="text-sm text-gray-700" htmlFor="transferInstructions">
            Instrucciones mostradas en el checkout
          </label>
          <textarea
            id="transferInstructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Datos guardados.</p>}

      <button
        type="submit"
        disabled={saving || uploading}
        className="self-start px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
