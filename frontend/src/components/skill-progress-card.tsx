import Link from "next/link";
import { BarChart3, Zap, ArrowRight, BookOpen } from "lucide-react";

interface SkillProgressItem {
  skill?: string;
  label?: string;
  name?: string;
  level?: string;
  status?: string;
  pct?: number;
  completedExams?: number;
  totalExams?: number;
}

interface WeakestSkillInfo {
  name: string;
  skill: string;
  pct: number;
  route?: string;
}

interface SkillProgressCardProps {
  skills?: SkillProgressItem[];
  weakestSkill?: WeakestSkillInfo;
}

const defaultSkills = [
  { name: "Grammar & Vocab", status: "Chưa làm", pct: 0, skill: "grammar" },
  { name: "Reading", status: "Chưa làm", pct: 0, skill: "reading" },
  { name: "Listening", status: "Chưa làm", pct: 0, skill: "listening" },
  { name: "Speaking", status: "Chưa làm", pct: 0, skill: "speaking" },
  { name: "Writing", status: "Chưa làm", pct: 0, skill: "writing" },
];

export function SkillProgressCard({ skills: propSkills, weakestSkill }: SkillProgressCardProps) {
  const displaySkills = propSkills && propSkills.length > 0
    ? propSkills.map((s) => ({
        name: s.label || s.name || s.skill || "Kỹ năng",
        status: s.level || s.status || (s.completedExams ? `${s.completedExams} bài` : "Chưa làm"),
        pct: s.pct ?? (s.completedExams ? Math.min(100, s.completedExams * 15) : 0),
        skill: s.skill || "",
      }))
    : defaultSkills;

  const hasAnyActivity = displaySkills.some((s) => s.pct > 0 || s.status !== "Chưa làm");

  const computedWeakest = weakestSkill || (hasAnyActivity
    ? displaySkills.reduce((prev, curr) => (curr.pct < prev.pct ? curr : prev), displaySkills[0])
    : null);

  const getWeakestRoute = () => {
    if (computedWeakest && "route" in computedWeakest && computedWeakest.route) {
      return computedWeakest.route;
    }
    const sk = (computedWeakest?.skill || computedWeakest?.name || "").toLowerCase();
    if (sk.includes("reading")) return "/reading";
    if (sk.includes("listening")) return "/listening";
    if (sk.includes("speaking")) return "/speaking";
    if (sk.includes("writing")) return "/writing";
    return "/grammar";
  };

  return (
    <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-md tech-card hover:border-primary/50 hover:shadow-glow-soft p-4 sm:p-6">
      <div className="relative">
        <h2 className="font-heading font-bold text-foreground mb-5 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span>Tiến bộ theo kỹ năng</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          {displaySkills.map((skill) => {
            const isCompleted = skill.status !== "Chưa làm";
            return (
              <div key={skill.name} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-foreground font-semibold">{skill.name}</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {skill.status}
                  </span>
                </div>
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, skill.pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Phân tích kỹ năng hoặc hướng dẫn người mới */}
        <div className="mt-5 pt-4 border-t border-border">
          {hasAnyActivity && computedWeakest ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Kỹ năng yếu nhất:{" "}
                  <strong className="text-foreground">{computedWeakest.name}</strong>{" "}
                  ({computedWeakest.pct}%) — nên luyện thêm!
                </p>
              </div>
              <Link
                href={getWeakestRoute()}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
              >
                <span>Luyện ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Làm bài thi thử để hệ thống phân tích thế mạnh và kỹ năng cần cải thiện.
                </p>
              </div>
              <Link
                href="/thi-thu"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
              >
                <span>Làm bài kiểm tra</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
