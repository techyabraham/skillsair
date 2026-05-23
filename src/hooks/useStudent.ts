"use client";

import useSWR from "swr";
import { tutorApi } from "@/lib/api";
import type { EnrolledCourse, Certificate } from "@/types/course";
import type { StudentStats } from "@/types/user";

export function useEnrolledCourses(studentId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<EnrolledCourse[]>(
    studentId ? `/students/${studentId}/progress` : null,
    () => tutorApi.getStudentProgress(studentId!),
    { revalidateOnFocus: false }
  );
  return { enrolledCourses: data ?? [], isLoading, error, refresh: mutate };
}

export function useCertificates(studentId: number | null) {
  const { data, error, isLoading } = useSWR<Certificate[]>(
    studentId ? `/students/${studentId}/certificates` : null,
    () => tutorApi.getCertificates(studentId!),
    { revalidateOnFocus: false }
  );
  return { certificates: data ?? [], isLoading, error };
}

export function useStudentStats(studentId: number | null) {
  const { data, error, isLoading } = useSWR<StudentStats>(
    studentId ? `/students/${studentId}/stats` : null,
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
