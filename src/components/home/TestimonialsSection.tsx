"use client";

import React from "react";
import { motion } from "framer-motion";
import { StarRating } from "@/components/ui/StarRating";
import { Avatar } from "@/components/ui/Avatar";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Adaeze Okonkwo",
    role: "Frontend Developer at Flutterwave",
    content:
      "SkillsAir transformed my career completely. The Web Development course gave me real-world skills that I use daily at work. Within 3 months of completing the course, I landed my dream job.",
    rating: 5,
    course: "Full Stack Web Development",
  },
  {
    id: 2,
    name: "Emeka Nwosu",
    role: "Data Analyst at MTN Nigeria",
    content:
      "The Data Science curriculum is incredibly comprehensive. The instructors don't just teach theory — they walk you through real industry projects. Best investment I've made in my career.",
    rating: 5,
    course: "Data Science & Machine Learning",
  },
  {
    id: 3,
    name: "Fatimah Aliyu",
    role: "UX Designer at Interswitch",
    content:
      "I was skeptical about online learning, but SkillsAir completely changed my mind. The UI/UX course had amazing projects, and the instructor feedback was incredibly detailed and helpful.",
    rating: 5,
    course: "UI/UX Design Fundamentals",
  },
  {
    id: 4,
    name: "Chukwudi Eze",
    role: "Product Manager at Paystack",
    content:
      "The product management course gave me the frameworks and tools I needed to lead my team. I got a promotion within 4 months of completing it. The ROI is unbelievable.",
    rating: 5,
    course: "Product Management Masterclass",
  },
  {
    id: 5,
    name: "Amina Ibrahim",
    role: "Cybersecurity Analyst at Zenith Bank",
    content:
      "SkillsAir's Cybersecurity course is among the best I've seen online. The hands-on labs and real attack scenarios helped me ace my certification exam on the first try.",
    rating: 5,
    course: "Cybersecurity Professional",
  },
  {
    id: 6,
    name: "Oluwaseun Adeleke",
    role: "Digital Marketer at Access Bank",
    content:
      "The digital marketing course gave me practical skills I could apply immediately. I doubled our social media engagement in the first month after taking the course. Amazing!",
    rating: 5,
    course: "Digital Marketing Strategy",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-neutral-50 overflow-hidden" aria-labelledby="testimonials-heading">
      <div className="container-wide">
        <div className="text-center mb-12">
          <p className="text-accent font-semibold text-sm mb-2 uppercase tracking-wide">Student Stories</p>
          <h2 id="testimonials-heading" className="section-title">
            Real Results, Real People
          </h2>
          <p className="section-subtitle mx-auto">
            See how SkillsAir has helped thousands of professionals transform their careers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <StarRating rating={testimonial.rating} size="sm" />
              <blockquote className="mt-4 text-sm text-neutral-600 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </blockquote>
              <div className="mt-5 pt-5 border-t border-neutral-100 flex items-center gap-3">
                <Avatar name={testimonial.name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{testimonial.name}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{testimonial.role}</p>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-medium text-primary-800 bg-primary-50 px-2.5 py-1 rounded-full">
                  {testimonial.course}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
