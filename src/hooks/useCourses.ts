"use client";

import useSWR from "swr";
import { tutorApi } from "@/lib/api";
import type { Course, CourseFilters, CoursesResponse, CourseSection } from "@/types/course";

function buildKey(filters: CourseFilters): string {
  return `/courses?${new URLSearchParams(
    Object.fromEntries(
      Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => [k, String(v)])
    )
  ).toString()}`;
}

export function useCourses(filters: CourseFilters = {}) {
  const key = buildKey(filters);
  const { data, error, isLoading, mutate } = useSWR<CoursesResponse>(
    key,
    () => tutorApi.getCourses(filters),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  return {
    courses: data?.courses ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useCourse(id: number | null) {
  const { data, error, isLoading } = useSWR<Course>(
    id ? `/courses/${id}` : null,
    () => tutorApi.getCourse(id!),
    { revalidateOnFocus: false }
  );
  return { course: data, isLoading, error };
}

export function useCourseCurriculum(courseId: number | null) {
  const { data, error, isLoading } = useSWR<CourseSection[]>(
    courseId ? `/courses/${courseId}/curriculum` : null,
    () => tutorApi.getCurriculum(courseId!),
    { revalidateOnFocus: false }
  );
  return { curriculum: data ?? [], isLoading, error };
}
