"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";

export default function FloatingWhatsApp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl p-4 w-52 border border-gray-100 animate-fade-in">
          <p className="text-sm font-semibold text-neutral-dark mb-3">
            Contáctanos por WhatsApp
          </p>
          {BUSINESS.whatsapp.map((wa) => (
            <a
              key={wa.number}
              href={buildWhatsAppUrl(
                wa.number,
                "Hola Fraylin, me gustaría recibir más información."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-xl px-3 py-2 mb-2 transition-colors font-medium"
            >
              <MessageCircle size={16} />
              {wa.label}
            </a>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        aria-label="Abrir WhatsApp"
      >
        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-50" />
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
