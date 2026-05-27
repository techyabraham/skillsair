"use client";

import { motion } from "framer-motion";
import { Eye, Target } from "lucide-react";

interface VMCard {
  label: string;
  body: string;
  icon: React.ElementType;
  barFrom: string;
  barTo: string;
  iconBg: string;
  iconColor: string;
  labelColor: string;
}

const CARDS: VMCard[] = [
  {
    label: "Our Vision",
    body: "To have Africans take a giant stake in the supply of quality tech talents around the world",
    icon: Eye,
    barFrom: "#1e3a8a",
    barTo: "#2563eb",
    iconBg: "#eff6ff",
    iconColor: "#1e3a8a",
    labelColor: "#1e3a8a",
  },
  {
    label: "Our Mission",
    body: "We will make high quality tech skills affordable and accessible to all Africans",
    icon: Target,
    barFrom: "#f97316",
    barTo: "#ea580c",
    iconBg: "#fff7ed",
    iconColor: "#f97316",
    labelColor: "#ea580c",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

export function VisionMission() {
  return (
    <section
      className="bg-white py-16 md:py-24"
      aria-labelledby="vision-mission-heading"
    >
      <div className="container-wide">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-accent">
              Purpose
            </p>
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
          </div>
          <h2
            id="vision-mission-heading"
            className="text-[28px] font-heading font-bold text-neutral-900 md:text-[40px]"
          >
            Vision &amp; Mission
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="group overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
              >
                {/* Top accent bar */}
                <div
                  className="h-[4px] w-full"
                  style={{
                    background: `linear-gradient(90deg, ${card.barFrom}, ${card.barTo})`,
                  }}
                  aria-hidden="true"
                />

                <div className="p-8 md:p-10">
                  {/* Icon */}
                  <div
                    className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: card.iconBg }}
                    aria-hidden="true"
                  >
                    <Icon
                      className="h-7 w-7"
                      style={{ color: card.iconColor }}
                    />
                  </div>

                  {/* Label */}
                  <p
                    className="mb-3 text-xs font-bold uppercase tracking-[0.12em]"
                    style={{ color: card.labelColor }}
                  >
                    {card.label}
                  </p>

                  {/* Body */}
                  <p className="text-[22px] font-heading font-bold leading-[1.4] text-neutral-900">
                    {card.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
