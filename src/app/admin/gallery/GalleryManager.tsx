"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Trash2 } from "lucide-react";
import type { GalleryItem } from "@/types";

/** Fila local con clave estable (evita bugs al borrar filas: refs y React keys con índice) */
type GalleryRow = GalleryItem & { _key: string };

function newKey() {
  return crypto.randomUUID();
}

function emptyRow(): GalleryRow {
  return { src: "", alt: "", caption: "", _key: newKey() };
}

function rowFromItem(it: GalleryItem): GalleryRow {
  return { ...it, _key: newKey() };
}

export default function GalleryManager({ initialItems }: { initialItems: GalleryItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryRow[]>(() =>
    initialItems.length > 0 ? initialItems.map(rowFromItem) : [emptyRow()]
  );
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<null | "save" | "delete">(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [uploadSuccessKey, setUploadSuccessKey] = useState<string | null>(null);
  const fileRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 6000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    if (uploadSuccessKey === null) return;
    const t = window.setTimeout(() => setUploadSuccessKey(null), 4000);
    return () => window.clearTimeout(t);
  }, [uploadSuccessKey]);

  function update(idx: number, patch: Partial<GalleryItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  async function deleteGalleryEntry(idx: number) {
    const row = items[idx];
    if (!row) return;

    if (!row.src?.trim()) {
      setItems((prev) => (prev.length <= 1 ? [emptyRow()] : prev.filter((_, i) => i !== idx)));
      fileRefs.current.delete(row._key);
      return;
    }

    if (
      !confirm(
        "¿Eliminar esta imagen de la galería publicada? Se borrará el archivo, se actualizará la lista y dejará de mostrarse en la página principal."
      )
    ) {
      return;
    }

    setError("");
    setDeletingKey(row._key);
    try {
      const res = await fetch("/api/admin/gallery/item", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src: row.src.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "No se pudo eliminar");
        return;
      }

      setItems((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        return next.length === 0 ? [emptyRow()] : next;
      });
      fileRefs.current.delete(row._key);
      setFeedback("delete");
      router.refresh();
    } catch {
      setError("Sin conexión: no se pudo eliminar. Inténtalo de nuevo.");
    } finally {
      setDeletingKey(null);
    }
  }

  async function handleUpload(idx: number, rowKey: string, file: File) {
    setUploadingKey(rowKey);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("destination", "gallery");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (res.ok) {
        const { src } = await res.json();
        update(idx, { src });
        setUploadSuccessKey(rowKey);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Error al subir");
      }
    } catch {
      setError("Sin conexión: no se pudo subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploadingKey(null);
    }
  }

  function addRow() {
    setItems((prev) => [...prev, emptyRow()]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // Una fila con imagen subida pero sin alt NO se puede descartar en silencio:
    // el guardado reemplaza la lista completa y borraría el archivo subido.
    const incomplete = items.findIndex((it) => it.src.trim() && !it.alt.trim());
    if (incomplete !== -1) {
      setError(
        `La imagen ${incomplete + 1} no tiene texto alternativo. Complétalo o elimínala antes de guardar.`
      );
      return;
    }
    const valid = items.filter((it) => it.src.trim() && it.alt.trim());
    if (valid.length === 0) {
      setError("Agrega al menos una imagen con descripción alternativa.");
      return;
    }
    setSaving(true);
    setError("");
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: valid.map((it) => ({
            src: it.src.trim(),
            alt: it.alt.trim(),
            caption: (it.caption ?? "").trim(),
          })),
        }),
      });
      if (res.ok) {
        setFeedback("save");
        router.refresh();
        setItems(valid);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Error al guardar");
      }
    } catch {
      setError("Sin conexión: no se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl pb-4">
      <p className="text-sm text-gray-600 leading-relaxed">
        Sube las fotos, agrega su descripción y pulsa <strong>Guardar galería</strong> para
        publicarlas en la sección “Galería de trabajos” de la web.
      </p>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-sm"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <p className="font-semibold">
              {feedback === "delete" ? "Imagen eliminada de la web" : "Galería guardada correctamente"}
            </p>
            <p className="mt-0.5 text-emerald-900/90">
              {feedback === "delete"
                ? "La lista publicada y el archivo están actualizados; la página principal ya no mostrará esta foto."
                : "Los cambios ya están en la lista publicada; la sección Galería de la web los usará al recargar."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={item._key}
            className="flex flex-col gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-200 md:flex-row md:items-start"
          >
            {/* Móvil: miniatura y botón en columna (ancho completo); md+: fila compacta */}
            <div className="flex w-full flex-col gap-3 md:w-auto md:max-w-[13rem] md:shrink-0">
              <div className="flex justify-center md:justify-start">
                {item.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt=""
                    className="h-36 w-full max-w-[12rem] rounded-xl border border-gray-200 bg-white object-cover md:h-28 md:w-28 md:max-w-none"
                  />
                ) : (
                  <div className="flex h-36 w-full max-w-[12rem] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-3 text-center text-xs text-gray-400 md:h-28 md:w-28 md:max-w-none">
                    Sin imagen
                  </div>
                )}
              </div>
              <input
                ref={(el) => {
                  if (el) fileRefs.current.set(item._key, el);
                  else fileRefs.current.delete(item._key);
                }}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label={`Archivo imagen ${idx + 1}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(idx, item._key, file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRefs.current.get(item._key)?.click()}
                disabled={uploadingKey === item._key}
                className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50 active:bg-amber-100 md:min-h-[44px] md:py-2.5"
              >
                {uploadingKey === item._key ? "Subiendo…" : item.src ? "Cambiar foto" : "Subir imagen"}
              </button>
              {uploadSuccessKey === item._key && uploadingKey !== item._key && (
                <p
                  role="status"
                  className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Archivo subido · pulsa &quot;Guardar galería&quot; para publicar los cambios
                </p>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Texto alternativo (accesibilidad) *
                </label>
                <input
                  value={item.alt}
                  onChange={(e) => update(idx, { alt: e.target.value })}
                  placeholder="Ej: Porcelanato instalado en sala"
                  className="w-full min-h-[44px] border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm"
                  required={!!item.src.trim()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Leyenda (aparece al pasar el mouse en la web)
                </label>
                <input
                  value={item.caption ?? ""}
                  onChange={(e) => update(idx, { caption: e.target.value })}
                  placeholder="Ej: Porcelanato en sala"
                  className="w-full min-h-[44px] border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => void deleteGalleryEntry(idx)}
                disabled={
                  deletingKey === item._key ||
                  uploadingKey === item._key ||
                  saving
                }
                className="inline-flex w-full sm:w-auto min-h-[48px] sm:min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-100 active:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                {deletingKey === item._key ? "Eliminando…" : "Eliminar de la web"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={addRow}
          className="min-h-[48px] sm:min-h-0 rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium hover:bg-gray-50 sm:py-2"
        >
          + Otra imagen
        </button>
        <button
          type="submit"
          disabled={saving}
          className="min-h-[48px] sm:min-h-0 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 sm:py-2"
        >
          {saving ? "Guardando…" : "Guardar galería"}
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
