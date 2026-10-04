"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  FileText,
  Video,
  Download,
  Play,
  Search,
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  X,
  Clock,
  Layers,
  Award,
  ArrowRight,
} from "lucide-react";

interface DocumentItem {
  id: string;
  title: string;
  category: "PDF" | "EBOOK" | "HANDBOOK";
  skill: "ALL" | "SPEAKING" | "WRITING" | "READING" | "LISTENING" | "GRAMMAR";
  targetBand: "B1" | "B2" | "C" | "ALL";
  pages: number;
  fileSize: string;
  downloadsCount: number;
  isVip: boolean;
  description: string;
  downloadUrl: string;
}

interface VideoLesson {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  skill: "SPEAKING" | "WRITING" | "READING" | "LISTENING" | "GRAMMAR";
  targetBand: "B1" | "B2" | "C" | "ALL";
  thumbnailUrl?: string;
  views: number;
  description: string;
  videoEmbedId: string;
}

const DOCUMENTS_DATA: DocumentItem[] = [
  {
    id: "doc-1",
    title: "Cẩm nang Chiến thuật 4 Kỹ năng Aptis ESOL đạt Band C",
    category: "HANDBOOK",
    skill: "ALL",
    targetBand: "C",
    pages: 128,
    fileSize: "14.2 MB",
    downloadsCount: 3842,
    isVip: false,
    description: "Bộ cẩm nang thực chiến tổng hợp cấu trúc đề, thang điểm CEFR và bí quyết tối ưu thời gian 162 phút của British Council.",
    downloadUrl: "#",
  },
  {
    id: "doc-2",
    title: "Tuyển tập Bộ đề thi thật Aptis ESOL Update Mới Nhất",
    category: "PDF",
    skill: "ALL",
    targetBand: "B2",
    pages: 250,
    fileSize: "28.5 MB",
    downloadsCount: 5120,
    isVip: true,
    description: "Tổng hợp các đề thi thực tế tại các hội đồng BC Hà Nội, TP.HCM & Đà Nẵng kèm lời giải chi tiết và audio transcript.",
    downloadUrl: "#",
  },
  {
    id: "doc-3",
    title: "500 Từ vựng Trọng tâm Aptis B1 - B2 Cốt lõi & Phiên âm IPA",
    category: "EBOOK",
    skill: "GRAMMAR",
    targetBand: "B2",
    pages: 64,
    fileSize: "6.8 MB",
    downloadsCount: 4620,
    isVip: false,
    description: "Kho từ vựng chọn lọc xuất hiện với tần suất cao nhất trong các bài thi Reading, Speaking và Grammar & Vocabulary.",
    downloadUrl: "#",
  },
  {
    id: "doc-4",
    title: "Template Bài viết Writing Part 1 - Part 4 Đạt Chuẩn 50/50",
    category: "PDF",
    skill: "WRITING",
    targetBand: "C",
    pages: 85,
    fileSize: "9.1 MB",
    downloadsCount: 2980,
    isVip: true,
    description: "Mẫu câu ăn điểm cho thư thân mật, thư trang trọng và dàn ý phản hồi group chat mạng xã hội kèm 20 bài mẫu Band C.",
    downloadUrl: "#",
  },
  {
    id: "doc-5",
    title: "Trọn bộ 9 Câu hỏi & Câu trả lời Mẫu Speaking Band C",
    category: "PDF",
    skill: "SPEAKING",
    targetBand: "C",
    pages: 92,
    fileSize: "11.4 MB",
    downloadsCount: 3410,
    isVip: true,
    description: "Hướng dẫn miêu tả tranh, so sánh đối chiếu và thuyết trình 2 phút Part 4 với các cấu trúc câu nâng cao và idiom tự nhiên.",
    downloadUrl: "#",
  },
  {
    id: "doc-6",
    title: "Tổng hợp 25 Chủ điểm Ngữ pháp Bắt buộc trong Kỳ thi Aptis",
    category: "HANDBOOK",
    skill: "GRAMMAR",
    targetBand: "B1",
    pages: 78,
    fileSize: "7.5 MB",
    downloadsCount: 4100,
    isVip: false,
    description: "Hệ thống hóa toàn bộ thì động từ, câu điều kiện, mệnh đề quan hệ và đảo ngữ thường gặp trong 25 câu ngữ pháp đầu tiên.",
    downloadUrl: "#",
  },
];

