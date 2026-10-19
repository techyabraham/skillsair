"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SchoolSummary } from "@/lib/catalog";
import { ProgressSteps } from "@/components/marketing/ProgressSteps";
import { LeadDetailsForm, type LeadDetails } from "@/components/apply/LeadDetailsForm";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { SchoolIcon, shortSchoolName } from "@/components/marketing/SchoolIcon";

const STORAGE_KEY = "sa_apply";

type CurrentStatus = "student" | "graduate_nysc" | "working_switch" | "not_working";
type Device = "laptop" | "phone_only" | "both";
type WeeklyHours = "under_5" | "5_8" | "8_plus";

interface ApplyState {
  step: 1 | 2 | 3;
  school: string;
  programme: string;
  details: Partial<LeadDetails>;
  currentStatus?: CurrentStatus;
  device?: Device;
  weeklyHours?: WeeklyHours;
  leadSaved?: boolean;
}

const QUESTIONS: Array<{
  key: "currentStatus" | "device" | "weeklyHours";
  label: string;
  options: Array<{ value: string; label: string }>;
}> = [
  {
    key: "currentStatus",
    label: "Right now I am:",
    options: [
      { value: "student", label: "Student" },
      { value: "graduate_nysc", label: "Graduate or NYSC" },
      { value: "working_switch", label: "Working, want to switch" },
      { value: "not_working", label: "Not working" },
    ],
  },
  {
    key: "device",
    label: "I'll learn on:",
    options: [
      { value: "laptop", label: "Laptop" },
      { value: "phone_only", label: "Phone only for now" },
      { value: "both", label: "Both" },
    ],
  },
  {
    key: "weeklyHours",
    label: "Time I can give weekly:",
    options: [
      { value: "under_5", label: "Under 5 hrs" },
      { value: "5_8", label: "5–8 hrs" },
      { value: "8_plus", label: "8+ hrs" },
    ],
  },
];

function loadState(): Partial<ApplyState> {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<ApplyState>) : {};
  } catch {
    return {};
  }
}

function saveState(state: ApplyState): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage disabled: the flow still works, it just won't survive a reload.
  }
}

interface ApplyFlowProps {
  schools: SchoolSummary[];
  initialSchool: string;
  initialProgramme: string;
}

