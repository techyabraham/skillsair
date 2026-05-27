"use client";

import { motion } from "framer-motion";
import { Eye, Target } from "lucide-react";

const CARDS = [
  {
    label: "Our Vision",
    body: "To have Africans take a giant stake in the supply of quality tech talents around the world",
    icon: Eye,
    className: "from-primary-800 to-primary-600",
  },
  {
    label: "Our Mission",
    body: "We will make high quality tech skills affordable and accessible to all Africans",
    icon: Target,
    className: "from-accent to-accent-700",
  },
];

export function VisionMission() {
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="vision-mission-heading">
      <div className="container-wide">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Purpose</p>
          <h2 id="vision-mission-heading" className="section-title mt-2">Vision and Mission</h2>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
        >
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
                className={`rounded-[2rem] bg-gradient-to-br ${card.className} p-[1px] shadow-card-hover`}
              >
                <div className="h-full rounded-[calc(2rem-1px)] bg-white/95 p-7 md:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-2xl font-heading font-bold text-neutral-900">{card.label}</h3>
                  <p className="mt-4 text-base leading-relaxed text-neutral-600">{card.body}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
