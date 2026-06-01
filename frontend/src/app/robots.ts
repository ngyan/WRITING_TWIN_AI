import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/onboarding", "/billing"],
    },
    sitemap: "https://writingtwinai.com/sitemap.xml",
  };
}
