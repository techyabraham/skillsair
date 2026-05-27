"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const STATS = [
  { end: 1, suffix: "K+", label: "STUDENTS ENROLLED" },
  { end: 1.5, suffix: "K", label: "CLASSES COMPLETED" },
  { end: 100, suffix: "%", label: "SATISFACTION RATE" },
  { end: 14, suffix: "", label: "JOB-READY COURSES" },
];

function AnimatedNumber({ end, suffix }: { end: number; suffix: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const startTime = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(end * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, inView]);

  const display = end % 1 === 0 ? Math.round(value).toString() : value.toFixed(1);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function StatsCounter() {
  return (
    <section className="bg-neutral-50 py-14 md:py-18" aria-label="SkillsAir statistics">
      <div className="container-wide">
        <motion.div
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } }, hidden: {} }}
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              className="rounded-2xl bg-white p-6 text-center shadow-card transition-all duration-300 hover:shadow-card-hover"
            >
              <p className="text-3xl font-heading font-bold text-primary-800 md:text-5xl">
                <AnimatedNumber end={stat.end} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
