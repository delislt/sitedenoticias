import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/domain";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/conta", "/auth", "/api", "/favoritos"],
    },
    sitemap: siteUrl + "/sitemap.xml",
  };
}
