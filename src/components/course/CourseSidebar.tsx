"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import type { CourseCategory, CourseFilters } from "@/types/course";

const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const DURATIONS = [
  { value: "short", label: "Under 5 hours" },
  { value: "medium", label: "5–20 hours" },
  { value: "long", label: "20+ hours" },
];

const RATINGS = [4, 3, 2];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CategoriesResponse {
  categories: CourseCategory[];
}

interface CourseSidebarProps {
  filters: CourseFilters;
  onFilterChange: (filters: Partial<CourseFilters>) => void;
  onReset: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FilterSection({ title, defaultOpen = true, children }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-100 pb-5 mb-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-sm font-semibold text-neutral-800">{title}</span>
        <svg
          className={cn("w-4 h-4 text-neutral-400 transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}

export function CourseSidebar({
  filters,
  onFilterChange,
  onReset,
  isMobile = false,
  onClose,
}: CourseSidebarProps) {
  const { data } = useSWR<CategoriesResponse>("/api/categories", fetcher);
  const categories = data?.categories || [];
  const hasFilters =
    filters.category || filters.level || filters.duration || filters.rating;

  return (
    <aside className={cn("bg-white", isMobile ? "h-full overflow-y-auto p-6" : "rounded-2xl border border-neutral-100 p-6 sticky top-24")}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-semibold text-neutral-900">Filters</h2>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={onReset}
              className="text-xs text-primary-800 font-medium hover:underline"
            >
              Clear all
            </button>
          )}
          {isMobile && onClose && (
            <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600" aria-label="Close filters">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <FilterSection title="Category">
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.slug} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value={cat.slug}
                checked={filters.category === cat.slug}
                onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
                className="w-4 h-4 text-primary-800 border-neutral-300 focus:ring-primary-800/30"
              />
              <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
                {cat.name}
              </span>
            </label>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-neutral-400">No categories available.</p>
          )}
        </div>
      </FilterSection>

      {/* Level */}
      <FilterSection title="Level">
        <div className="space-y-2">
          {LEVELS.map((level) => (
            <label key={level.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="level"
                value={level.value}
                checked={filters.level === level.value}
                onChange={(e) => onFilterChange({ level: e.target.value as CourseFilters["level"], page: 1 })}
                className="w-4 h-4 text-primary-800 border-neutral-300 focus:ring-primary-800/30"
              />
              <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
                {level.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Duration */}
      <FilterSection title="Duration">
        <div className="space-y-2">
          {DURATIONS.map((dur) => (
            <label key={dur.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="duration"
                value={dur.value}
                checked={filters.duration === dur.value}
                onChange={(e) => onFilterChange({ duration: e.target.value, page: 1 })}
                className="w-4 h-4 text-primary-800 border-neutral-300 focus:ring-primary-800/30"
              />
              <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
                {dur.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Minimum Rating">
        <div className="space-y-2">
          {RATINGS.map((rating) => (
            <label key={rating} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={filters.rating === rating}
                onChange={() => onFilterChange({ rating, page: 1 })}
                className="w-4 h-4 text-primary-800 border-neutral-300 focus:ring-primary-800/30"
              />
              <span className="text-sm text-neutral-600 group-hover:text-neutral-900 flex items-center gap-1 transition-colors">
                {rating}+ ⭐
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price">
        <div className="space-y-2">
          {[
            { value: "free", label: "Free" },
            { value: "paid", label: "Paid" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="price"
                value={opt.value}
                className="w-4 h-4 text-primary-800 border-neutral-300 focus:ring-primary-800/30"
              />
              <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {isMobile && (
        <button
          onClick={onClose}
          className="w-full btn-primary mt-4"
        >
          Apply Filters
        </button>
      )}
    </aside>
  );
}