const VIDEOS_DATA: VideoLesson[] = [
  {
    id: "vid-1",
    title: "Chiến thuật chinh phục Speaking Part 1 - 4 đạt Band C cấp tốc",
    speaker: "Thầy Hưng (Band C Aptis - 195/200)",
    duration: "28:45",
    skill: "SPEAKING",
    targetBand: "C",
    views: 8940,
    description: "Phân tích tư duy trả lời tức thì, cách tận dụng 1 phút chuẩn bị Part 4 và phương pháp phát âm chuẩn để AI chấm điểm tối đa.",
    videoEmbedId: "dQw4w9WgXcQ",
  },
  {
    id: "vid-2",
    title: "Bí kíp viết Thư Trang trọng Part 4 Writing chuẩn chỉnh 50/50",
    speaker: "Cô Mai Lan (Chuyên gia Khảo thí Aptis)",
    duration: "34:10",
    skill: "WRITING",
    targetBand: "B2",
    views: 6520,
    description: "So sánh sự khác biệt giữa thư thân mật và thư gửi ban quản lý, các cặp liên từ chỉ nguyên nhân/kết quả nâng cao band điểm.",
    videoEmbedId: "dQw4w9WgXcQ",
  },
  {
    id: "vid-3",
    title: "Phương pháp né bẫy và bắt từ khóa Listening Part 3 & 4",
    speaker: "Thầy David Miller (Giảng viên Bản ngữ)",
    duration: "25:15",
    skill: "LISTENING",
    targetBand: "B2",
    views: 5230,
    description: "Kỹ thuật dự đoán nội dung qua câu hỏi, nhận diện giọng điệu nhân vật và cách xử lý đoạn đối thoại nhiều quan điểm trái chiều.",
    videoEmbedId: "dQw4w9WgXcQ",
  },
  {
    id: "vid-4",
    title: "Kỹ thuật Scanning & Skimming bài đọc dài Reading Part 4",
    speaker: "Cô Hoàng Yến (8.0 IELTS / C Aptis)",
    duration: "22:30",
    skill: "READING",
    targetBand: "C",
    views: 4780,
    description: "Cách tìm thông tin nhanh trong 7 đoạn văn phức tạp mà không cần đọc hết toàn bộ bài đọc, đảm bảo hoàn thành trong 35 phút.",
    videoEmbedId: "dQw4w9WgXcQ",
  },
];

