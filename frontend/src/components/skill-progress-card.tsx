import { BarChart3, CheckCircle2 } from "lucide-react";

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

interface SkillProgressCardProps {
  skills?: SkillProgressItem[];
}

const defaultSkills = [
  { name: "Grammar & Vocab", status: "Chưa làm", pct: 0 },
  { name: "Reading", status: "Chưa làm", pct: 0 },
  { name: "Listening", status: "Chưa làm", pct: 0 },
  { name: "Speaking", status: "Chưa làm", pct: 0 },
  { name: "Writing", status: "Chưa làm", pct: 0 },
];

export function SkillProgressCard({ skills: propSkills }: SkillProgressCardProps) {
  const displaySkills = propSkills && propSkills.length > 0
    ? propSkills.map((s) => ({
        name: s.label || s.name || s.skill || "Kỹ năng",
        status: s.level || s.status || "Chưa làm",
        pct: s.pct ?? (s.completedExams ? Math.min(100, s.completedExams * 15) : 0),
      }))
    : defaultSkills;

  return (
    <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-md tech-card hover:border-primary/50 hover:shadow-glow-red p-4 sm:p-6">
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
      </div>
    </div>
  );
}
