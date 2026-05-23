"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@apollo/client";
import { GET_FEATURED_COURSES } from "@/graphql/queries/courses";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { Course } from "@/types/course";

interface CoursesQueryResult {
  courses: {
    nodes: Array<{
      id: string;
      databaseId: number;
      title: string;
      slug: string;
      excerpt: string;
      featuredImage: { node: { sourceUrl: string; altText: string } } | null;
      courseData: {
        price: number;
        regularPrice: number;
        salePrice?: number;
        isFree: boolean;
        level: string;
        duration: number;
        totalLessons: number;
        totalStudents: number;
        language: string;
      };
      rating: { average: number; count: number };
      author: {
        node: {
          id: string;
          name: string;
          avatar: { url: string } | null;
        };
      };
      categories: { nodes: Array<{ id: string; name: string; slug: string }> };
    }>;
  };
}

function mapGqlCourse(node: CoursesQueryResult["courses"]["nodes"][0]): Course {
  return {
    id: node.databaseId,
    title: node.title,
    slug: node.slug,
    excerpt: node.excerpt || "",
    description: "",
    thumbnail: node.featuredImage?.node.sourceUrl || "",
    price: node.courseData.price ?? 0,
    regularPrice: node.courseData.regularPrice ?? 0,
    salePrice: node.courseData.salePrice,
    isFree: node.courseData.isFree ?? false,
    level: (node.courseData.level as Course["level"]) ?? "beginner",
    status: "publish",
    language: node.courseData.language ?? "English",
    duration: node.courseData.duration ?? 0,
    totalLessons: node.courseData.totalLessons ?? 0,
    totalStudents: node.courseData.totalStudents ?? 0,
    totalSections: 0,
    rating: { average: node.rating?.average ?? 0, count: node.rating?.count ?? 0, breakdown: {} },
    instructor: {
      id: 0,
      name: node.author?.node?.name ?? "",
      avatar: node.author?.node?.avatar?.url ?? "",
      bio: "",
      totalStudents: 0,
      totalCourses: 0,
      rating: 0,
      slug: "",
    },
    categories: node.categories.nodes.map((c) => ({
      id: 0,
      name: c.name,
      slug: c.slug,
      count: 0,
    })),
    tags: [],
    curriculum: [],
    requirements: [],
    outcomes: [],
    targetAudience: [],
    includes: {
      videoHours: 0,
      articles: 0,
      downloadableResources: 0,
      fullLifetimeAccess: true,
      certificate: true,
      mobileAccess: true,
    },
    lastUpdated: "",
    createdAt: "",
    reviews: [],
  };
}

export function FeaturedCourses() {
  const { data, loading } = useQuery<CoursesQueryResult>(GET_FEATURED_COURSES);

  const courses = data?.courses.nodes.map(mapGqlCourse) ?? [];

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

        {loading ? (
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
