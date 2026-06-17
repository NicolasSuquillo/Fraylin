"use client";

import { useState } from "react";
import type { Review } from "@/types";
import { useRouter } from "next/navigation";

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-stone-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewsManager({ reviews: initial }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initial);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [busy, setBusy] = useState<number | null>(null);
  const router = useRouter();

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    return true;
  });

  async function toggleApproval(id: number, approved: boolean) {
    setBusy(id);
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved } : r)));
    setBusy(null);
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar esta reseña?")) return;
    setBusy(id);
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setBusy(null);
    router.refresh();
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(["all", "pending", "approved"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? "bg-amber-100 text-amber-900"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Aprobadas"}
            <span className="ml-1.5 text-xs">
              (
              {f === "all"
                ? reviews.length
                : f === "pending"
                  ? reviews.filter((r) => !r.approved).length
                  : reviews.filter((r) => r.approved).length}
              )
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">No hay reseñas.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-2xl border p-4 flex gap-4 items-start ${
                r.approved ? "border-green-200" : "border-amber-200"
              }`}
            >
              {/* Avatar */}
              {r.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.avatarUrl}
                  alt={r.authorName}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-amber-800 uppercase">
                    {r.authorName.slice(0, 2)}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-800">{r.authorName}</span>
                  <Stars rating={r.rating} />
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.approved
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.approved ? "Aprobada" : "Pendiente"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-3">{r.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(r.createdAt).toLocaleDateString("es-EC", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                {r.approved ? (
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => toggleApproval(r.id, false)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition"
                  >
                    Ocultar
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => toggleApproval(r.id, true)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition"
                  >
                    Aprobar
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => remove(r.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
