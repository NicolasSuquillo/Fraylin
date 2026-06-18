"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, MessageCircle, Package, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import SuccessConfetti from "@/components/checkout/SuccessConfetti";

interface PaymentSuccessProps {
  clientTransactionId: string;
  totalFormatted: string;
  whatsappUrl: string;
  comprobanteEnabled: boolean;
}

function useCountUp(target: number, delay = 480) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / 950, 1);
        setVal(target * (1 - (1 - p) ** 3));
        if (p < 1) requestAnimationFrame(tick);
        else setVal(target);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

const STEPS = [
  { Icon: Check,          label: "Pago recibido",   sub: "¡Confirmado!",   done: true  },
  { Icon: MessageCircle,  label: "Coordinamos",      sub: "Por WhatsApp",   done: false },
  { Icon: Package,        label: "Retiras tu pedido o llega",  sub: "A tu puerta",    done: false },
];

export default function PaymentSuccess({ clientTransactionId, totalFormatted, whatsappUrl, comprobanteEnabled }: PaymentSuccessProps) {
  const { clear } = useCart();
  const [copied, setCopied] = useState(false);

  const targetNum = parseFloat(totalFormatted.replace(/[^0-9.]/g, "")) || 0;
  const decimals   = (totalFormatted.split(".")[1] ?? "").length;
  const prefix     = totalFormatted.startsWith("$") ? "$" : "";
  const animated   = useCountUp(targetNum);
  const displayTotal = prefix + animated.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  useEffect(() => {
    clear();
    sessionStorage.removeItem("fraylin_order");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(clientTransactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard no disponible */ }
  };

  return (
    <div className="relative w-full flex flex-col items-center gap-8">
      <style>{`
        @keyframes psPop {
          0%   { transform: scale(0);    opacity: 0; }
          65%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes psRing {
          0%   { box-shadow: 0 0 0 0    rgba(201,168,76,0.55); }
          70%  { box-shadow: 0 0 0 26px rgba(201,168,76,0);   }
          100% { box-shadow: 0 0 0 0    rgba(201,168,76,0);   }
        }
        @keyframes psCheck {
          to { stroke-dashoffset: 0; }
        }
        @keyframes psShine {
          0%   { transform: translateX(-200%) rotate(20deg); }
          100% { transform: translateX(400%)  rotate(20deg); }
        }
        @keyframes psSparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.7); }
          50%       { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes psRise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes psStamp {
          0%   { transform: scale(2) rotate(-14deg); opacity: 0;   }
          55%  { transform: scale(0.9) rotate(3deg);  opacity: 1;   }
          80%  { transform: scale(1.04) rotate(-1deg); opacity: 1;  }
          100% { transform: scale(1) rotate(-6deg);   opacity: 0.9; }
        }
        @keyframes psStepIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes psCounterIn {
          from { opacity: 0; transform: translateY(6px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>

      <SuccessConfetti />

      {/* ── Sello dorado ── */}
      <div className="relative flex items-center justify-center" style={{ width: 148, height: 148 }}>
        {/* Destellos radiales */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const r   = 66;
          const cx  = 74 + r * Math.cos(rad);
          const cy  = 74 + r * Math.sin(rad);
          return (
            <div
              key={i}
              className="absolute"
              style={{
                width:        8,
                height:       8,
                left:         cx - 4,
                top:          cy - 4,
                background:   "#C9A84C",
                borderRadius: 2,
                transform:    `rotate(${angle + 45}deg)`,
                animation:    `psSparkle 2.6s ease-in-out ${(i * 0.2).toFixed(1)}s infinite`,
                opacity:      0.3,
              }}
            />
          );
        })}

        {/* Círculo principal */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            width:        112,
            height:       112,
            borderRadius: "50%",
            background:   "linear-gradient(140deg, #E8C87A 0%, #C9A84C 50%, #9A7020 100%)",
            boxShadow:    "0 10px 32px rgba(160,120,48,0.45), 0 2px 6px rgba(0,0,0,0.12)",
            animation:    "psPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both, psRing 2.4s ease-out 0.6s infinite",
          }}
        >
          {/* Shine sweep */}
          <div
            style={{
              position:   "absolute",
              top:        0,
              bottom:     0,
              width:      "55%",
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.48) 50%, transparent 100%)",
              animation:  "psShine 3.2s ease-in-out 0.9s infinite",
            }}
          />
          {/* Check */}
          <svg
            width="54"
            height="54"
            viewBox="0 0 56 56"
            fill="none"
            style={{ position: "relative", zIndex: 1 }}
          >
            <path
              d="M14 29l10 10 18-20"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="60"
              strokeDashoffset="60"
              style={{ animation: "psCheck 0.5s ease 0.42s forwards" }}
            />
          </svg>
        </div>
      </div>

      {/* ── Título ── */}
      <div className="text-center" style={{ animation: "psRise 0.5s ease 0.3s both" }}>
        <h1
          className="text-4xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.015em" }}
        >
          ¡Pago confirmado!
        </h1>
        <p className="text-text-secondary mt-2 text-base">
          Recibimos tu pago de{" "}
          <span className="font-bold text-brand-primary">{displayTotal}</span>
        </p>
      </div>

      {/* ── Ticket de recibo ── */}
      <div
        className="w-full max-w-sm"
        style={{ animation: "psRise 0.5s ease 0.45s both" }}
      >
        <div
          className="bg-white rounded-2xl"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
        >
          {/* Cabecera */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-primary/70" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
                Fraylin · Comprobante de pago
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-1">
                  N.° de pedido
                </p>
                <button
                  type="button"
                  onClick={copyId}
                  className="inline-flex items-center gap-1.5 font-mono font-bold text-sm text-text-primary hover:text-brand-primary transition-colors truncate"
                  title="Copiar número de pedido"
                >
                  <span className="truncate">{clientTransactionId}</span>
                  {copied
                    ? <Check size={13} className="text-emerald-500 shrink-0" />
                    : <Copy size={13} className="opacity-40 shrink-0" />}
                </button>
                {copied && (
                  <p className="text-[10px] text-emerald-600 mt-0.5 animate-fade-in">¡Copiado!</p>
                )}
              </div>

              {/* Sello PAGADO */}
              <div
                className="shrink-0 mt-0.5"
                style={{
                  border:        "2.5px solid #059669",
                  borderRadius:  5,
                  padding:       "3px 9px",
                  color:         "#059669",
                  fontWeight:    800,
                  fontSize:      11,
                  letterSpacing: "0.15em",
                  animation:     "psStamp 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.9s both",
                  opacity:       0,
                }}
              >
                PAGADO
              </div>
            </div>
          </div>

          {/* Perforación — círculos en los bordes dan efecto de agujero de boleto */}
          <div className="relative h-0">
            <div
              className="absolute rounded-full bg-accent-cream"
              style={{ width: 24, height: 24, left: -12, top: -12, zIndex: 10 }}
            />
            <div
              className="absolute rounded-full bg-accent-cream"
              style={{ width: 24, height: 24, right: -12, top: -12, zIndex: 10 }}
            />
            <div
              className="absolute border-t-2 border-dashed border-neutral-light"
              style={{ left: 16, right: 16, top: 0 }}
            />
          </div>

          {/* Total */}
          <div className="px-6 pt-5 pb-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-1">
                  Total pagado
                </p>
                <p
                  className="text-3xl font-bold text-text-primary"
                  style={{
                    fontFamily: "var(--font-heading)",
                    animation:  "psCounterIn 0.4s ease 0.5s both",
                  }}
                >
                  {displayTotal}
                </p>
              </div>
              <p className="text-xs text-text-secondary/70 mb-1">IVA incluido</p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-emerald-700">
                Pago verificado y registrado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ¿Qué sigue? (timeline) ── */}
      <div
        className="w-full max-w-sm"
        style={{ animation: "psRise 0.5s ease 0.6s both" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary/60 mb-4 text-center">
          ¿Qué sigue?
        </p>
        <div className="flex items-start">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center"
              style={{ animation: `psStepIn 0.4s ease ${0.65 + i * 0.1}s both`, opacity: 0 }}
            >
              <div className="flex items-center w-full">
                {i > 0 && <div className="flex-1 h-0.5 bg-neutral-light" />}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    step.done
                      ? "text-white"
                      : "bg-neutral-light text-text-secondary"
                  }`}
                  style={step.done ? {
                    background:  "linear-gradient(135deg, #E8C87A 0%, #C9A84C 60%, #9A7020 100%)",
                    boxShadow:   "0 3px 10px rgba(201,168,76,0.4)",
                  } : undefined}
                >
                  <step.Icon size={17} />
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-neutral-light" />}
              </div>
              <p className={`text-[11px] font-semibold text-center mt-2 leading-snug ${
                step.done ? "text-brand-primary" : "text-text-secondary"
              }`}>
                {step.label}
              </p>
              <p className="text-[10px] text-text-secondary/55 text-center">{step.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTAs ── */}
      <div
        className="w-full max-w-sm flex flex-col gap-3"
        style={{ animation: "psRise 0.5s ease 0.78s both" }}
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-colors inline-flex items-center justify-center gap-2"
          style={{ boxShadow: "0 4px 14px rgba(22,163,74,0.35)" }}
        >
          <MessageCircle size={18} />
          Coordinar entrega por WhatsApp
        </a>
        {comprobanteEnabled && (
          <a
            href={`/api/orders/${clientTransactionId}/comprobante`}
            download={`comprobante-${clientTransactionId}.pdf`}
            className="w-full py-3 border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/5 font-semibold rounded-2xl transition-colors inline-flex items-center justify-center gap-2"
          >
            <Download size={17} />
            Descargar comprobante
          </a>
        )}
        <Link
          href="/"
          className="w-full py-3 text-text-secondary hover:text-text-primary font-semibold rounded-2xl transition-colors inline-flex items-center justify-center gap-2 hover:bg-neutral-light/60"
        >
          <ShoppingBag size={17} />
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
