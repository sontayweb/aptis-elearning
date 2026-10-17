import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_CONFIG.domain}`;
  const now = new Date();

  // 1. Static high-value routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    // 4 Kỹ năng trọng tâm
    {
      url: `${baseUrl}/listening`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/reading`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/writing`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/speaking`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    // Thi thử trọn gói chuẩn British Council
    {
      url: `${baseUrl}/thi-thu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    // Luyện tập & Học liệu
    {
      url: `${baseUrl}/grammar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/vocabulary`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/nghe-chep`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/meo-thi-aptis`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tai-lieu`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/key-du-doan`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bang-ky-tich`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    // Thông tin & Pháp lý
    {
      url: `${baseUrl}/gioi-thieu`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Dynamic Exam URLs (Graceful fetch with timeout)
  let dynamicExamRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${apiUrl}/exams?limit=500`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const exams: Array<{ id: string; type?: string; updatedAt?: string }> =
        data?.data?.exams || data?.exams || (Array.isArray(data) ? data : []);

      dynamicExamRoutes = exams.flatMap((exam) => {
        const type = (exam.type || "").toLowerCase();
        const updatedAt = exam.updatedAt ? new Date(exam.updatedAt) : now;
        const routes: MetadataRoute.Sitemap = [];

        // Dynamic route map according to skill type
        if (type.includes("reading")) {
          routes.push({
            url: `${baseUrl}/reading/${exam.id}`,
            lastModified: updatedAt,
            changeFrequency: "weekly",
            priority: 0.8,
          });
        } else if (type.includes("listening")) {
          routes.push({
            url: `${baseUrl}/listening/${exam.id}`,
            lastModified: updatedAt,
            changeFrequency: "weekly",
            priority: 0.8,
          });
        } else if (type.includes("writing")) {
          routes.push({
            url: `${baseUrl}/writing/${exam.id}`,
            lastModified: updatedAt,
            changeFrequency: "weekly",
            priority: 0.8,
          });
        } else if (type.includes("speaking")) {
          routes.push({
            url: `${baseUrl}/speaking/${exam.id}`,
            lastModified: updatedAt,
            changeFrequency: "weekly",
            priority: 0.8,
          });
        } else {
          // Full test or unspecified
          routes.push({
            url: `${baseUrl}/thi-thu/${exam.id}`,
            lastModified: updatedAt,
            changeFrequency: "weekly",
            priority: 0.85,
          });
        }

        return routes;
      });
    }
  } catch {
    // Graceful fallback: sitemap still returns static routes without breaking build
  }

  return [...staticRoutes, ...dynamicExamRoutes];
}
