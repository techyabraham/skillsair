"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  TrendingUp,
  BadgeDollarSign,
  Clock,
  ShieldCheck,
  Briefcase,
} from "lucide-react";

interface AccordionItem {
  title: string;
  body: string;
}

interface VisualPanel {
  icon: React.ElementType;
  stat: string;
  label: string;
  supporting: string;
  // Unsplash photo ID + alt text
  imageId: string;
  imageAlt: string;
  // Overlay gradient direction / colour stop
  overlayFrom: string;
}

const ITEMS: AccordionItem[] = [
  {
    title: "High-Demand Courses, Industry-Relevant",
    body: "The future won't wait. Gain skills that top companies are hiring for NOW — stay ahead, get certified, and secure your dream tech job before others do!",
  },
  {
    title: "Affordable Pricing, Maximum Value",
    body: "Don't let high fees stop your success. Get expert-led training at unbeatable prices — premium education at a fraction of the cost. Enroll today!",
  },
  {
    title: "Flexible Learning – Study at Your Pace",
    body: "Your life is busy — your learning should be flexible. Study anytime, anywhere, and fast-track your tech career on your own schedule. No excuses!",
  },
  {
    title: "Verifiable Certification – Showcase Your Skills with Proof",
    body: "Your achievements, permanently verified! Get a unique certificate link that employers can check anytime. Add it to LinkedIn and stand out instantly!",
  },
  {
    title: "Exclusive Job Opportunities – Get Hired Faster",
    body: "Learning is just the beginning! Access exclusive job listings, internships, and remote opportunities tailored to your skills. Train, apply, and get hired!",
  },
];

const PANELS: VisualPanel[] = [
  {
    icon: TrendingUp,
    stat: "500+",
    label: "In-Demand Skills",
    supporting: "Courses aligned with what employers are actively hiring for right now",
    // Black woman in tech — WOCinTech Chat collection, Unsplash
    imageId: "1573496359142-b8d87734a5a2",
    imageAlt: "Black woman working on a laptop in a tech environment",
    overlayFrom: "rgba(13,27,75,0.50)",
  },
  {
    icon: BadgeDollarSign,
    stat: "80% Less",
    label: "Than Traditional Training",
    supporting: "Premium education at a fraction of the cost of bootcamps",
    // Black man at desk working / studying — professional setting
    imageId: "1580894894513-541e068a3e2b",
    imageAlt: "Black man studying and working at his desk",
    overlayFrom: "rgba(30,58,138,0.52)",
  },
  {
    icon: Clock,
    stat: "24/7",
    label: "Learn On Your Schedule",
    supporting: "Study at your own pace from any device, anywhere in the world",
    // Black woman with phone / casual learning anywhere
    imageId: "1509062522246-3755977927d7",
    imageAlt: "Black woman learning flexibly on her phone and laptop",
    overlayFrom: "rgba(13,27,75,0.55)",
  },
  {
    icon: ShieldCheck,
    stat: "100%",
    label: "Verifiable Certificates",
    supporting: "Unique certificate links employers can verify instantly",
    // Black graduate in cap and gown — achievement
    imageId: "1627556704290-2b1f5853ff78",
    imageAlt: "Black graduate in cap and gown celebrating achievement",
    overlayFrom: "rgba(30,58,138,0.52)",
  },
  {
    icon: Briefcase,
    stat: "1,000+",
    label: "Job Opportunities",
    supporting: "Exclusive listings, internships, and remote roles for our graduates",
    // Black professional woman — confident career setting
    imageId: "1573497019236-17f8177b81e8",
    imageAlt: "Black professional woman confident in her career",
    overlayFrom: "rgba(13,27,75,0.52)",
  },
];

/**
 * Returns a full Unsplash CDN URL for the given photo ID.
 * To swap a photo: replace the imageId string in PANELS above.
 * Preview any photo at: https://unsplash.com/photos/{imageId}
 */
function unsplashUrl(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
}

