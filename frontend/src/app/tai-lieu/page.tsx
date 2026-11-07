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
  Info,
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

import {
  DocumentItem,
  VideoLesson,
  DOCUMENTS_DATA,
  VIDEOS_DATA,
} from "@/data/documents-data";

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
        {/* Compact Header Web App */}
        <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border-b border-border/80 py-3.5 sm:py-4">
          <div className="section-container relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-foreground">
                Kho Tài Liệu &amp; Video Bài Giảng
              </h1>
              <div className="relative group/info inline-flex items-center">
                <button
                  type="button"
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted cursor-help"
                  aria-label="Thông tin kho tài liệu"
                >
                  <Info className="w-4 h-4" />
                </button>
                <div className="pointer-events-none absolute left-0 top-full mt-1.5 z-50 w-80 max-w-xs rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs p-3 shadow-xl border border-slate-700 opacity-0 group-hover/info:opacity-100 group-hover/info:pointer-events-auto group-focus-within/info:opacity-100 group-focus-within/info:pointer-events-auto transition-all transform origin-top-left leading-relaxed">
                  Tuyển tập đầy đủ tài liệu ôn thi 4 kỹ năng chuẩn British Council, bộ đề thi thật cập nhật liên tục và các video phân tích chiến thuật band B2/C.
                </div>
              </div>
            </div>

            {/* Tabs Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-muted/80 border border-border backdrop-blur-sm gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("docs")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "docs"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF &amp; Ebook ({DOCUMENTS_DATA.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("videos")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "videos"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Video Bài Giảng ({VIDEOS_DATA.length})</span>
              </button>
            </div>
          </div>
        </section>

        <section className="section-container pt-4 pb-12">
          {activeTab === "docs" ? (
            /* TAB 1: TÀI LIỆU PDF */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-primary/40 relative overflow-hidden"
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
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 relative">
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
