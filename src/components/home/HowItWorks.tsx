"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    title: "Choose a Course",
    body: "Don't waste time searching - our expert-curated tech courses put you on the fast track to success. Start now and secure your future!",
  },
  {
    title: "Enroll & Learn",
    body: "Enroll in minutes and gain instant access to industry-leading lessons. Every second counts - start learning today and stay ahead of the competition!",
  },
  {
    title: "Build & Apply",
    body: "Theory won't get you hired - real skills will. Work on hands-on projects that prove your expertise and make you job-ready from day one!",
  },
  {
    title: "Get Certified & Get Jobs",
    body: "Stand out with industry-recognized certificates that employers trust. Boost your career now - your dream job is just one certification away!",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-neutral-50 py-16 md:py-24" aria-labelledby="how-it-works-heading">
      <div className="absolute inset-0 opacity-60" aria-hidden="true">
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,#e2e8f0_1px,transparent_0)] [background-size:28px_28px]" />
      </div>
      <div className="container-wide relative">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Get Started</p>
          <h2 id="how-it-works-heading" className="section-title mt-2">How Skills Air Works</h2>
        </motion.div>

        <motion.div
          className="relative grid gap-6 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
        >
          <div className="absolute left-[12%] right-[12%] top-9 hidden border-t-2 border-dashed border-accent/30 lg:block" aria-hidden="true" />
          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              className="relative rounded-2xl border border-neutral-100 bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl font-heading font-bold text-white shadow-button-accent">
                {index + 1}
              </div>
              <h3 className="text-lg font-heading font-bold text-neutral-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-500">{step.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
