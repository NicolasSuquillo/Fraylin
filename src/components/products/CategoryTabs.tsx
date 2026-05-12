"use client";

import * as LucideIcons from "lucide-react";
import type { Category } from "@/types";

function CategoryIcon({ name }: { name: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<{ size?: number }> | undefined;
  if (!Icon) return null;
  return <Icon size={14} />;
}

interface CategoryTabsProps {
  categories: Category[];
  selected: string;
  onSelect: (slug: string) => void;
  totalCount: number;
}

export default function CategoryTabs({
  categories,
  selected,
  onSelect,
  totalCount,
}: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 sm:justify-start lg:justify-end pb-1">
      <button
        onClick={() => onSelect("todos")}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
          selected === "todos"
            ? "bg-brand-primary text-neutral-dark shadow-md"
            : "bg-surface-primary text-text-secondary border border-brand-primary/25 hover:border-brand-primary hover:text-brand-primary"
        }`}
      >
        Todos ({totalCount})
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            selected === cat.slug
              ? "bg-brand-primary text-neutral-dark shadow-md"
              : "bg-surface-secondary text-text-secondary border border-brand-primary/20 hover:border-brand-primary hover:text-brand-primary"
          }`}
        >
          <CategoryIcon name={cat.icon} />
          {cat.label}
        </button>
      ))}
    </div>
  );
}
