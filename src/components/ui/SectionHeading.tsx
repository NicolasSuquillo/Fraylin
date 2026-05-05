interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  light?: boolean;
}

export default function SectionHeading({
  title,
  subtitle,
  light = false,
}: SectionHeadingProps) {
  return (
    <div className="text-center mb-12">
      <h2
        className={`text-3xl md:text-4xl font-bold font-heading mb-3 ${
          light ? "text-white" : "text-neutral-dark"
        }`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h2>
      <div className="w-16 h-1 bg-brand-primary mx-auto rounded-full mb-4" />
      {subtitle && (
        <p
          className={`text-lg max-w-2xl mx-auto ${
            light ? "text-white/80" : "text-neutral-mid"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
