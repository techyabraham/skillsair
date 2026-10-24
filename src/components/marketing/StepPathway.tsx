import { site } from "@/content/site";

const STEPS = [
  { title: "Apply in 60 seconds", body: "Pick a school and see your scholarship price instantly." },
  {
    title: "Learn at your pace",
    body: `Start immediately. About ${site.programme.weeklyHours} hours a week, designed to take about ${site.programme.durationMonths} months, on the device your programme supports.`,
  },
  {
    title: "Earn your certificate",
    body: 'Earn a verifiable certificate by passing the final exam (optional), plus free CV & LinkedIn and Freelancing courses.',
  },
  {
    title: "Unlock internships",
    body: "Certified graduates get access to internship openings from our partner firms, and sometimes direct job opportunities.",
  },
];

/** Design: four white cards with a navy numbered circle. */
export function StepPathway() {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li key={step.title} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-7">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-bold text-white" aria-hidden="true">
            {index + 1}
          </span>
          <h3 className="text-xl font-bold text-navy">{step.title}</h3>
          <p className="text-[15px] text-neutral-600">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
