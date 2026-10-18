/**
 * "What you could do next": typical entry-level roles each school prepares people for.
 * Factual role names only; no salary or placement claims.
 */
const ROLES: Record<string, string[]> = {
  schoolofai: ["AI operations assistant", "Prompt and automation specialist", "Junior data annotator", "AI-assisted content or support roles"],
  schoolofcontentcreation: ["Social media content creator", "Video editor", "Copywriter", "Community manager"],
  schoolofdata: ["Junior data analyst", "Business intelligence assistant", "Reporting analyst", "Data entry and quality analyst"],
  schoolofdesign: ["Junior UI/UX designer", "Graphic designer", "Brand and social media designer", "Product design intern"],
  schoolofengineering: ["Junior front-end developer", "Junior back-end developer", "QA tester", "Technical support engineer"],
  schoolofnocodedevelopment: ["No-code app builder", "Website builder for small businesses", "Automation assistant", "Freelance web designer"],
  schoolofproducts: ["Associate product manager", "Product operations assistant", "Project coordinator", "Product support specialist"],
  schoolofsalesandmarketing: ["Digital marketing assistant", "Sales development representative", "Social media manager", "Performance marketing intern"],
  schoolofsecurity: ["Security operations (SOC) analyst intern", "IT support with a security focus", "Junior compliance assistant", "Vulnerability assessment intern"],
  schoolofsmartphonecreators: ["Smartphone videographer", "Mobile content creator", "Live-stream host or producer", "Mobile graphics designer"],
};

export function schoolRoles(name: string): string[] {
  return ROLES[name.toLowerCase().replace(/[^a-z]/g, "")] ?? [];
}

/**
 * Landing-page copy for each school (used when ads point straight at /schools/[slug]).
 * Honest by design: no job promises, learner counts or testimonials. Keys are normalised
 * school names, as in ROLES above.
 */
export interface SchoolCopy {
  /** Promise-led headline for the hero. */
  headline: string;
  /** Two or three sentences under the headline. */
  pitch: string;
  /** What you'll be able to do, in plain words. */
  skills: string[];
  /** Who this school suits. */
  whoFor: string[];
}

const COPY: Record<string, SchoolCopy> = {
  schoolofai: {
    headline: "Put AI to work before everyone else does",
    pitch: "Every industry is changing how it works because of AI. The School of AI teaches you to use it properly: to automate busywork, build smarter workflows and become the person your team asks for help.",
    skills: ["Write prompts that get reliable results", "Automate everyday tasks with AI tools", "Build simple AI-powered workflows", "Judge when AI output can be trusted"],
    whoFor: ["Students and graduates who want an edge", "Professionals who want to work faster", "Anyone curious about AI but unsure where to start"],
  },
  schoolofcontentcreation: {
    headline: "Create content people stop scrolling for",
    pitch: "Brands need content every single day, and most can't make it themselves. Learn to plan, shoot, edit and publish content that gets attention, starting with the phone in your hand.",
    skills: ["Plan content that fits a brand", "Shoot and edit short-form video", "Write captions and hooks that work", "Grow and read an audience"],
    whoFor: ["Creators who want to go professional", "People who want to work with brands", "Anyone with a phone and ideas"],
  },
  schoolofdata: {
    headline: "Turn numbers into decisions companies pay for",
    pitch: "Every business collects data. Few people can make sense of it. Learn to clean, analyse and present data clearly, and put AI to work on the repetitive parts.",
    skills: ["Clean and organise messy data", "Analyse data in spreadsheets and BI tools", "Build charts and dashboards people understand", "Automate reports with AI"],
    whoFor: ["Graduates from any course (no maths degree needed)", "People in admin, finance or sales who handle numbers", "Career switchers who like solving puzzles"],
  },
  schoolofdesign: {
    headline: "Design what people love to use",
    pitch: "Good design is the difference between an app people delete and one they open every day. Learn the tools and thinking behind products and visuals that look good and work well.",
    skills: ["Design screens for apps and websites", "Run simple user research", "Create brand and social visuals", "Build a portfolio you can show"],
    whoFor: ["Creative people who want a tech career", "Graphic designers moving into product design", "Beginners with a good eye"],
  },
  schoolofengineering: {
    headline: "Build the software businesses run on",
    pitch: "From websites to mobile apps to the cloud, software runs modern business. Start from the basics and build real projects, one skill at a time, at your own pace.",
    skills: ["Build websites people can use", "Write back-end code and APIs", "Create mobile apps", "Deploy to the cloud"],
    whoFor: ["Problem-solvers who like building things", "Students who want practical coding skills", "Career switchers ready to put in steady weekly hours"],
  },
  schoolofnocodedevelopment: {
    headline: "Build real apps without writing code",
    pitch: "Small businesses need websites, apps and automations, fast. With no-code tools you can build them in days, not months, and get paid for it.",
    skills: ["Build websites with no-code tools", "Create simple apps and internal tools", "Automate workflows between apps", "Deliver projects for clients"],
    whoFor: ["Entrepreneurs who want to build their own tools", "Freelancers looking for in-demand services", "Anyone who wants results quickly"],
  },
  schoolofproducts: {
    headline: "Lead products from idea to launch",
    pitch: "Product people decide what gets built and why. Learn to understand users, plan features and keep designers and engineers moving in the same direction.",
    skills: ["Turn user problems into product ideas", "Write clear product plans", "Prioritise what to build next", "Work with designers and engineers"],
    whoFor: ["Organised people who like solving problems with others", "Professionals moving into tech roles", "Designers and developers who want to lead"],
  },
  schoolofsalesandmarketing: {
    headline: "Grow brands and close deals online",
    pitch: "Every business needs customers. Learn the digital marketing and sales skills that bring them in, and how to show the results.",
    skills: ["Plan and run digital campaigns", "Write copy that converts", "Read the numbers behind a campaign", "Sell with confidence"],
    whoFor: ["Natural communicators and persuaders", "Small-business owners who want more customers", "Graduates aiming for marketing roles"],
  },
  schoolofsecurity: {
    headline: "Protect systems and data from attackers",
    pitch: "Every company that goes online needs people who can keep it safe. Learn how attacks happen and how to defend against them, from the ground up.",
    skills: ["Understand how networks and attacks work", "Find and fix common security weaknesses", "Monitor systems for threats", "Practise ethical hacking safely"],
    whoFor: ["Careful people who enjoy puzzles", "IT support staff who want to specialise", "Beginners curious about how hackers think"],
  },
  schoolofsmartphonecreators: {
    headline: "Turn your phone into a source of income",
    pitch: "You don't need a laptop or expensive gear to start. Learn to shoot, design and stream professionally with just your smartphone, and turn it into paid work.",
    skills: ["Shoot and edit professional video on your phone", "Design graphics on mobile", "Live-stream with confidence", "Find paid gigs for your skills"],
    whoFor: ["Anyone with a smartphone and no laptop yet", "Creators who want to earn from their content", "Small businesses that want better visuals"],
  },
};

const FALLBACK_COPY: SchoolCopy = {
  headline: "Learn a tech skill employers pay for",
  pitch: "Self-paced, beginner-friendly training that ends with a verifiable certificate and access to internship openings.",
  skills: ["Learn the fundamentals step by step", "Practise on real tasks", "Build a project you can show", "Earn a verifiable certificate"],
  whoFor: ["Beginners", "Students and graduates", "Career switchers"],
};

export function schoolCopy(name: string): SchoolCopy {
  return COPY[name.toLowerCase().replace(/[^a-z]/g, "")] ?? FALLBACK_COPY;
}
