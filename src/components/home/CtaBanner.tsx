"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function CtaBanner() {
  return (
    <section className="py-16 md:py-24 bg-white" aria-labelledby="cta-heading">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-hero-gradient rounded-3xl overflow-hidden px-8 py-14 md:px-16 md:py-20 text-center"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
              aria-hidden="true"
            />
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-accent">🎯</span>
              <span className="text-white/90 text-sm">Limited time: First course 50% off</span>
            </div>

            <h2 id="cta-heading" className="text-3xl md:text-5xl font-heading font-bold text-white mb-4 text-balance">
              Ready to Level Up Your Career?
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
              Join 50,000+ professionals who&apos;ve transformed their careers with SkillsAir. Start learning today and get your first certificate in weeks.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="accent" size="xl">
                  Start Learning for Free
                </Button>
              </Link>
              <Link href="/courses">
                <Button
                  variant="ghost"
                  size="xl"
                  className="text-white hover:bg-white/10 border border-white/30"
                >
                  Explore Courses
                </Button>
              </Link>
            </div>

            <p className="text-white/40 text-xs mt-6">
              No credit card required · Cancel anytime · Free certificate preview
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
