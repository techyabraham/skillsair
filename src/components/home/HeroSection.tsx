"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";

const HERO_STATS = [
  { value: "50K+", label: "Active Learners" },
  { value: "500+", label: "Expert Courses" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "200+", label: "Instructors" },
];

const FLOATING_CARDS = [
  {
    id: 1,
    label: "Lessons Completed",
    value: "1,247",
    icon: "🎯",
    position: "top-[15%] left-[5%]",
    delay: 0,
  },
  {
    id: 2,
    label: "New Certificate",
    value: "Web Development",
    icon: "🏆",
    position: "bottom-[20%] left-[3%]",
    delay: 0.3,
  },
  {
    id: 3,
    label: "Course Progress",
    value: "78% complete",
    icon: "📈",
    position: "top-[10%] right-[3%]",
    delay: 0.2,
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-hero-gradient">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-primary-600/30 rounded-full blur-2xl" aria-hidden="true" />

      <div className="container-wide relative z-10 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-accent text-xs">✦</span>
              <span className="text-white/90 text-sm font-medium">
                Nigeria&apos;s #1 Professional Learning Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-white leading-[1.05] text-balance mb-6">
              Master In-Demand{" "}
              <span className="relative">
                <span className="text-accent">Skills</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M1 5.5C50 1 100 1 199 5.5"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              That Open Doors
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
              Join over 50,000 professionals learning from industry experts. Get certified, build portfolio-ready projects, and land your dream career.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/courses">
                <Button variant="accent" size="xl" className="w-full sm:w-auto">
                  Explore Courses
                  <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="ghost"
                  size="xl"
                  className="w-full sm:w-auto text-white hover:bg-white/10 border border-white/20"
                >
                  Start for Free
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-navy bg-gradient-to-br from-primary-300 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0"
                    aria-hidden="true"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <StarRating rating={4.9} size="sm" />
                <p className="text-white/60 text-xs mt-0.5">
                  Trusted by <span className="text-white font-medium">50,000+</span> learners
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* Main image */}
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-700 to-primary-900 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xl font-semibold">Expert-Led Courses</p>
                    <p className="text-white/60 text-sm mt-2">Learn at your own pace</p>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              {FLOATING_CARDS.map((card) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + card.delay, duration: 0.6 }}
                  className={`absolute ${card.position} bg-white rounded-2xl shadow-modal p-3 min-w-[140px]`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{card.icon}</span>
                    <div>
                      <p className="text-xs text-neutral-400">{card.label}</p>
                      <p className="text-sm font-bold text-neutral-900">{card.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 border-t border-white/10 pt-10"
        >
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-heading font-bold text-white">{stat.value}</p>
              <p className="text-white/50 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16" aria-hidden="true">
          <path d="M0 80L1440 80L1440 20C1200 70 960 0 720 40C480 80 240 10 0 50L0 80Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
