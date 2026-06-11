import type { OrderStatus } from "@/types";

const STYLES: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  processing: "bg-gray-100 text-gray-700",
  paid: "bg-green-100 text-green-900",
  failed: "bg-red-100 text-red-900",
  cancelled: "bg-red-100 text-red-900",
};

const LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
