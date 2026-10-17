import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "APTIS ESOL PREMIER — Luyện thi Aptis ESOL chuẩn British Council",
    short_name: "Aptis Premier",
    description: "Nền tảng luyện thi Aptis ESOL chuẩn CEFR — Thi thử miễn phí, AI chấm Speaking & Writing, lộ trình đạt B2 nhanh nhất.",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#0B132B",
    theme_color: "#DE1A35",
    orientation: "portrait",
    scope: "/",
    categories: ["education", "productivity"],
    lang: "vi",
    icons: [
      {
        src: "/icon.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Thi thử Aptis",
        short_name: "Thi thử",
        url: "/thi-thu",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Luyện Listening",
        short_name: "Listening",
        url: "/listening",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Luyện Reading",
        short_name: "Reading",
        url: "/reading",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Luyện Writing",
        short_name: "Writing",
        url: "/writing",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Luyện Speaking",
        short_name: "Speaking",
        url: "/speaking",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
