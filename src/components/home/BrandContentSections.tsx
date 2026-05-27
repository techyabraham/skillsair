import Link from "next/link";
import {
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  Handshake,
  Layers3,
  Lightbulb,
  Network,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const WHY_ITEMS = [
  {
    title: "Job Ready Courses",
    description:
      "Our courses were carefully created to make you highly competitive in the job market. Courses that help you sell yourself effectively are free.",
    icon: BookOpenCheck,
  },
  {
    title: "Economical",
    description:
      "We created Skills Air to ensure that low funds do not prevent you from becoming a top tech talent. Because let's face it, most Africans need this support.",
    icon: CircleDollarSign,
  },
  {
    title: "Shareable Certificates",
    description:
      "Your certificate is verifiable and instantly shareable on LinkedIn and every professional platform.",
    icon: BadgeCheck,
  },
  {
    title: "Community + Support",
    description:
      "We have a very strong community that was created to support you during and after you are done with studying your course.",
    icon: Users,
  },
];

const VALUE_POINTS = [
  "Affordable Pricing, Maximum Value",
  "Flexible Learning - Study at Your Pace",
  "Verifiable Certification - Showcase Your Skills with Proof",
  "Exclusive Job Opportunities - Get Hired Faster",
];

const HOW_IT_WORKS = [
  {
    title: "Choose a Course",
    description:
      "Do not waste time searching. Our expert-curated tech courses put you on the fast track to success.",
    icon: Layers3,
  },
  {
    title: "Enroll & Learn",
    description:
      "Enroll in minutes and gain instant access to industry-leading lessons. Start learning today and stay ahead of the competition.",
    icon: GraduationCap,
  },
  {
    title: "Build & Apply",
    description:
      "Theory will not get you hired. Work on hands-on projects that prove your expertise and make you job-ready from day one.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Get Certified & Get Jobs",
    description:
      "Stand out with industry-recognized certificates that employers trust. Your next role can start with one certification.",
    icon: Trophy,
  },
];

export function CareerQuizSection() {
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="career-quiz-heading">
      <div className="container-wide">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              Free AI-Powered Career Test
            </p>
            <h2 id="career-quiz-heading" className="mt-3 max-w-2xl text-3xl font-heading font-bold leading-tight text-neutral-900 md:text-5xl">
              Not Sure Where to Start Your Tech Career?
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg">
              This AI-powered personality test analyzes your strengths, interests, and natural abilities to recommend the tech career path that fits you best, so you can start with clarity, confidence, and direction.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/courses">
                <Button variant="accent" size="lg" className="w-full sm:w-auto">
                  Take Tech Career Quiz Now
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-hero-gradient p-6 text-white shadow-card md:p-8">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[3rem] bg-accent/25" aria-hidden="true" />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-accent">
                <Sparkles className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="mt-10 text-sm font-medium text-white/60">Popular recommendation path</p>
              <h3 className="mt-2 text-2xl font-heading font-bold">Sales Funnels and Conversion Optimization</h3>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {["Strengths", "Interests", "Career fit", "Next step"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-sm font-semibold">{item}</p>
                    <p className="mt-1 text-xs text-white/55">Mapped by your quiz answers</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhySkillsAirSection() {
  return (
    <section className="bg-section-gradient py-16 md:py-24" aria-labelledby="why-skillsair-heading">
      <div className="container-wide">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Why Skills Air?</p>
          <h2 id="why-skillsair-heading" className="section-title mt-2">Learning Curated For Your Success</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {WHY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-800">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-heading font-bold text-neutral-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function WhatYouGetSection() {
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="what-you-get-heading">
      <div className="container-wide">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">What You Will Get</p>
            <h2 id="what-you-get-heading" className="mt-3 text-3xl font-heading font-bold text-neutral-900 md:text-5xl">
              Start building the tech career you want.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-neutral-600">
              Our courses teach the skills companies are actually looking for, without breaking the bank. Whether you are just starting out or switching careers, we will help you take the next step forward.
            </p>
            <div className="mt-8">
              <Link href="/courses">
                <Button variant="primary" size="lg">Start Learning</Button>
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-neutral-100 bg-neutral-50 p-5 md:p-7">
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">
                  <Lightbulb className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-neutral-900">High-Demand Courses, Industry-Relevant</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    The future will not wait. Gain skills that top companies are hiring for now, stay ahead, get certified, and secure your dream tech job before others do.
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {VALUE_POINTS.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-dark" aria-hidden="true" />
                    <span className="text-sm font-medium text-neutral-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowSkillsAirWorksSection() {
  return (
    <section className="bg-neutral-50 py-16 md:py-24" aria-labelledby="how-skillsair-works-heading">
      <div className="container-wide">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Get Started</p>
          <h2 id="how-skillsair-works-heading" className="section-title">How Skills Air Works</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative rounded-2xl bg-white p-6 shadow-card">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-800">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="text-4xl font-heading font-bold text-neutral-100">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="text-lg font-heading font-bold text-neutral-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function InvestInYourselfSection() {
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="invest-heading">
      <div className="container-wide">
        <div className="overflow-hidden rounded-[2rem] bg-hero-gradient p-8 text-white shadow-modal md:p-12 lg:p-16">
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/10 text-accent">
              <Network className="h-14 w-14" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">No More Excuses</p>
              <h2 id="invest-heading" className="mt-3 text-3xl font-heading font-bold md:text-5xl">Invest in Yourself Today!</h2>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/70">
                Your future is worth more than hesitation. For less than the cost of a night out, you can gain skills that will change your life forever. Enroll now. Your success story starts here.
              </p>
              <div className="mt-8">
                <Link href="/courses">
                  <Button variant="accent" size="lg">Start Learning Now</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutIntroSection() {
  return (
    <section className="bg-white pb-16 pt-28 md:pb-24 md:pt-36" aria-labelledby="about-heading">
      <div className="container-wide">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">About Skills Air</p>
            <h1 id="about-heading" className="mt-3 max-w-3xl text-4xl font-heading font-bold leading-tight text-neutral-900 md:text-6xl">
              We Provide Job Ready Courses At Pocket Friendly Rates
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-600">
              As demands for quality tech talents rise, more vacuums are created because quality tech skills are expensive to acquire. This is where we come in.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-500">
              We provide high quality courses at a cost that is affordable to the average African.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["High Quality Courses", "Flexible Learning", "Community + Support"].map((item) => (
                <div key={item} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-sm font-semibold text-neutral-800">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] bg-hero-gradient p-6 text-white shadow-card md:p-8">
            <div className="rounded-2xl bg-white/10 p-6">
              <Handshake className="h-10 w-10 text-accent" aria-hidden="true" />
              <h2 className="mt-6 text-2xl font-heading font-bold">Our Vision</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                To have Africans take a giant stake in the supply of quality tech talents around the world.
              </p>
            </div>
            <div className="mt-4 rounded-2xl bg-white p-6 text-neutral-900">
              <Clock3 className="h-10 w-10 text-primary-800" aria-hidden="true" />
              <h2 className="mt-6 text-2xl font-heading font-bold">Our Mission</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                We will make high quality tech skills affordable and accessible to all Africans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutStatsSection() {
  const stats = [
    { value: "1K", label: "Students Enrolled" },
    { value: "1.5K", label: "Classes Completed" },
    { value: "100%", label: "Satisfaction Rate" },
    { value: "14", label: "Job-Ready Courses" },
  ];

  return (
    <section className="bg-neutral-50 py-14" aria-label="Skills Air statistics">
      <div className="container-wide">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white p-6 text-center shadow-card">
              <p className="text-3xl font-heading font-bold text-primary-800 md:text-4xl">{stat.value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
