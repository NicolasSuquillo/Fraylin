import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import TestimoniosForm from "./TestimoniosForm";
import type { Review } from "@/types";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-stone-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2);
  return (
    <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-brand-primary uppercase">{letters}</span>
    </div>
  );
}

function ReviewCard({ review, delay }: { review: Review; delay: number }) {
  return (
    <Reveal delay={delay}>
      <article className="bg-surface-primary rounded-2xl p-5 border border-stone-200 flex flex-col gap-3 h-full">
        <Stars rating={review.rating} />
        <p className="text-text-secondary text-sm leading-relaxed flex-1">&ldquo;{review.body}&rdquo;</p>
        <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
          {review.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.avatarUrl}
              alt={review.authorName}
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
          ) : (
            <Initials name={review.authorName} />
          )}
          <span className="text-sm font-semibold text-text-primary">{review.authorName}</span>
        </div>
      </article>
    </Reveal>
  );
}

interface Props {
  reviews: Review[];
}

export default function TestimoniosSection({ reviews }: Props) {
  return (
    <section id="testimonios" className="md:py-5 bg-neutral-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal delay={0}>
          <SectionHeading
            title="Lo que dicen nuestros clientes"
            subtitle="Experiencias reales de quienes confían en Fraylin"
          />
        </Reveal>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {reviews.map((r, i) => (
              <ReviewCard key={r.id} review={r} delay={0.06 + i * 0.05} />
            ))}
          </div>
        ) : (
          <Reveal delay={0.06}>
            <p className="text-center text-text-secondary text-sm mb-14">
              Sé el primero en dejar tu reseña.
            </p>
          </Reveal>
        )}

        <Reveal delay={0.1}>
          <TestimoniosForm />
        </Reveal>
      </div>
    </section>
  );
}