export function WhatYouWillGet() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleToggle = (index: number) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  return (
    <section
      className="bg-section-gradient py-16 md:py-24"
      aria-labelledby="what-you-get-heading"
    >
      <div className="container-wide">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">

          {/* ── LEFT — label, heading, body, accordion ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            {/* Label */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
                What You Will Get
              </p>
            </div>

            <h2
              id="what-you-get-heading"
              className="text-[28px] font-heading font-bold leading-tight text-neutral-900 md:text-[38px]"
            >
              Start Learning
            </h2>

            <p className="mt-4 max-w-[520px] text-base leading-[1.78] text-neutral-500 md:text-[17px]">
              Start building the tech career you want. Our courses teach the
              skills companies are actually looking for, without breaking the
              bank. Whether you&apos;re just starting out or switching careers,
              we&apos;ll help you take the next step forward.
            </p>

            {/* Accordion */}
            <div className="mt-8" role="list" aria-label="What you will get">
              {ITEMS.map((item, index) => {
                const isOpen = activeIndex === index;
                return (
                  <div
                    key={item.title}
                    role="listitem"
                    className={cn(
                      "relative border-b border-neutral-200 transition-colors duration-200",
                      isOpen && "bg-accent/[0.028]"
                    )}
                  >
                    {/* Animated left accent bar */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          exit={{ scaleY: 0 }}
                          transition={{ duration: 0.22 }}
                          className="absolute inset-y-0 left-0 w-[3px] origin-top rounded-r-full bg-accent"
                          aria-hidden="true"
                        />
                      )}
                    </AnimatePresence>

                    <div className={cn("transition-all duration-200", isOpen && "pl-4")}>
                      <button
                        onClick={() => handleToggle(index)}
                        className="flex w-full items-center justify-between gap-4 py-[18px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
                        aria-expanded={isOpen}
                        aria-controls={`accordion-content-${index}`}
                      >
                        <span
                          className={cn(
                            "text-[13.5px] font-semibold leading-snug transition-colors duration-200 md:text-sm",
                            isOpen
                              ? "text-accent"
                              : "text-neutral-700 hover:text-neutral-900"
                          )}
                        >
                          {item.title}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-300",
                            isOpen ? "rotate-180 text-accent" : "text-neutral-400"
                          )}
                          aria-hidden="true"
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={`accordion-content-${index}`}
                            role="region"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="pb-5 pr-8 text-sm leading-[1.75] text-neutral-500">
                              {item.body}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-9">
              <Link href="/register" className="btn-accent">
                Get Started Free
              </Link>
            </div>
          </motion.div>

          {/* ── RIGHT — full-height image panels (desktop only) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              {/* Fixed tall container — panels are stacked absolutely */}
              <div className="relative overflow-hidden rounded-[2rem] shadow-modal" style={{ height: "580px" }}>

                {/* Image panels */}
                {PANELS.map((panel, index) => {
                  const Icon = panel.icon;
                  const isActive = activeIndex === index;
                  return (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={{
                        opacity: isActive ? 1 : 0,
                        scale: isActive ? 1 : 1.03,
                      }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className={cn(
                        "absolute inset-0",
                        !isActive && "pointer-events-none"
                      )}
                      aria-hidden={!isActive}
                    >
                      {/* Background image */}
                      <Image
                        src={unsplashUrl(panel.imageId)}
                        alt={panel.imageAlt}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="460px"
                      />

                      {/* Multi-layer overlay */}
                      {/* Top: dark fade so text at bottom is clear */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(
                            to bottom,
                            ${panel.overlayFrom} 0%,
                            rgba(0,0,0,0.10) 40%,
                            rgba(0,0,0,0.55) 70%,
                            rgba(0,0,0,0.82) 100%
                          )`,
                        }}
                        aria-hidden="true"
                      />

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col justify-between p-8 text-white">
                        {/* Top: icon badge */}
                        <div className="flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                            <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
                          </div>
                          {/* Progress dots */}
                          <div className="flex items-center gap-1.5 pt-1.5">
                            {PANELS.map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-[3px] rounded-full transition-all duration-500",
                                  i === index ? "w-6 bg-accent" : "w-2 bg-white/30"
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Bottom: stat + text */}
                        <div>
                          {/* Category tag */}
                          <span className="mb-3 inline-block rounded-full bg-accent/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                            {panel.label}
                          </span>
                          <p className="text-[52px] font-heading font-extrabold leading-none tracking-tight drop-shadow-lg">
                            {panel.stat}
                          </p>
                          <p className="mt-3 max-w-[300px] text-sm leading-relaxed text-white/75 drop-shadow">
                            {panel.supporting}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Empty state (all closed) */}
                {activeIndex === -1 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                    <p className="text-sm text-neutral-400">
                      Select a topic to explore
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