export default function TaiLieuPage() {
  const [activeTab, setActiveTab] = useState<"docs" | "videos">("docs");
  const [selectedSkill, setSelectedSkill] = useState<string>("ALL");
  const [selectedBand, setSelectedBand] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadSuccessModal, setDownloadSuccessModal] = useState<DocumentItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);

  const filteredDocs = DOCUMENTS_DATA.filter((doc) => {
    const matchSkill = selectedSkill === "ALL" || doc.skill === selectedSkill || doc.skill === "ALL";
    const matchBand = selectedBand === "ALL" || doc.targetBand === selectedBand || doc.targetBand === "ALL";
    const matchSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSkill && matchBand && matchSearch;
  });

  const filteredVideos = VIDEOS_DATA.filter((vid) => {
    const matchSkill = selectedSkill === "ALL" || vid.skill === selectedSkill;
    const matchBand = selectedBand === "ALL" || vid.targetBand === selectedBand || vid.targetBand === "ALL";
    const matchSearch =
      vid.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vid.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vid.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSkill && matchBand && matchSearch;
  });

  const handleDownload = (doc: DocumentItem) => {
    setDownloadSuccessModal(doc);
    // Tạo tệp tải về giả lập
    const dummyContent = `# ${doc.title}\n\nHệ thống Luyện thi & Khảo thí APTIS ESOL PREMIER\nTài liệu học tập chính thức dành cho học viên ôn luyện Aptis ESOL.\nTrang: ${doc.pages}\nKích thước: ${doc.fileSize}\n\nChúc bạn ôn tập tốt và đạt mục tiêu Band ${doc.targetBand}!`;
    const blob = new Blob([dummyContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-b border-border py-12 md:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-20 -right-20"
            style={{ width: "380px", height: "380px", background: "hsl(var(--primary) / 0.25)" }}
          />

          <div className="section-container relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary w-fit text-xs font-bold mb-4">
                <BookOpen className="w-4 h-4" />
                <span>Kho học liệu độc quyền Aptis ESOL</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight mb-4">
                Kho Tài Liệu PDF & <span className="gradient-text">Video Bài Giảng</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                Tuyển tập đầy đủ tài liệu ôn thi 4 kỹ năng chuẩn British Council, bộ đề thi thật cập nhật liên tục và các bài giảng phân tích chiến thuật giúp học viên bứt phá Band B2 và C cấp tốc.
              </p>

              {/* Tabs Switcher */}
              <div className="inline-flex p-1.5 rounded-2xl bg-muted/80 border border-border backdrop-blur-sm gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("docs")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "docs"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Tài Liệu PDF & Ebook ({DOCUMENTS_DATA.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("videos")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "videos"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Video Bài Giảng Kỹ Năng ({VIDEOS_DATA.length})</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-30">
          <div className="section-container py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={activeTab === "docs" ? "Tìm kiếm tài liệu PDF..." : "Tìm kiếm video bài giảng..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-muted-foreground">Kỹ năng:</span>
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "SPEAKING", label: "Speaking" },
                { id: "WRITING", label: "Writing" },
                { id: "READING", label: "Reading" },
                { id: "LISTENING", label: "Listening" },
                { id: "GRAMMAR", label: "Grammar" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSkill(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedSkill === s.id
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}

              <div className="h-4 w-[1px] bg-border mx-1" />

              <span className="text-xs font-semibold text-muted-foreground">Mục tiêu:</span>
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "B1", label: "B1" },
                { id: "B2", label: "B2" },
                { id: "C", label: "Band C" },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBand(b.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedBand === b.id
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="section-container py-10">
          {activeTab === "docs" ? (
            /* TAB 1: TÀI LIỆU PDF */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-primary/40 relative overflow-hidden"
                >
                  {doc.isVip && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>VIP MEMBER</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {doc.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent ml-1.5">
                          Band {doc.targetBand}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-heading font-bold text-base text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                      {doc.description}
                    </p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span>{doc.pages} trang · {doc.fileSize}</span>
                      <span>{doc.downloadsCount.toLocaleString()} lượt tải</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải tài liệu PDF</span>
                    </button>
                  </div>
                </div>
              ))}
              {filteredDocs.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">Không tìm thấy tài liệu phù hợp với bộ lọc</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSkill("ALL");
                      setSelectedBand("ALL");
                      setSearchTerm("");
                    }}
                    className="mt-3 text-xs text-primary font-bold hover:underline"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: VIDEO BÀI GIẢNG */
            <div className="grid md:grid-cols-2 gap-6">
              {filteredVideos.map((vid) => (
                <div
                  key={vid.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                    <div className="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform z-20 cursor-pointer"
                      onClick={() => setSelectedVideo(vid)}
                    >
                      <Play className="w-6 h-6 ml-1 fill-white" />
                    </div>

                    <div className="absolute top-3 left-3 z-20 flex gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md">
                        {vid.skill}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent text-white">
                        Band {vid.targetBand}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 z-20 text-[11px] font-mono font-bold bg-black/70 text-white px-2 py-0.5 rounded">
                      {vid.duration}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>{vid.speaker}</span>
                      </div>
                      <h3
                        onClick={() => setSelectedVideo(vid)}
                        className="font-heading font-bold text-base text-foreground mb-2 hover:text-primary transition-colors cursor-pointer"
                      >
                        {vid.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                        {vid.description}
                      </p>
                    </div>

                    <div className="border-t border-border pt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{vid.views.toLocaleString()} lượt xem</span>
                      <button
                        type="button"
                        onClick={() => setSelectedVideo(vid)}
                        className="text-xs font-bold text-primary hover:text-primary-glow flex items-center gap-1"
                      >
                        <span>Xem bài giảng</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA Banner */}
        <section className="section-container pb-16">
          <div className="rounded-3xl p-8 md:p-10 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 border border-primary/20 text-center relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                Sẵn sàng kiểm tra năng lực với Đề Thi Thử Chuẩn Hội Đồng?
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Áp dụng ngay các chiến thuật và từ vựng vừa học vào phòng thi thử 162 phút với giao diện mô phỏng 100% phần mềm máy tính British Council.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/thi-thu"
                  className="px-6 py-3 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  Vào phòng thi thử ngay
                </Link>
                <Link
                  href="/bang-ky-tich"
                  className="px-6 py-3 rounded-full text-sm font-bold border border-border bg-card hover:bg-muted text-foreground transition-all"
                >
                  Xem bài mẫu Bảng Kỳ Tích
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL DOWNLOAD THÀNH CÔNG */}
      {downloadSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setDownloadSuccessModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-lg text-foreground">
                Tải tài liệu thành công!
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                {downloadSuccessModal.title}
              </p>
            </div>

            <div className="rounded-xl p-3.5 bg-muted/60 text-xs text-muted-foreground space-y-1">
              <p>• Dung lượng: {downloadSuccessModal.fileSize}</p>
              <p>• Định dạng: PDF / Sách điện tử ôn thi độc quyền</p>
              <p>• Bạn có thể xem ngay trên máy tính hoặc in ra giấy để tiện ôn luyện.</p>
            </div>

            <button
              type="button"
              onClick={() => setDownloadSuccessModal(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            >
              Đã hiểu & Tiếp tục học
            </button>
          </div>
        </div>
      )}

      {/* MODAL XEM VIDEO BÀI GIẢNG */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-border flex items-center justify-between bg-card">
              <div>
                <h3 className="font-heading font-bold text-sm md:text-base text-foreground line-clamp-1">
                  {selectedVideo.title}
                </h3>
                <p className="text-xs text-primary font-medium">{selectedVideo.speaker}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.videoEmbedId}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-4 bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
              <span>Thời lượng: {selectedVideo.duration} · {selectedVideo.views.toLocaleString()} lượt học</span>
              <Link
                href="/thi-thu"
                className="font-bold text-primary hover:underline flex items-center gap-1"
              >
                Làm bài tập ứng dụng ngay
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <FloatingActions />
      <Footer />
    </div>
  );
}
