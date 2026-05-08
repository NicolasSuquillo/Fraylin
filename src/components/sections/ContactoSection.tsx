"use client";

import { useState } from "react";
import { Phone, MapPin, Clock, MessageCircle, Send } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";

export default function ContactoSection() {
  const [form, setForm] = useState({ nombre: "", telefono: "", mensaje: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Hola Fraylin! 👋\n\n*Nombre:* ${form.nombre}\n*Teléfono:* ${form.telefono}\n*Mensaje:* ${form.mensaje}`;
    const url = buildWhatsAppUrl(BUSINESS.whatsapp[0].number, msg);
    window.open(url, "_blank");
  };

  return (
    <section id="contacto" className="py-20 bg-neutral-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal delay={0}>
          <SectionHeading
            title="Contáctanos"
            subtitle="Estamos listos para ayudarte con tu proyecto"
            light
          />
        </Reveal>

        {/* Fila 1: formulario + info de contacto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Formulario */}
          <Reveal delay={0.06}>
          <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/10">
            <h3
              className="text-xl font-bold text-white mb-6"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Envíanos un mensaje
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">Nombre *</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Tu nombre"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">Teléfono</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  placeholder="0987 654 321"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">Mensaje *</label>
                <textarea
                  required
                  value={form.mensaje}
                  onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                  placeholder="¿Qué producto o servicio necesitas? ¿Tienes alguna pregunta?"
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
              >
                <Send size={18} />
                Enviar por WhatsApp
              </button>
              <p className="text-xs text-white/40 text-center">
                Al enviar, se abrirá WhatsApp con tu mensaje listo para enviar.
              </p>
            </form>
          </div>
          </Reveal>

          {/* Info de contacto + redes */}
          <Reveal delay={0.12}>
          <div className="flex flex-col gap-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3
                className="text-base font-semibold text-brand-light mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Información de contacto
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-brand-light mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-white">{BUSINESS.address}</p>
                    <a href={BUSINESS.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-light hover:underline">
                      Ver en Google Maps →
                    </a>
                  </div>
                </li>
                {BUSINESS.phones.map((phone, i) => (
                  <li key={phone} className="flex items-center gap-3">
                    <Phone size={18} className="text-brand-light shrink-0" />
                    <div>
                      <a href={`tel:+593${phone.replace(/\s/g, "").slice(1)}`} className="text-sm text-white hover:text-brand-light transition-colors">
                        {phone}
                      </a>
                      <a
                        href={buildWhatsAppUrl(BUSINESS.whatsapp[i].number, "Hola Fraylin, necesito más información.")}
                        target="_blank" rel="noopener noreferrer"
                        className="ml-2 text-xs text-green-400 hover:underline"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </li>
                ))}
                <li className="flex items-start gap-3">
                  <Clock size={18} className="text-brand-light mt-0.5 shrink-0" />
                  <div className="text-sm text-white/80 space-y-0.5">
                    <p>{BUSINESS.hours.weekdays}</p>
                    <p>{BUSINESS.hours.saturday}</p>
                    <p className="text-xs text-brand-light italic mt-1">{BUSINESS.hours.note}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3
                className="text-base font-semibold text-brand-light mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Redes sociales
              </h3>
              <div className="flex flex-col gap-2">
                <a href={BUSINESS.social.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-white/80 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-white/10">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400 shrink-0"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                  Facebook — Fraylin
                </a>
                <a href={BUSINESS.social.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-white/80 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-white/10">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-pink-400 shrink-0"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  Instagram — @fraylin.acabados
                </a>
                <a href={BUSINESS.social.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-white/80 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-white/10">
                  <MessageCircle size={18} className="text-cyan-400" />
                  TikTok — @fraylin.0013
                </a>
              </div>
            </div>
          </div>
          </Reveal>
        </div>

        {/* Fila 2: mapa ancho completo */}
        <Reveal delay={0.18}>
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3
            className="text-base font-semibold text-brand-light mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Ubicación
          </h3>
          <div className="relative w-full aspect-[21/9] min-h-[220px] rounded-xl overflow-hidden border border-brand-primary/20 bg-black/30 shadow-inner">
            <iframe
              title="Mapa: Fraylin — Avenida Juan de Molinares, Quito"
              src={BUSINESS.mapsEmbedUrl}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <a
            href={BUSINESS.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-brand-light hover:text-white transition-colors"
          >
            <MapPin size={16} className="shrink-0" />
            Abrir dirección en Google Maps
          </a>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
