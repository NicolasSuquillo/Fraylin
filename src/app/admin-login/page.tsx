"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/admin/products");
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al iniciar sesión");
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-100 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Panel Fraylin</h1>
        <p className="text-sm text-gray-500 mb-6">Introduce la contraseña del panel.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              enterKeyHint="go"
              className="w-full min-h-[48px] border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
              autoFocus
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 transition disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? "Entrando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
