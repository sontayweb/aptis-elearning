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

interface TimelinePoint {
  date: string;
  grammar?: number;
  reading?: number;
  listening?: number;
  speaking?: number;
  writing?: number;
  [key: string]: any;
}

const defaultSkills = [
  { key: "grammar", label: "Grammar & Vocab", color: "hsl(8 99% 50%)" },
  { key: "reading", label: "Reading", color: "hsl(200 80% 50%)" },
  { key: "listening", label: "Listening", color: "hsl(30 99% 68%)" },
  { key: "speaking", label: "Speaking", color: "hsl(221 83% 53%)" },
  { key: "writing", label: "Writing", color: "hsl(142 60% 45%)" },
];

export function ProgressChart({ data }: { data?: TimelinePoint[] }) {
  const hasData = data && data.length > 0;

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
              href="/history"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span>Lịch sử chi tiết</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {hasData ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                  {defaultSkills.map((s) => (
                    <Line
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={2.5}
                      connectNulls={true}
                      dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                      activeDot={{ r: 5, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 w-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-border bg-muted/20">
              <ChartLineIcon className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <h4 className="font-heading font-semibold text-sm text-foreground mb-1">
                Chưa có dữ liệu tiến bộ
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                Hãy làm bài thi thử hoặc luyện tập các kỹ năng để hệ thống ghi nhận và vẽ biểu đồ tiến độ chính xác của bạn!
              </p>
              <Link
                href="/thi-thu"
                className="btn-brand-gradient text-white text-xs font-bold px-4 py-2 rounded-xl shadow-glow-soft hover:shadow-md transition-all"
              >
                Làm bài thi thử ngay
              </Link>
            </div>
          )}
        </GlowCard>
      </div>

      {/* 1-col 5 Skill Progress Overview */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="font-heading font-extrabold text-base text-foreground">
            Lộ trình làm bài
          </h3>
          <p className="text-xs text-muted-foreground">
            Hệ thống tự động theo dõi từng bài thi và đề xuất phần cần cải thiện nhất mỗi ngày.
          </p>

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

export function TimelineProgressChart({ data }: { data?: TimelinePoint[] }) {
  const hasData = data && data.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-md tech-card hover:border-primary/50 hover:shadow-glow-soft p-5 sm:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground flex items-center gap-2">
          <ChartLineIcon className="w-5 h-5 text-primary" />
          <span>Tiến bộ theo thời gian (% Chính xác)</span>
        </h3>
        <Link
          href="/history"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          <span>Chi tiết</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {hasData ? (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
              {defaultSkills.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2.5}
                  connectNulls={true}
                  dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-border bg-muted/20">
          <ChartLineIcon className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <h4 className="font-heading font-semibold text-sm text-foreground mb-1">
            Chưa có dữ liệu tiến bộ
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Hãy làm bài thi thử hoặc luyện tập các kỹ năng để hệ thống ghi nhận và vẽ biểu đồ tiến độ chính xác của bạn!
          </p>
          <Link
            href="/thi-thu"
            className="btn-brand-gradient text-white text-xs font-bold px-4 py-2 rounded-xl shadow-glow-soft hover:shadow-md transition-all inline-flex items-center gap-1.5"
          >
            <span>Làm bài thi thử ngay</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