export function ApplyFlow({ schools, initialSchool, initialProgramme }: ApplyFlowProps) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [state, setState] = useState<ApplyState>({ step: 1, school: "", programme: "", details: {} });
  const [ready, setReady] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const [error, setError] = useState("");

  const programmeSchool = useMemo(() => {
    for (const school of schools) {
      if (school.programmes.some((programme) => programme.slug === initialProgramme)) return school.slug;
    }
    return "";
  }, [schools, initialProgramme]);

  // Restore saved answers; a ?programme= deep link skips straight to step 2.
  useEffect(() => {
    const saved = loadState();
    const school = programmeSchool || (schools.some((item) => item.slug === initialSchool) ? initialSchool : saved.school ?? "");
    const programme = programmeSchool ? initialProgramme : saved.programme ?? "";
    const step: ApplyState["step"] = programmeSchool ? Math.max(2, saved.step ?? 2) as ApplyState["step"] : saved.step ?? 1;
    const validProgramme = schools.find((item) => item.slug === school)?.programmes.some((item) => item.slug === programme);
    setState({
      step: validProgramme ? step : 1,
      school,
      programme: validProgramme ? programme : "",
      details: saved.details ?? {},
      currentStatus: saved.currentStatus,
      device: saved.device,
      weeklyHours: saved.weeklyHours,
      leadSaved: saved.leadSaved,
    });
    setReady(true);
    track("apply_start", { school, programme });
  }, [schools, initialSchool, initialProgramme, programmeSchool]);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  useEffect(() => {
    if (ready) headingRef.current?.focus();
  }, [state.step, ready]);

  const selectedSchool = schools.find((school) => school.slug === state.school);
  const selectedProgramme = selectedSchool?.programmes.find((programme) => programme.slug === state.programme);
  // Schools whose programmes aren't published yet take a waitlist sign-up instead of an offer.
  const schoolComingSoon = Boolean(selectedSchool && selectedSchool.programmes.length === 0);

  const openSchools = useMemo(() => schools.filter((school) => school.programmes.length > 0), [schools]);
  const soonSchools = useMemo(() => schools.filter((school) => school.programmes.length === 0), [schools]);
  const programmeRef = useRef<HTMLFieldSetElement>(null);
  const pickedSchool = useRef(false);

  useEffect(() => {
    // After a tap (not on restore), bring the programme question into view.
    if (!pickedSchool.current) return;
    pickedSchool.current = false;
    if ((selectedSchool?.programmes.length ?? 0) > 1) programmeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.school, selectedSchool]);

  const chooseSchool = (slug: string) => {
    pickedSchool.current = true;
    const school = schools.find((item) => item.slug === slug);
    const onlyProgramme = school?.programmes.length === 1 ? school.programmes[0]?.slug ?? "" : "";
    setState((current) => ({ ...current, school: slug, programme: onlyProgramme }));
  };

  const goToStep = (step: ApplyState["step"]) => {
    if (step > state.step) track("apply_step_complete", { step: state.step });
    setState((current) => ({ ...current, step }));
  };

  const finish = async (answers: ApplyState) => {
    setFinishing(true);
    setError("");
    try {
      const response = await fetch("/api/leads/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStatus: answers.currentStatus,
          device: answers.device,
          weeklyHours: answers.weeklyHours,
          programme: answers.programme,
        }),
      });
      if (!response.ok && response.status !== 401) throw new Error("save failed");
      if (response.status === 401) {
        // The lead session is missing (e.g. cookies cleared): capture details again.
        setState((current) => ({ ...current, step: 2, leadSaved: false }));
        setFinishing(false);
        return;
      }
      track("apply_step_complete", { step: 3 });
      track("qualifier_complete", { device: answers.device ?? "", weeklyHours: answers.weeklyHours ?? "" });
      router.push(`/apply/offer?programme=${encodeURIComponent(answers.programme)}`);
    } catch {
      setError("Something went wrong on our side. Your details are safe. Tap an answer again to retry.");
      setFinishing(false);
    }
  };

  const answer = (key: "currentStatus" | "device" | "weeklyHours", value: string) => {
    const next = { ...state, [key]: value } as ApplyState;
    setState(next);
    if (next.currentStatus && next.device && next.weeklyHours) void finish(next);
  };

  if (!ready) {
    return <div className="mx-auto max-w-xl px-4 py-16" aria-busy="true"><div className="h-64 animate-pulse rounded-2xl bg-neutral-200" /></div>;
  }

  if (waitlisted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 md:py-16" aria-live="polite">
        <h1 className="text-2xl font-bold text-navy md:text-3xl">You&apos;re on the list 🎉</h1>
        <p className="mt-3 text-lg text-neutral-700">
          We&apos;ll message you on WhatsApp as soon as programmes in the {selectedSchool?.name ?? "school"} open.
        </p>
        <Link href="/schools" className="mt-6 inline-flex min-h-12 items-center rounded-xl border-2 border-navy px-6 font-semibold text-navy hover:bg-neutral-50">
          Explore other schools
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto px-4 py-8 md:py-12", state.step === 1 ? "max-w-3xl" : "max-w-xl")}>
      <ProgressSteps step={state.step} total={schoolComingSoon ? 2 : 3} />

      {state.step === 1 && (
        <section aria-labelledby="apply-step-1">
          <h1 id="apply-step-1" ref={headingRef} tabIndex={-1} className="text-2xl font-heading font-bold text-neutral-900 focus:outline-none md:text-3xl">
            Which school do you want to join?
          </h1>
          <p className="mt-2 text-neutral-600">Pick one. You can change it later.</p>
          {/*
            School picker. Open schools are compact tiles (2 across on phones, 3 on desktop) with
            an icon and the short name; schools not open yet sit below as smaller "opening soon"
            pills. Choosing a school with several programmes scrolls the programme question into
            view, and on phones Continue stays pinned to the bottom of the screen.
          */}
          <div role="radiogroup" aria-labelledby="apply-step-1" className="mt-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {openSchools.map((school) => {
                const selected = state.school === school.slug;
                return (
                  <button
                    key={school.slug}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => chooseSchool(school.slug)}
                    className={cn(
                      "group relative flex min-h-[112px] flex-col items-start gap-2 rounded-2xl border-2 bg-white p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 sm:min-h-[132px]",
                      selected ? "border-navy bg-primary-50" : "border-neutral-200 hover:border-neutral-300",
                    )}
                  >
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", selected ? "bg-navy text-white" : "bg-neutral-100 text-navy")}>
                      <SchoolIcon name={school.name} className="h-5 w-5" />
                    </span>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">School of</span>
                    <span className="-mt-2 block text-base font-bold leading-snug text-navy">{shortSchoolName(school.name)}</span>
                    {school.oneLiner && <span className="hidden text-xs leading-snug text-neutral-600 sm:line-clamp-2">{school.oneLiner}</span>}
                    <span className="mt-auto text-xs font-medium text-neutral-500">
                      {school.programmes.length} programme{school.programmes.length === 1 ? "" : "s"}
                    </span>
                    {selected && (
                      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-white" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L19 7" /></svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {soonSchools.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-neutral-700">Opening soon <span className="font-normal text-neutral-500">· join the waitlist</span></p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {soonSchools.map((school) => {
                    const selected = state.school === school.slug;
                    return (
                      <button
                        key={school.slug}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => chooseSchool(school.slug)}
                        className={cn(
                          "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800",
                          selected ? "border-navy bg-navy text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400",
                        )}
                      >
                        <SchoolIcon name={school.name} className="h-4 w-4" />
                        {shortSchoolName(school.name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {selectedSchool && selectedSchool.programmes.length > 1 && (
            <fieldset ref={programmeRef} className="mt-8 scroll-mt-24">
              <legend className="text-lg font-heading font-semibold text-neutral-900">Which programme in the {selectedSchool.name}?</legend>
              <div className="mt-3 grid gap-3">
                {selectedSchool.programmes.map((programme) => {
                  const selected = state.programme === programme.slug;
                  return (
                    <label
                      key={programme.slug}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 bg-white p-4",
                        selected ? "border-primary-800 bg-primary-50" : "border-neutral-200 hover:border-neutral-300",
                      )}
                    >
                      <input
                        type="radio"
                        name="programme"
                        value={programme.slug}
                        checked={selected}
                        onChange={() => setState((current) => ({ ...current, programme: programme.slug }))}
                        className="mt-1 h-4 w-4 text-primary-800"
                      />
                      <span>
                        <span className="block font-semibold text-neutral-900">
                          {programme.title}
                          {programme.phoneFriendly && <span className="ml-2 text-sm font-medium text-success-dark">📱 Phone-friendly</span>}
                        </span>
                        {programme.shortDescription && <span className="mt-1 block text-sm text-neutral-600">{programme.shortDescription}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {schoolComingSoon && (
            <p className="mt-6 rounded-xl border border-accent-200 bg-accent-50 p-4 text-neutral-800">
              Programmes for the {selectedSchool?.name}{selectedSchool?.upcoming.length ? ` (${selectedSchool.upcoming.join(", ")})` : ""} open soon. Continue and leave your details, and {`we'll`} message you on WhatsApp as soon as you can apply.
            </p>
          )}

          <div className="sticky bottom-0 -mx-4 mt-8 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <button
              type="button"
              disabled={!state.school || (!schoolComingSoon && !state.programme)}
              onClick={() => goToStep(2)}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-800 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:mx-auto sm:max-w-md"
            >
              {selectedSchool && !schoolComingSoon && !state.programme ? "Choose a programme to continue" : "Continue →"}
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-neutral-600">
            Not sure?{" "}
            <Link href="/quiz" className="font-medium text-primary-800 underline underline-offset-2">
              Take the 2-minute quiz →
            </Link>
          </p>
        </section>
      )}

      {state.step === 2 && (
        <section aria-labelledby="apply-step-2">
          <h1 id="apply-step-2" ref={headingRef} tabIndex={-1} className="text-2xl font-heading font-bold text-neutral-900 focus:outline-none md:text-3xl">
            Where should we send your scholarship offer?
          </h1>
          {schoolComingSoon && (
            <p className="mt-2 text-neutral-600">
              Joining the waitlist for the <strong className="text-neutral-900">{selectedSchool?.name}</strong>.
            </p>
          )}
          {selectedProgramme && (
            <p className="mt-2 text-neutral-600">
              Applying for <strong className="text-neutral-900">{selectedProgramme.title}</strong>.{" "}
              <button type="button" onClick={() => goToStep(1)} className="font-medium text-primary-800 underline underline-offset-2">
                Change
              </button>
            </p>
          )}
          {existingAccount ? (
            <div className="mt-6 rounded-2xl border border-primary-200 bg-white p-6">
              <h2 className="text-lg font-heading font-semibold text-neutral-900">Welcome back. Log in to see your offer.</h2>
              <p className="mt-2 text-neutral-600">You already have a SkillsAir account with this email.</p>
              <Link
                href={`/login?next=${encodeURIComponent(`/apply/offer?programme=${state.programme}`)}`}
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-700 px-6 py-3 font-semibold text-white hover:bg-accent-800"
              >
                Log in →
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              <LeadDetailsForm
                source="apply"
                submitLabel="Continue →"
                initial={state.details}
                school={state.school}
                programme={state.programme}
                onChange={(details) => setState((current) => ({ ...current, details }))}
                onSuccess={(result, details) => {
                  track("lead_captured", { source: "apply", school: state.school });
                  if (!state.programme) {
                    setWaitlisted(true);
                    return;
                  }
                  if (result.hasAccount) {
                    setExistingAccount(true);
                    return;
                  }
                  setState((current) => ({ ...current, details, leadSaved: true, step: 3 }));
                  track("apply_step_complete", { step: 2 });
                }}
              />
            </div>
          )}
          <button type="button" onClick={() => goToStep(1)} className="mt-6 min-h-12 text-sm font-medium text-neutral-600 hover:text-neutral-900">
            ← Back
          </button>
        </section>
      )}

      {state.step === 3 && (
        <section aria-labelledby="apply-step-3">
          <h1 id="apply-step-3" ref={headingRef} tabIndex={-1} className="text-2xl font-heading font-bold text-neutral-900 focus:outline-none md:text-3xl">
            3 quick questions, and you&apos;re done
          </h1>
          {error && <p role="alert" className="mt-4 rounded-xl border border-error/30 bg-error-light p-3.5 text-sm text-error-dark">{error}</p>}
          <div className="mt-6 space-y-8">
            {QUESTIONS.map((question) => (
              <fieldset key={question.key}>
                <legend className="font-semibold text-neutral-900">{question.label}</legend>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {question.options.map((option) => {
                    const selected = state[question.key] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        disabled={finishing}
                        onClick={() => answer(question.key, option.value)}
                        className={cn(
                          "min-h-12 rounded-xl border-2 bg-white px-4 py-3 text-left font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800",
                          selected ? "border-primary-800 bg-primary-50 text-primary-900" : "border-neutral-200 text-neutral-800 hover:border-neutral-300",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <button
            type="button"
            disabled={finishing || !state.currentStatus || !state.device || !state.weeklyHours}
            onClick={() => void finish(state)}
            className="mt-8 flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-700 px-6 py-3 text-base font-semibold text-white hover:bg-accent-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {finishing ? `Checking your scholarship for ${selectedProgramme?.title ?? "your programme"}…` : "See my scholarship offer →"}
          </button>
          <p className="sr-only" aria-live="polite">
            {finishing ? `Checking your scholarship for ${selectedProgramme?.title ?? "your programme"}` : ""}
          </p>
          <button type="button" onClick={() => goToStep(2)} className="mt-6 min-h-12 text-sm font-medium text-neutral-600 hover:text-neutral-900">
            ← Back
          </button>
        </section>
      )}
    </div>
  );
}
