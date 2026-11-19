/**
 * Patrón SVG sutil de planos arquitectónicos / líneas geométricas en dorado claro
 * (#D2BD8A al 15% de opacidad en escritorio, reducido al 7% en móvil).
 */
export default function ArchitecturalBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <svg
        className="size-full text-[#D2BD8A] opacity-[0.07] sm:opacity-15"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="fraylin-arch-grid"
            width="96"
            height="96"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 96 0 L 0 0 0 96"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.9"
            />
            <path
              d="M 48 0 L 48 96 M 0 48 L 96 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.4"
              strokeDasharray="3 4"
            />
            <circle
              cx="48"
              cy="48"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
            />
            <path
              d="M 0 96 L 96 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.35"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fraylin-arch-grid)" />
      </svg>
    </div>
  );
}
