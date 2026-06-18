"use client";

import { Download } from "lucide-react";

export default function DownloadComprobanteButton({
  orderId,
  clientTransactionId,
}: {
  orderId: string;
  clientTransactionId: string;
}) {
  return (
    <a
      href={`/api/admin/orders/${orderId}/comprobante`}
      download={`comprobante-${clientTransactionId}.pdf`}
      className="inline-flex items-center gap-2 min-h-[48px] rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <Download className="h-4 w-4 shrink-0" aria-hidden />
      Descargar comprobante
    </a>
  );
}
