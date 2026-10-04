import { LandingPage } from "@/components/landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "APTIS ESOL PREMIER — Luyện thi Aptis chuẩn British Council & AI chấm điểm",
  description: "870+ đề thi sát kỳ thi thật, AI chấm Speaking & Writing theo 4 tiêu chí CEFR, trả band điểm và lộ trình nâng band chi tiết.",
};

export default function LandingPageRoute() {
  return <LandingPage />;
}
