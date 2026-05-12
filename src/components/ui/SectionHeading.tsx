interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  light?: boolean;
  className?: string;
}

export default function SectionHeading({
  title,
  subtitle,
  light = false,
  className,
}: SectionHeadingProps) {
  return (
    <div className={`text-center ${className ?? "mb-12"}`}>
      <h2
        className={`text-3xl md:text-4xl font-bold font-heading mb-3 tracking-wide ${
          light ? "text-white" : "text-text-primary"
        }`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h2>
      <div className="w-20 h-px bg-brand-primary mx-auto mb-4" />
      {subtitle && (
        <p
          className={`text-lg max-w-2xl mx-auto ${
            light ? "text-white/80" : "text-text-secondary"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
