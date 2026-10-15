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
  schoolofsmartphone: ["Smartphone videographer", "Mobile content creator", "Freelance social media editor", "Event and product shoot assistant"],
};

export function schoolRoles(name: string): string[] {
  return ROLES[name.toLowerCase().replace(/[^a-z]/g, "")] ?? [];
}
