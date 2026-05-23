"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCertificates } from "@/hooks/useStudent";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatDate, buildLinkedInCertUrl } from "@/lib/utils";
import type { Certificate } from "@/types/course";

export function CertificatesPage() {
  const { user } = useAuth();
  const { certificates, isLoading } = useCertificates(user?.id ?? null);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-neutral-900">My Certificates</h1>
        <p className="text-neutral-500 text-sm mt-1">
          {certificates.length} certificate{certificates.length !== 1 ? "s" : ""} earned
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-3">
              <Skeleton rounded className="h-40 w-full" />
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
        <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">No certificates yet</h2>
          <p className="text-sm text-neutral-400 mb-6">Complete a course to earn your first certificate</p>
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
    </div>
  );
}

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
          <span>ID: {cert.verificationCode.slice(0, 8)}...</span>
        </div>

        <div className="flex gap-2">
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
          className="mt-2 flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-[#0077B5] text-[#0077B5] text-xs font-medium hover:bg-[#0077B5] hover:text-white transition-all"
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
