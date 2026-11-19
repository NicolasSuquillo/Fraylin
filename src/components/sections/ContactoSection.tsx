"use client";

import { useState } from "react";
import { Phone, MapPin, Clock, Send } from "lucide-react";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";

export default function ContactoSection() {
  const [form, setForm] = useState({ nombre: "", telefono: "", mensaje: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Hola Fraylin! 👋\n\n*Nombre:* ${form.nombre}\n*Teléfono:* ${form.telefono}\n*Mensaje:* ${form.mensaje}`;
    const url = buildWhatsAppUrl(BUSINESS.whatsapp[0].number, msg);
    window.open(url, "_blank", "noopener,noreferrer");
    setForm({ nombre: "", telefono: "", mensaje: "" });
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <section id="contacto" className="relative z-10 py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl space-y-2">
          <p className="text-xs font-bold tracking-[0.16em] text-[#7A6336] uppercase">
            Asesoría y Cotización
          </p>
          <h2
            className="text-3xl font-bold tracking-tight text-[#1F1D1A] sm:text-4xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Contáctanos
          </h2>
          <p className="text-sm text-[#6E6A63] sm:text-base">
            Estamos listos para asesorarte en la selección y metraje de tu obra.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Formulario */}
          <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6 shadow-xl shadow-black/5 sm:p-8 lg:col-span-6">
            <h3
              className="mb-5 text-xl font-bold text-[#1F1D1A]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Envíanos un mensaje
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="contacto-nombre"
                  className="mb-1.5 block text-sm font-medium text-[#1F1D1A]"
                >
                  Nombre *
                </label>
                <input
                  id="contacto-nombre"
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Tu nombre"
                  className="w-full rounded-lg border border-[#E2DDD3] bg-white px-4 py-2.5 text-sm text-[#1F1D1A] placeholder:text-[#8C877E] transition-colors focus:border-[#C9B079] focus:outline-none focus:ring-2 focus:ring-[#C9B079]/25"
                />
              </div>
              <div>
                <label
                  htmlFor="contacto-telefono"
                  className="mb-1.5 block text-sm font-medium text-[#1F1D1A]"
                >
                  Teléfono
                </label>
                <input
                  id="contacto-telefono"
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  placeholder="098 4025 792"
                  className="w-full rounded-lg border border-[#E2DDD3] bg-white px-4 py-2.5 text-sm text-[#1F1D1A] placeholder:text-[#8C877E] transition-colors focus:border-[#C9B079] focus:outline-none focus:ring-2 focus:ring-[#C9B079]/25"
                />
              </div>
              <div>
                <label
                  htmlFor="contacto-mensaje"
                  className="mb-1.5 block text-sm font-medium text-[#1F1D1A]"
                >
                  Mensaje *
                </label>
                <textarea
                  id="contacto-mensaje"
                  required
                  value={form.mensaje}
                  onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                  placeholder="¿Qué acabado o metraje necesitas cotizar?"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[#E2DDD3] bg-white px-4 py-2.5 text-sm text-[#1F1D1A] placeholder:text-[#8C877E] transition-colors focus:border-[#C9B079] focus:outline-none focus:ring-2 focus:ring-[#C9B079]/25"
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C9B079] px-5 py-3 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:bg-[#D2BD8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
              >
                <Send size={16} aria-hidden="true" />
                Enviar por WhatsApp
              </button>
              <p
                className={`text-center text-xs transition-colors ${
                  sent ? "font-semibold text-emerald-700" : "text-[#6E6A63]"
                }`}
                aria-live="polite"
              >
                {sent
                  ? "¡Mensaje preparado en WhatsApp!"
                  : "Al enviar, se abrirá WhatsApp con tu consulta lista."}
              </p>
            </form>
          </div>

          {/* Info de contacto + Mapa */}
          <div className="flex flex-col gap-6 lg:col-span-6">
            <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6">
              <h3
                className="mb-4 text-lg font-bold text-[#1F1D1A]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Showroom y atención directa
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-[#7A6336]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-[#1F1D1A]">{BUSINESS.address}</p>
                    <a
                      href={BUSINESS.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#7A6336] hover:underline"
                    >
                      Ver en Google Maps →
                    </a>
                  </div>
                </li>
                {BUSINESS.phones.map((phone, i) => (
                  <li key={phone} className="flex items-center gap-3">
                    <Phone size={18} className="shrink-0 text-[#7A6336]" aria-hidden="true" />
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:+593${phone.replace(/\s/g, "").slice(1)}`}
                        className="text-sm font-medium text-[#1F1D1A] transition-colors hover:text-[#7A6336]"
                      >
                        {phone}
                      </a>
                      <a
                        href={buildWhatsAppUrl(
                          BUSINESS.whatsapp[i].number,
                          "Hola Fraylin, necesito más información."
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-[#F2EFE9] px-2.5 py-0.5 text-xs font-semibold text-[#7A6336] hover:bg-[#C9B079]/30"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </li>
                ))}
                <li className="flex items-start gap-3">
                  <Clock size={18} className="mt-0.5 shrink-0 text-[#7A6336]" aria-hidden="true" />
                  <div className="space-y-0.5 text-sm text-[#6E6A63]">
                    <p>{BUSINESS.hours.weekdays}</p>
                    <p>{BUSINESS.hours.saturday}</p>
                    <p>{BUSINESS.hours.sunday}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E6E1D6] bg-white">
              <iframe
                src={BUSINESS.mapsEmbedUrl}
                width="100%"
                height="240"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Fraylin Acabados en Quito"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
