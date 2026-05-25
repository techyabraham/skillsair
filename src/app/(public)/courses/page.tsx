"use client";

import React, { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useCourses } from "@/hooks/useCourses";
import { CourseGrid } from "@/components/course/CourseGrid";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { Pagination } from "@/components/ui/Pagination";
import { Input } from "@/components/ui/Input";
import type { CourseFilters } from "@/types/course";

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest Rated" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<CourseFilters>({
    category: searchParams.get("category") || undefined,
    page: 1,
    perPage: 12,
    sort: "popular",
  });
  const [searchInput, setSearchInput] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { courses, total, totalPages, currentPage, isLoading } = useCourses(filters);

  const updateFilters = useCallback((updates: Partial<CourseFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ page: 1, perPage: 12, sort: "popular" });
    setSearchInput("");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput, page: 1 });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <div className="bg-hero-gradient text-white pt-28 pb-12">
        <div className="container-wide">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">Browse Courses</h1>
          <p className="text-white/70 text-lg max-w-xl">
            Discover {total > 0 ? `${total}+` : "hundreds of"} professional courses to advance your skills.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-3 max-w-xl">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search courses, topics, instructors..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white focus:text-neutral-900 focus:placeholder-neutral-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-accent hover:bg-accent-600 text-white font-semibold text-sm transition-all shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="container-wide py-10">
        <div className="flex gap-8">
          {/* Sidebar — desktop */}
          <div className="hidden lg:block w-64 shrink-0">
            <CourseSidebar
              filters={filters}
              onFilterChange={updateFilters}
              onReset={resetFilters}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm3 6a1 1 0 011-1h10a1 1 0 010 2H7a1 1 0 01-1-1zm3 6a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
                  </svg>
                  Filters
                </button>
                <p className="text-sm text-neutral-500">
                  {isLoading ? "Loading..." : `${total} courses found`}
                </p>
              </div>

              <select
                value={filters.sort || "popular"}
                onChange={(e) => updateFilters({ sort: e.target.value as CourseFilters["sort"], page: 1 })}
                className="px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-800/20 focus:border-primary-800"
                aria-label="Sort courses"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Grid */}
            <CourseGrid
              courses={courses}
              isLoading={isLoading}
              emptyMessage="No courses match your filters"
              emptySubtext="Try clearing some filters or searching for something different."
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => updateFilters({ page })}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={() => setFiltersOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-modal">
            <CourseSidebar
              filters={filters}
              onFilterChange={updateFilters}
              onReset={resetFilters}
              isMobile
              onClose={() => setFiltersOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
