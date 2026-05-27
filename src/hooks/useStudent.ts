"use client";

import useSWR from "swr";
import { tutorApi } from "@/lib/api";
import type { EnrolledCourse, Certificate } from "@/types/course";
import type { StudentStats } from "@/types/user";

export function useEnrolledCourses(studentId: number | null) {
  // Guard: 0 is falsy in JS — explicitly check > 0 to avoid silently skipping the fetch
  const key = studentId != null && studentId > 0 ? `/students/${studentId}/progress` : null;
  const { data, error, isLoading, mutate } = useSWR<EnrolledCourse[]>(
    key,
    () => tutorApi.getStudentProgress(studentId!),
    { revalidateOnFocus: false }
  );
  return { enrolledCourses: data ?? [], isLoading, error, refresh: mutate };
}

export function useCertificates(studentId: number | null) {
  const key = studentId != null && studentId > 0 ? `/students/${studentId}/certificates` : null;
  const { data, error, isLoading } = useSWR<Certificate[]>(
    key,
    () => tutorApi.getCertificates(studentId!),
    { revalidateOnFocus: false }
  );
  return { certificates: data ?? [], isLoading, error };
}

export function useStudentStats(studentId: number | null) {
  const key = studentId != null && studentId > 0 ? `/students/${studentId}/stats` : null;
  const { data, error, isLoading } = useSWR<StudentStats>(
    key,
    () => tutorApi.getStudentStats(studentId!),
    { revalidateOnFocus: false }
  );
  return {
    stats: data ?? {
      totalEnrolled: 0,
      totalCompleted: 0,
      totalCertificates: 0,
      totalWatchedHours: 0,
      currentStreak: 0,
    },
    isLoading,
    error,
  };
}
