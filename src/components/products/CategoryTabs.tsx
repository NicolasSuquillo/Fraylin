"use client";

import type { Category } from "@/types";

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
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect("todos")}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
          selected === "todos"
            ? "bg-brand-primary text-white shadow-md"
            : "bg-white text-neutral-dark border border-gray-200 hover:border-brand-primary hover:text-brand-primary"
        }`}
      >
        Todos ({totalCount})
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            selected === cat.slug
              ? "bg-brand-primary text-white shadow-md"
              : "bg-white text-neutral-dark border border-gray-200 hover:border-brand-primary hover:text-brand-primary"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
