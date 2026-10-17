import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_CONFIG.domain}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/teacher",
          "/teacher/*",
          "/dashboard",
          "/dashboard/*",
          "/profile",
          "/profile/*",
          "/history",
          "/history/*",
          "/progress",
          "/progress/*",
          "/my-classes",
          "/my-classes/*",
          "/api",
          "/api/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/*",
          "/teacher/*",
          "/dashboard/*",
          "/profile/*",
          "/api/*",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/admin/*",
          "/teacher/*",
          "/dashboard/*",
          "/profile/*",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
