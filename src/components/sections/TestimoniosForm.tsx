"use client";

import { useState, useRef } from "react";

type State = "idle" | "loading" | "success" | "error";

export default function TestimoniosForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg("Selecciona una calificación");
      return;
    }
    setState("loading");
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);
    fd.set("rating", String(rating));

    try {
      const res = await fetch("/api/reviews", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Error al enviar");
      }
      setState("success");
      formRef.current?.reset();
      setRating(0);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al enviar");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-2xl p-6 text-center max-w-lg mx-auto">
        <p className="text-lg font-semibold text-brand-primary mb-1">
          ¡Gracias por tu reseña!
        </p>
        <p className="text-sm text-text-secondary">
          Tu comentario será revisado y publicado pronto.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-4 text-sm text-brand-primary underline underline-offset-2"
        >
          Dejar otra reseña
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-surface-primary border border-stone-200 rounded-2xl p-6 max-w-lg mx-auto space-y-4"
    >
      <h3
        className="text-lg font-bold text-text-primary"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Deja tu reseña
      </h3>

      {/* Star picker */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Calificación <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-3xl leading-none transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
            >
              <span className={(hover || rating) >= star ? "text-amber-400" : "text-stone-300"}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="rev-name" className="block text-sm font-medium text-text-secondary mb-1.5">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          id="rev-name"
          name="authorName"
          type="text"
          required
          maxLength={80}
          placeholder="Tu nombre"
          className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
        />
      </div>

      <div>
        <label htmlFor="rev-body" className="block text-sm font-medium text-text-secondary mb-1.5">
          Comentario <span className="text-red-500">*</span>
        </label>
        <textarea
          id="rev-body"
          name="body"
          required
          minLength={10}
          maxLength={500}
          rows={4}
          placeholder="Cuéntanos tu experiencia..."
          className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 resize-none"
        />
      </div>

      <div>
        <label htmlFor="rev-avatar" className="block text-sm font-medium text-text-secondary mb-1.5">
          Foto (opcional)
        </label>
        <input
          id="rev-avatar"
          name="avatar"
          type="file"
          accept="image/*"
          className="w-full text-sm text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
        />
        <p className="text-xs text-stone-400 mt-1">Máximo 2 MB</p>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full bg-brand-primary text-neutral-dark font-semibold py-3 rounded-xl text-sm transition hover:opacity-90 disabled:opacity-60"
      >
        {state === "loading" ? "Enviando…" : "Enviar reseña"}
      </button>
    </form>
  );
}
