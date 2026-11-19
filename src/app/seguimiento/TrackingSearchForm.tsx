"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

export default function TrackingSearchForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^FR[A-Z0-9]{6,32}$/.test(cleaned)) {
      setError("Ingresa un código válido (ej. FR8A2F1C9B4D0E1234).");
      return;
    }
    setError(null);
    router.push(`/seguimiento/${encodeURIComponent(cleaned)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/60 pointer-events-none"
          />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="Código de pedido (ej. FR...)"
            aria-label="Código de pedido"
            className="w-full rounded-lg border border-[#E2DDD3] bg-white py-3 pr-4 pl-11 font-mono text-sm text-[#1F1D1A] placeholder:font-sans placeholder:text-[#8C877E] focus:border-[#C9B079] focus:outline-none focus:ring-2 focus:ring-[#C9B079]/25"
          />
        </div>
        <button
          type="submit"
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#C9B079] px-6 py-3 text-sm font-semibold text-[#1F1D1A] shadow-xs transition-colors duration-200 hover:bg-[#D2BD8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
        >
          Consultar pedido
          <ArrowRight size={16} />
        </button>
      </div>
      {error && <p className="text-xs text-red-600 font-medium text-left px-1">{error}</p>}
    </form>
  );
}

