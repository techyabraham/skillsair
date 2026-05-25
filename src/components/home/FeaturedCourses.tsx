"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { CoursesResponse } from "@/types/course";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function FeaturedCourses() {
  const { data, isLoading } = useSWR<CoursesResponse>(
    "/api/courses?per_page=6&sort=newest",
    fetcher,
    { revalidateOnFocus: false }
  );

  const courses = data?.courses ?? [];

  return (
    <section className="py-16 md:py-24 bg-neutral-50" aria-labelledby="featured-courses-heading">
      <div className="container-wide">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-accent font-semibold text-sm mb-2 uppercase tracking-wide">Featured</p>
            <h2 id="featured-courses-heading" className="section-title">
              Top Courses This Month
            </h2>
            <p className="section-subtitle">
              Handpicked by our team based on student outcomes and instructor quality.
            </p>
          </div>
          <Link href="/courses" className="shrink-0">
            <Button variant="outline" size="md">
              View All Courses
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.08 } },
              hidden: {},
            }}
          >
            {courses.map((course) => (
              <motion.div
                key={course.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <p className="text-neutral-400 text-sm">No featured courses available at this time.</p>
          </div>
        )}
      </div>
    </section>
  );
}
