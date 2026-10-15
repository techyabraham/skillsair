import { naira, site } from "@/content/site";

const STEPS = [
  { title: "Apply in 60 seconds.", body: "Pick a school, see your scholarship price instantly." },
  {
    title: "Learn at your pace.",
    body: `Start immediately. About ${site.programme.weeklyHours} hours a week, ${site.programme.durationMonths} months to finish, on the device your programme supports.`,
  },
  {
    title: "Earn your certificate.",
    body: `When you finish, claim a verifiable certificate employers can check (${naira(site.programme.certificatePrice)}). You also get free CV & LinkedIn and Freelancing courses.`,
  },
  {
    title: "Unlock internships.",
    body: "Certified graduates get access to internship openings from our partner firms, and sometimes direct job opportunities.",
  },
];

export function StepPathway() {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li key={step.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-800 font-heading font-bold text-white" aria-hidden="true">
            {index + 1}
          </span>
          <h3 className="mt-4 font-heading font-bold text-neutral-900">{step.title}</h3>
          <p className="mt-2 text-neutral-600">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
