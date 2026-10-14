"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api-client";
import {
  X,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  Info,
  ChevronRight,
} from "lucide-react";

interface ExamSmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TemplateItem {
  name: string;
  description: string;
  fileName: string;
  downloadUrl: string;
  fileType: string;
  size: string;
}

interface ValidatedExamItem {
  idTemp: string;
  title: string;
  skill: string;
  partNumber: number;
  topic: string;
  instructions?: string;
  passageText?: string;
  imageUrls: string[];
  vocabulary: { en: string; vi: string }[];
  questions: {
    questionNumber: number;
    prompt: string;
    questionType: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
  }[];
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ValidationResponse {
  fileName: string;
  fileType: "DOCX" | "XLSX";
  totalFound: number;
  validCount: number;
  invalidCount: number;
  exams: ValidatedExamItem[];
}

export default function ExamSmartImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ExamSmartImportModalProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setActiveStep(1);
    setSelectedFile(null);
    setValidationResult(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const loadTemplates = async () => {
    try {
      const res = await api.admin.getImportTemplates();
      if (res && Array.isArray(res)) {
        setTemplates(res);
      }
    } catch (e) {
      // Fallback
      setTemplates([
        {
          name: "Bộ Khung Mẫu Speaking Part 2 & Part 3 (.docx)",
          description: "Mẫu Word chuẩn dành cho các bài thi miêu tả tranh và cặp tranh so sánh đối chiếu có bảng từ vựng song ngữ.",
          fileName: "Mau_Nhap_De_Speaking_Part2_Part3.docx",
          downloadUrl: "/templates/Mau_Nhap_De_Speaking_Part2_Part3.docx",
          fileType: "DOCX",
          size: "38 KB",
        },
        {
          name: "Bộ Khung Mẫu Reading & Listening (.xlsx)",
          description: "Mẫu bảng tính Excel chuẩn dành cho các bài đọc hiểu và trắc nghiệm câu hỏi nghe kèm đáp án và giải thích.",
          fileName: "Mau_Nhap_De_Reading_Listening.xlsx",
          downloadUrl: "/templates/Mau_Nhap_De_Reading_Listening.xlsx",
          fileType: "XLSX",
          size: "6 KB",
        },
      ]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "docx" && ext !== "xlsx" && ext !== "xls") {
      setErrorMsg("Chỉ hỗ trợ tệp Word (.docx) hoặc Excel (.xlsx).");
      return;
    }

    setSelectedFile(file);
    setErrorMsg(null);
    setIsValidating(true);

    try {
      const res = await api.admin.validateImportExamFile(file);
      setValidationResult(res);
      setActiveStep(2); // Sang màn hình xem kết quả kiểm định
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kiểm định tập tin. Vui lòng kiểm tra lại định dạng.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!validationResult || validationResult.validCount === 0) return;

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const validExams = validationResult.exams.filter((e) => e.isValid);
      const res = await api.admin.confirmImportExams(validExams);
      const count = res.data?.count ?? (res as any)?.count ?? validExams.length;
      setSuccessMsg(`Đã nhập thành công ${count} đề thi vào hệ thống!`);
      setActiveStep(3);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi lưu đề thi vào hệ thống.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-slate-800/80 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Nhập Đề Thi Chuẩn Doanh Nghiệp
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Semantic Ingestion
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập đề tự động theo file Word/Excel chuẩn hóa — Kiểm định tự động, không lo lỗi format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
          <div
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              activeStep === 1 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-500"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 1
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              1
            </span>
            <span>Tải File Mẫu & Tải Lên</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div
            onClick={() => validationResult && setActiveStep(2)}
            className={`flex items-center gap-2 ${
              validationResult ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
            } transition-colors ${
              activeStep === 2 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-500"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 2
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              2
            </span>
            <span>Kiểm Định & Xem Trước (Preview)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div
            className={`flex items-center gap-2 opacity-50 ${
              activeStep === 3 ? "text-blue-600 dark:text-blue-400 font-bold opacity-100" : "text-slate-500"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 3
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              3
            </span>
            <span>Hoàn Tất & Lưu</span>
          </div>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: DOWNLOAD TEMPLATE & UPLOAD */}
          {activeStep === 1 && (
            <div className="space-y-6">
              {/* SECTION: TẢI FILE MẪU */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  Bước 1: Tải bộ khung mẫu chuẩn của hệ thống
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((tpl, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            tpl.fileType === "DOCX"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          }`}
                        >
                          {tpl.fileType === "DOCX" ? (
                            <FileText className="w-5 h-5" />
                          ) : (
                            <FileSpreadsheet className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {tpl.name}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {tpl.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-mono">{tpl.size}</span>
                        <a
                          href={tpl.downloadUrl}
                          download={tpl.fileName}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Tải File Mẫu
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: QUY ƯỚC CÁC THẺ */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/50">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Quy ước thẻ chuẩn trong file Word (.docx)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <span className="font-bold text-blue-600">=== [ĐỀ MỚI] ===</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Bắt đầu 1 đề mới</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <span className="font-bold text-blue-600">[PHẦN THI]:</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Speaking Part 2 / 3</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <span className="font-bold text-blue-600">[HÌNH ẢNH]:</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Chèn ảnh trực tiếp</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <span className="font-bold text-blue-600">[TỪ VỰNG]:</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Bảng 2 cột Anh - Việt</p>
                  </div>
                </div>
              </div>

              {/* SECTION: DROPZONE UPLOAD */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  Bước 2: Tải lên tệp đã soạn thảo (.docx hoặc .xlsx)
                </h4>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[0.99]"
                      : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center shadow-inner">
                    {isValidating ? (
                      <RefreshCw className="w-7 h-7 animate-spin" />
                    ) : (
                      <UploadCloud className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isValidating
                        ? "Đang phân tích cấu trúc & kiểm định..."
                        : "Kéo thả file Word/Excel vào đây, hoặc nhấn để chọn"}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Hỗ trợ tập tin: <span className="font-semibold text-blue-600">.docx</span> (Speaking,
                      Writing có kèm ảnh) hoặc <span className="font-semibold text-emerald-600">.xlsx</span>{" "}
                      (Reading, Listening)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VALIDATION RESULTS & PREVIEW */}
          {activeStep === 2 && validationResult && (
            <div className="space-y-6">
              {/* SUMMARY STATS BAR */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500">Tệp đã nạp:</div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    {validationResult.fileType === "DOCX" ? (
                      <FileText className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    )}
                    {validationResult.fileName}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-semibold">
                    Tổng: {validationResult.totalFound} đề
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Hợp lệ: {validationResult.validCount}
                  </div>
                  {validationResult.invalidCount > 0 && (
                    <div className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      Lỗi format: {validationResult.invalidCount}
                    </div>
                  )}
                </div>
              </div>

              {/* LIST OF EXAMS PREVIEW */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Danh sách đề bóc tách được từ tệp:
                </h4>

                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                  {validationResult.exams.map((item, idx) => (
                    <div
                      key={item.idTemp}
                      className={`p-4 rounded-xl border transition-all ${
                        item.isValid
                          ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                          : "border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {/* THUMBNAIL IF SPEAKING */}
                          {item.imageUrls && item.imageUrls.length > 0 ? (
                            <div className="flex gap-1.5 shrink-0">
                              {item.imageUrls.map((url, imgI) => (
                                <img
                                  key={imgI}
                                  src={url}
                                  alt="preview"
                                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                              <Layers className="w-6 h-6" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {idx + 1}. {item.title}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                Part {item.partNumber}
                              </span>
                              {item.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn hợp lệ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-semibold">
                                  <XCircle className="w-3.5 h-3.5" /> Lỗi định dạng
                                </span>
                              )}
                            </div>

                            {/* QUESTIONS PREVIEW */}
                            <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                              {item.questions.map((q, qI) => (
                                <div key={qI} className="line-clamp-1">
                                  <span className="font-semibold text-slate-400 mr-1.5">
                                    Q{q.questionNumber}:
                                  </span>
                                  {q.prompt}
                                </div>
                              ))}
                            </div>

                            {/* VOCABULARY BADGES */}
                            {item.vocabulary && item.vocabulary.length > 0 && (
                              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                  Từ vựng ({item.vocabulary.length}):
                                </span>
                                {item.vocabulary.slice(0, 4).map((v, vI) => (
                                  <span
                                    key={vI}
                                    className="px-1.5 py-0.5 rounded text-[11px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                  >
                                    {v.en}: {v.vi}
                                  </span>
                                ))}
                                {item.vocabulary.length > 4 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{item.vocabulary.length - 4} từ nữa
                                  </span>
                                )}
                              </div>
                            )}

                            {/* ERRORS & WARNINGS */}
                            {item.errors.length > 0 && (
                              <div className="mt-2 p-2 rounded bg-rose-100/70 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs space-y-0.5">
                                {item.errors.map((err, errI) => (
                                  <div key={errI} className="flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{err}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS STATE */}
          {activeStep === 3 && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Nhập Đề Thi Thành Công!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {successMsg || "Toàn bộ các đề thi hợp lệ đã được lưu trữ an toàn trong ngân hàng đề thi."}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          {activeStep === 2 ? (
            <button
              onClick={() => setActiveStep(1)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Chọn Tệp Khác
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Đóng
            </button>

            {activeStep === 2 && (
              <button
                disabled={isSaving || !validationResult || validationResult.validCount === 0}
                onClick={handleConfirmSave}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-md transition-all ${
                  isSaving || !validationResult || validationResult.validCount === 0
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25"
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang lưu vào ngân hàng đề...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Lưu {validationResult?.validCount} Đề Hợp Lệ Vào Hệ Thống
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
