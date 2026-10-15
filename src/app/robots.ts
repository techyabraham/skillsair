import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://skillsair.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/apply/", "/apply", "/checkout", "/dashboard", "/api/", "/r/", "/payments/", "/order-confirmation/"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
