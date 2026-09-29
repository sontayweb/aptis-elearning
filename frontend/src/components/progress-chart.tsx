"use client";

import Link from "next/link";
import { LineChart as ChartLineIcon, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { GlowCard } from "./glow-card";

const chartData = [
  { date: "10/09", grammar: 55, reading: 48, listening: 60, speaking: 45, writing: 40 },
  { date: "12/09", grammar: 62, reading: 52, listening: 65, speaking: 50, writing: 48 },
  { date: "15/09", grammar: 70, reading: 58, listening: 68, speaking: 55, writing: 52 },
  { date: "18/09", grammar: 74, reading: 65, listening: 72, speaking: 60, writing: 58 },
  { date: "21/09", grammar: 80, reading: 70, listening: 78, speaking: 65, writing: 64 },
  { date: "24/09", grammar: 85, reading: 76, listening: 82, speaking: 70, writing: 68 },
];

const skills = [
  { key: "grammar", label: "Grammar & Vocab", color: "hsl(8 99% 50%)", pct: 85 },
  { key: "reading", label: "Reading", color: "hsl(200 80% 50%)", pct: 76 },
  { key: "listening", label: "Listening", color: "hsl(30 99% 68%)", pct: 82 },
  { key: "speaking", label: "Speaking", color: "hsl(280 80% 55%)", pct: 70 },
  { key: "writing", label: "Writing", color: "hsl(142 60% 45%)", pct: 68 },
];

export function ProgressChart() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 2-col Recharts LineChart */}
      <div className="lg:col-span-2">
        <GlowCard className="p-6 overflow-hidden" spotlight>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground flex items-center gap-2">
              <ChartLineIcon className="w-5 h-5 text-primary" />
              <span>Tiến bộ theo thời gian (% Chính xác)</span>
            </h3>
            <Link
              href="/progress"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span>Chi tiết</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(val) => `${val}%`}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-md)",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(val: any) => [`${val}%`]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                {skills.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                    activeDot={{ r: 5, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
      </div>

      {/* 1-col 5 Skill Progress Overview */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="font-heading font-extrabold text-base text-foreground">
            Mức độ thành thạo kỹ năng
          </h3>

          <div className="space-y-3.5">
            {skills.map((s) => (
              <div key={s.key} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">{s.label}</span>
                  <span className="text-muted-foreground">{s.pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${s.pct}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border">
            <Link
              href="/thi-thu"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-muted/60 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
            >
              <span>Làm bài Full Test kiểm tra Band</span>
              <ChevronRight className="w-3.5 h-3.5 text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
