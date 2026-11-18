"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

export default function CopyTrackingQuickActions({
  code,
  trackingPath,
}: {
  code: string;
  trackingPath: string;
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  async function copy(text: string, which: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "code") {
        setCopiedCode(true);
        window.setTimeout(() => setCopiedCode(false), 1800);
      } else {
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 1800);
      }
    } catch {
      window.prompt(
        which === "code" ? "Copia el código del pedido:" : "Copia el enlace de seguimiento:",
        text
      );
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void copy(code, "code")}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
      >
        {copiedCode ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        )}
        {copiedCode ? "Código copiado" : `Copiar ${code}`}
      </button>

      <button
        type="button"
        onClick={() =>
          void copy(
            typeof window !== "undefined" ? `${window.location.origin}${trackingPath}` : trackingPath,
            "link"
          )
        }
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
      >
        {copiedLink ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
        ) : (
          <Link2 className="h-3.5 w-3.5" aria-hidden />
        )}
        {copiedLink ? "Enlace copiado" : "Copiar enlace de seguimiento"}
      </button>
    </div>
  );
}

