import { guidedPlanOn } from "@/content/site";

/** Grouped objections for /faq and the FAQ teasers (Section 8.9 of the rebuild brief). */

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  link?: { label: string; href: string };
}

export const faqs: FaqItem[] = [
  {
    id: "why-cheap",
    question: "Why is it only ₦2,000 a month? What's the catch?",
    answer:
      "No catch. SkillsAir's founder, Abraham Akinwumi, started SkillsAir because talented young Africans were priced out of quality tech training, while companies couldn't find enough skilled people. During each scholarship window, the Access Scholarship replaces the standard fee (₦100,000, or ₦40,000 a month) with ₦2,000 a month while you study. Keep your subscription until you finish your programme (it's designed to take about 3 months at about 8 hours a week), and cancel anytime. The only other cost is an optional certificate, paid separately when you finish.",
  },
  {
    id: "beginner",
    question: "Do I need any experience?",
    answer: "No. Every programme starts from zero, and you can watch a free preview lesson before you apply.",
  },
  {
    id: "phone",
    question: "Can I learn with only my phone?",
    answer:
      "It depends on the programme. These work fully on a phone: Smartphone Videography, Mobile Graphics Design and Product Management (look for the 📱 badge). Data Analysis needs desktop Excel for its statistics chapter. Others need a laptop for some of the work. Each programme lists exactly what you'll need.",
  },
  {
    id: "how-long",
    question: "How long does it take?",
    answer: guidedPlanOn
      ? "Each programme follows a guided 12-week plan at about 8 hours a week, with weekly goals and a reminder every Monday. If you fall behind, you can move your plan to fit. On a monthly plan your access continues while your subscription is active, so you can take longer if you need to. Prefer no schedule? You can switch to self-paced in your plan settings."
      : "Each programme is designed to take 12 weeks at about 8 hours a week. On a monthly plan your access continues while your subscription is active, so you can take longer if you need to.",
  },
  {
    id: "start",
    question: "When can I start?",
    answer: "Immediately after you pay.",
  },
  {
    id: "legit",
    question: "Is SkillsAir legit?",
    answer:
      "Yes. SkillsAir is run by SKILLS AIR LIMITED, registered with the Corporate Affairs Commission (RC 9272398). Payments go through Paystack. You can WhatsApp us on +234 704 236 9143 or email hello@skillsair.com.",
  },
  {
    id: "job",
    question: "Will you get me a job?",
    answer:
      "We don't promise jobs, and be careful of anyone who does. When you earn your certificate, you get access to internship openings from our partner firms, and sometimes direct job opportunities. Our partner network is new and growing.",
  },
  {
    id: "extras",
    question: "What do I get besides the programme?",
    answer:
      "Free CV & LinkedIn and Freelancing courses. You can access them while your enrolment is active, or after it ends if you were enrolled for at least two months. When you finish, you can also get a verifiable certificate by passing the final exam (optional, paid separately).",
  },
  {
    id: "after-deadline",
    question: "What happens after 31 October?",
    answer:
      "The scholarship window closes and the standard fee (₦100,000, or ₦40,000 a month) applies to new learners until the next window opens. If you joined during the window, you keep paying ₦2,000 a month.",
  },
  {
    id: "someone-else-pays",
    question: "Can someone else pay for me?",
    answer:
      "Yes. Create your account, then they can pay by bank transfer or OPay, where each payment covers a month, or enter their own card on the Paystack page, where the ₦2,000-a-month payment renews from that card.",
  },
  {
    id: "debited",
    question: "What if I'm debited but the payment fails?",
    answer:
      "Banks usually reverse failed payments automatically. If yours hasn't, send your reference to Imisi on WhatsApp and we'll resolve it within 24 hours.",
  },
  {
    id: "refunds",
    question: "What's your refund policy?",
    answer:
      "You can request a refund within 24 hours of paying, once you've completed at least one chapter or 5 lessons, so you've genuinely tried it.",
    link: { label: "Refund policy", href: "/refunds" },
  },
  {
    id: "laptop",
    question: "How does laptop support work?",
    answer:
      "Each cohort, 2 laptops go to certified graduates who need one most. Once you have your certificate, apply from your dashboard and tell us your story. We choose the applicants with the greatest need. This promotion is approved by the FCCPC.",
    link: { label: "Official rules", href: "/laptop-rules" },
  },
  {
    id: "certificate",
    question: "Do I get a certificate?",
    answer:
      "Yes. When you finish your programme, you can get a verifiable certificate: pay the certificate fee, then take your final exam. The fee covers the exam (retakes included) and your certificate when you pass. It's optional, and it has a unique link employers can check and you can add to LinkedIn. You need it to access internship openings and to apply for laptop support.",
  },
  {
    id: "cohort",
    question: "What is a cohort?",
    answer:
      "Everyone who enrols during the same enrolment period, currently October 2026 to January 2027, whether on the scholarship or the standard fee.",
  },
];

/** The four questions shown on the home page teaser. */
export const homeFaqIds = ["why-cheap", "beginner", "phone", "legit"];
