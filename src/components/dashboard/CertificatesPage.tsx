"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCertificates, useEnrolledCourses } from "@/hooks/useStudent";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatDate, buildLinkedInCertUrl } from "@/lib/utils";
import type { Certificate, EnrolledCourse } from "@/types/course";

export function CertificatesPage() {
  const { user } = useAuth();
  const { certificates, isLoading: certsLoading } = useCertificates(user?.id ?? null);
  const { enrolledCourses, isLoading: coursesLoading } = useEnrolledCourses(user?.id ?? null);

  const isLoading = certsLoading || coursesLoading;

  // Completed courses (100% progress)
  const completedCourses = enrolledCourses.filter((c) => c.progress === 100);

  // Slugs of courses that already have a purchased certificate
  const certifiedSlugs = new Set(certificates.map((c) => c.courseSlug));

  // Courses completed but certificate not yet purchased
  const readyForCert = completedCourses.filter((c) => !certifiedSlugs.has(c.slug));

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12">

      {/* ── SECTION 1: Ready to certify ─────────────────────────────────── */}
      {(isLoading || readyForCert.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-neutral-900">Ready to Certify</h2>
              <p className="text-sm text-neutral-500">
                You&apos;ve completed these courses — get your certificate and prove your skills.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} rounded className="h-28 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyForCert.map((course, i) => (
                <ReadyForCertCard key={course.id} course={course} index={i} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── SECTION 2: Earned certificates ──────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-primary-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-neutral-900">My Certificates</h2>
              <p className="text-sm text-neutral-500">
                {certificates.length} certificate{certificates.length !== 1 ? "s" : ""} earned
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-3">
                <Skeleton rounded className="h-36 w-full" />
                <Skeleton rounded className="h-5 w-3/4" />
                <Skeleton rounded className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton rounded className="h-9 flex-1" />
                  <Skeleton rounded className="h-9 flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-base font-semibold text-neutral-700 mb-2">No certificates yet</h3>
            <p className="text-sm text-neutral-400 mb-6 max-w-xs mx-auto">
              Complete a course and purchase your certificate to show it here.
            </p>
            <Link href="/courses">
              <Button variant="accent" size="md">Explore Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, i) => (
              <CertificateCard key={cert.id} cert={cert} index={i} userName={user?.displayName || ""} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

/* ── Ready-for-cert mini card ──────────────────────────────────────────────── */

function ReadyForCertCard({ course, index }: { course: EnrolledCourse; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-white rounded-2xl border border-neutral-100 overflow-hidden flex gap-4 p-4 hover:shadow-card-hover transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-neutral-100">
        <Image
          src={course.thumbnail || "/images/course-placeholder.jpg"}
          alt={course.title}
          fill
          className="object-cover"
          sizes="80px"
        />
        <div className="absolute inset-0 bg-success/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <p className="text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">
          {course.title}
        </p>
        <Link
          href={`/checkout?type=certificate&course=${course.slug}&courseName=${encodeURIComponent(course.title)}`}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-accent hover:bg-accent/90 px-3 py-1.5 rounded-lg transition-colors w-fit"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Get Certificate
        </Link>
      </div>
    </motion.div>
  );
}

/* ── Earned certificate card ───────────────────────────────────────────────── */

function CertificateCard({
  cert,
  index,
  userName,
}: {
  cert: Certificate;
  index: number;
  userName: string;
}) {
  const linkedInUrl = buildLinkedInCertUrl({
    name: cert.courseName,
    orgName: "SkillsAir",
    issueDate: cert.issuedAt,
    certId: cert.verificationCode,
    certUrl: cert.certificateUrl,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      {/* Certificate Preview */}
      <div className="bg-hero-gradient p-8 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Certificate of Completion</p>
          <p className="text-white font-semibold text-sm leading-tight">{userName}</p>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-1.5 line-clamp-2">{cert.courseName}</h3>
        <div className="flex items-center gap-4 text-xs text-neutral-400 mb-4">
          <span>Issued {formatDate(cert.issuedAt)}</span>
          <span>ID: {cert.verificationCode.slice(0, 8)}…</span>
        </div>

        <div className="flex gap-2 mb-2">
          <a
            href={cert.certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-outline text-center text-xs py-2 px-3"
          >
            View
          </a>
          <a
            href={cert.certificateUrl}
            download
            className="flex-1 btn-primary text-center text-xs py-2 px-3"
          >
            Download
          </a>
        </div>

        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-[#0077B5] text-[#0077B5] text-xs font-medium hover:bg-[#0077B5] hover:text-white transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
          Add to LinkedIn
        </a>
      </div>
    </motion.div>
  );
}
