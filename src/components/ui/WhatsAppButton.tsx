import { ArrowRight, ChevronRight } from "lucide-react";

export function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface WhatsAppButtonProps {
  href: string;
  variant: "hero" | "card" | "compact";
  label: string;
  sublabel?: string;
}

export default function WhatsAppButton({ href, variant, label, sublabel }: WhatsAppButtonProps) {
  if (variant === "hero") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-flex min-h-[3.25rem] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#25D366] via-[#20bd5a] to-emerald-700 px-8 py-3.5 text-base font-semibold text-white shadow-[0_10px_40px_-12px_rgba(16,120,72,0.55)] ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_-14px_rgba(16,120,72,0.55)] hover:ring-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 active:translate-y-0 sm:text-lg"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 transition-colors group-hover:bg-white/25"
        >
          <WhatsAppIcon className="h-[18px] w-[18px] text-white sm:h-5 sm:w-5" />
        </span>
        <span className="tracking-tight">{label}</span>
        <ArrowRight
          className="h-5 w-5 shrink-0 text-white/85 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white"
          aria-hidden
        />
      </a>
    );
  }

  if (variant === "card") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex min-h-[4.25rem] items-center gap-3.5 overflow-hidden rounded-2xl border border-stone-200/90 bg-surface-primary px-4 py-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-px hover:border-[#25D366]/35 hover:shadow-[0_12px_28px_-12px_rgba(37,211,102,0.22)] active:translate-y-0"
      >
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-[60%] w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-[#25D366] to-emerald-600 opacity-80 transition-opacity group-hover:opacity-100"
        />
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-600/15 transition-all duration-300 group-hover:bg-emerald-500/[0.14] group-hover:ring-emerald-600/25"
        >
          <WhatsAppIcon className="h-[22px] w-[22px] text-[#128C7E]" />
        </span>
        <span className="min-w-0 flex-1 pl-0.5 text-left">
          <span className="block text-[15px] font-semibold leading-snug tracking-tight text-text-primary transition-colors group-hover:text-brand-dark">
            {label}
          </span>
          {sublabel && (
            <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              {sublabel}
            </span>
          )}
        </span>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-stone-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#25D366]"
          aria-hidden
        />
      </a>
    );
  }

  // compact
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-br from-[#25D366] via-[#20bd5a] to-emerald-700 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/15 ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-900/25 hover:ring-white/25"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
        <WhatsAppIcon className="h-6 w-6 scale-90" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[13px] font-bold leading-tight">{label}</span>
        {sublabel && (
          <span className="text-[11px] font-medium text-white/85">{sublabel}</span>
        )}
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-white/80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white"
        aria-hidden
      />
    </a>
  );
}
