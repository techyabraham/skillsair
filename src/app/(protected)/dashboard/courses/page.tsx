import type { Metadata } from "next";
import { MyCourses } from "@/components/dashboard/MyCourses";

export const metadata: Metadata = { title: "My Courses" };

export default function MyCoursesPage() {
  return <MyCourses />;
}
