"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface CounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label: string;
}

const STATS: CounterProps[] = [
  { end: 1,   suffix: "K+", label: "Students Enrolled",   duration: 1800 },
  { end: 1.5, suffix: "K",  label: "Classes Completed",   duration: 2000 },
  { end: 100, suffix: "%",  label: "Satisfaction Rate",   duration: 1600 },
  { end: 14,  suffix: "",   label: "Job-Ready Courses",   duration: 1400 },
];

function Counter({ end, suffix = "", prefix = "", duration = 1800, label }: CounterProps) {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;

    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(end * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);

  const display =
    end % 1 === 0 ? Math.round(value).toString() : value.toFixed(1);

  return (
    <div ref={ref} className="text-center">
      <p className="text-[44px] font-heading font-black leading-none tracking-tight text-white md:text-[64px]">
        {prefix}
        {display}
        {suffix}
      </p>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
        {label}
      </p>
    </div>
  );
}

export function StatsCounter() {
  return (
    <section
      className="relative overflow-hidden py-14 md:py-20"
      style={{
        background:
          "linear-gradient(135deg, #0d1b4b 0%, #1e3a8a 60%, #1d4ed8 100%)",
      }}
      aria-label="SkillsAir statistics"
    >
      {/* Glow */}
      <div
        className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-wide relative">
        <motion.div
          className="grid grid-cols-2 gap-8 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="relative"
            >
              <Counter {...stat} />

              {/* Vertical divider — desktop only, not on last item */}
              {index < STATS.length - 1 && (
                <div
                  className="absolute right-0 top-1/2 hidden h-14 w-px -translate-y-1/2 bg-white/15 lg:block"
                  aria-hidden="true"
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
