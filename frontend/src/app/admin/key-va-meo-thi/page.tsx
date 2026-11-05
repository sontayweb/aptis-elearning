"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  Headphones,
  BookOpen,
  Mic,
  PenTool,
  Save,
  RotateCcw,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import {
  LISTENING_PART1_DATA,
  LISTENING_PART2_TOPICS,
  LISTENING_PART3_DATA,
  LISTENING_PART4_DATA,
  Part1Question,
  Part2Topic,
  Part3Item,
  Part4Topic,
} from "@/data/key-meo-listening-data";
import { WRITING_KEY_MEO_DATA, WritingPartData } from "@/data/key-meo-writing-data";
import { SPEAKING_KEY_MEO_DATA, SpeakingPartData } from "@/data/key-meo-speaking-data";
import { READING_KEY_MEO_DATA, ReadingPartData } from "@/data/key-meo-reading-data";

// Sub-components for 4 skills
import AdminListeningTab from "@/components/admin/key-meo-thi/admin-listening-tab";
import AdminReadingTab from "@/components/admin/key-meo-thi/admin-reading-tab";
import AdminSpeakingTab from "@/components/admin/key-meo-thi/admin-speaking-tab";
import AdminWritingTab from "@/components/admin/key-meo-thi/admin-writing-tab";

type SkillType = "listening" | "reading" | "speaking" | "writing";

export default function AdminKeyVaMeoThiPage() {
  const [activeSkill, setActiveSkill] = useState<SkillType>("listening");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States for Listening parts
  const [part1Data, setPart1Data] = useState<Record<string, Part1Question[]>>(LISTENING_PART1_DATA);
  const [part2Data, setPart2Data] = useState<Part2Topic[]>(LISTENING_PART2_TOPICS);
  const [part3Data, setPart3Data] = useState<Part3Item[]>(LISTENING_PART3_DATA);
  const [part4Data, setPart4Data] = useState<Part4Topic[]>(LISTENING_PART4_DATA);

  // States for Reading, Speaking, Writing
  const [writingData, setWritingData] = useState<Record<string, WritingPartData>>(WRITING_KEY_MEO_DATA);
  const [speakingData, setSpeakingData] = useState<Record<string, SpeakingPartData>>(SPEAKING_KEY_MEO_DATA);
  const [readingData, setReadingData] = useState<Record<string, ReadingPartData>>(READING_KEY_MEO_DATA);

  // Load custom settings from Database if exists
  useEffect(() => {
    async function loadCustomConfig() {
      try {
        setLoading(true);
        const res: any = await api.settings.getPublic();
        if (res.success && res.data?.raw?.KEY_MEO_LISTENING_CONFIG) {
          const cfg = JSON.parse(res.data.raw.KEY_MEO_LISTENING_CONFIG);
          if (cfg.part1) setPart1Data(cfg.part1);
          if (cfg.part2) setPart2Data(cfg.part2);
          if (cfg.part3) setPart3Data(cfg.part3);
          if (cfg.part4) setPart4Data(cfg.part4);
          if (cfg.writing) setWritingData(cfg.writing);
          if (cfg.speaking) setSpeakingData(cfg.speaking);
          if (cfg.reading) setReadingData(cfg.reading);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomConfig();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save all custom data to Database (SystemSetting: KEY_MEO_LISTENING_CONFIG)
  const handleSaveToDatabase = async () => {
    try {
      setSaving(true);
      const payload = {
        part1: part1Data,
        part2: part2Data,
        part3: part3Data,
        part4: part4Data,
        writing: writingData,
        speaking: speakingData,
        reading: readingData,
        updatedAt: new Date().toISOString(),
      };

      const res = await api.settings.update({
        settings: [
          {
            key: "KEY_MEO_LISTENING_CONFIG",
            value: JSON.stringify(payload),
            description: "Cấu hình ngân hàng câu hỏi & mẹo thi 4 kỹ năng (Listening, Reading, Speaking, Writing)",
          },
        ],
      });

      if (res.success) {
        showToast("✓ Đã lưu toàn bộ cấu hình Key & Mẹo Thi 4 kỹ năng vào Database!");
      } else {
        showToast("❌ Lưu thất bại: " + (res.message || "Lỗi máy chủ"));
      }
    } catch (err: any) {
      showToast("❌ Lỗi kết nối: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Reset to default seed data
  const handleResetToDefault = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục về dữ liệu ngân hàng đề mặc định cho tất cả kỹ năng?")) {
      setPart1Data(LISTENING_PART1_DATA);
      setPart2Data(LISTENING_PART2_TOPICS);
      setPart3Data(LISTENING_PART3_DATA);
      setPart4Data(LISTENING_PART4_DATA);
      setWritingData(WRITING_KEY_MEO_DATA);
      setSpeakingData(SPEAKING_KEY_MEO_DATA);
      setReadingData(READING_KEY_MEO_DATA);
      showToast("✓ Đã khôi phục về dữ liệu gốc mặc định. Bấm 'Lưu lên hệ thống' để áp dụng!");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-card border border-primary/30 shadow-lg text-xs font-bold text-foreground flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Actions */}
      <AdminPageHeader
        title="Quản Trị Key & Mẹo Thi (Aptis ESOL)"
        description="Cấu hình ngân hàng câu hỏi, bóc tách audio script và ma trận đáp án 4 kỹ năng hiển thị cho học viên."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/key-va-meo-thi?skill=${activeSkill}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              <span>Xem giao diện học viên ↗</span>
            </Link>

            <button
              onClick={handleResetToDefault}
              className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Khôi phục dữ liệu gốc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi phục gốc</span>
            </button>

            <button
              onClick={handleSaveToDatabase}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Đang lưu..." : "Lưu lên hệ thống"}</span>
            </button>
          </div>
        }
      />

      {/* LEVEL 1: SKILL TABS (Listening, Reading, Speaking, Writing) */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {[
          { id: "listening", label: "Listening", icon: Headphones, count: "4 Phần" },
          { id: "reading", label: "Reading", icon: BookOpen, count: "4 Phần" },
          { id: "speaking", label: "Speaking", icon: Mic, count: "4 Phần" },
          { id: "writing", label: "Writing", icon: PenTool, count: "4 Phần" },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = activeSkill === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSkill(s.id as SkillType)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{s.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* LEVEL 2: SKILL CONTENT MANAGERS */}
      {activeSkill === "listening" && (
        <AdminListeningTab
          part1Data={part1Data}
          setPart1Data={setPart1Data}
          part2Data={part2Data}
          setPart2Data={setPart2Data}
          part3Data={part3Data}
          setPart3Data={setPart3Data}
          part4Data={part4Data}
          setPart4Data={setPart4Data}
          showToast={showToast}
        />
      )}

      {activeSkill === "reading" && (
        <AdminReadingTab
          readingData={readingData}
          setReadingData={setReadingData}
          showToast={showToast}
        />
      )}

      {activeSkill === "speaking" && (
        <AdminSpeakingTab
          speakingData={speakingData}
          setSpeakingData={setSpeakingData}
          showToast={showToast}
        />
      )}

      {activeSkill === "writing" && (
        <AdminWritingTab
          writingData={writingData}
          setWritingData={setWritingData}
          showToast={showToast}
        />
      )}
    </div>
  );
}
