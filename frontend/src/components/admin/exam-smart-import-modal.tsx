"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  Sparkles,
  Layers,
  RefreshCw,
  Eye,
  Info,
  ChevronRight,
  Volume2,
  Play,
  Square,
  Image as ImageIcon,
  Check,
  Search,
  Filter,
  Headphones,
  BookOpen,
  Mic,
  PenTool,
  Edit3,
  Save,
  Clock,
  HelpCircle,
  Trash2,
  PlusCircle,
  ExternalLink,
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

  // Inspector & Filter States
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSkill, setFilterSkill] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "VALID" | "INVALID">("ALL");

  // TTS State
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);

  // Inline Image Attachment State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);

  // Inline Passage Text Edit State
  const [isEditingPassage, setIsEditingPassage] = useState(false);
  const [tempPassageText, setTempPassageText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      resetState();
    } else {
      stopTts();
    }
    return () => {
      stopTts();
    };
  }, [isOpen]);

  const stopTts = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
    }
  };

  const resetState = () => {
    setActiveStep(1);
    setSelectedFile(null);
    setValidationResult(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setSelectedExamId(null);
    setSelectedExamIds(new Set());
    setSearchQuery("");
    setFilterSkill("ALL");
    setFilterStatus("ALL");
    stopTts();
    setIsEditingPassage(false);
  };

  const loadTemplates = async () => {
    try {
      const res: any = await api.admin.getImportTemplates();
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : null;
      if (list && list.length > 0) {
        setTemplates(list);
        return;
      }
    } catch (e) {
      // Fallback
    }
    setTemplates([
      {
        name: "Mẫu đề Speaking Part 2 & Part 3 (.docx)",
        description: "Mẫu Word thuận tiện cho các bài thi miêu tả tranh và so sánh đối chiếu có bảng từ vựng song ngữ.",
        fileName: "Mau_Nhap_De_Speaking_Part2_Part3.docx",
        downloadUrl: "/templates/Mau_Nhap_De_Speaking_Part2_Part3.docx",
        fileType: "DOCX",
        size: "38 KB",
      },
      {
        name: "Mẫu đề Writing 4 Parts (.docx)",
        description: "Mẫu Word chuẩn cho bài thi Viết 4 phần: Điền form, Viết ngắn, Chat nhóm câu lạc bộ và Viết thư/Email.",
        fileName: "Mau_Nhap_De_Writing.docx",
        downloadUrl: "/templates/Mau_Nhap_De_Writing.docx",
        fileType: "DOCX",
        size: "36 KB",
      },
      {
        name: "Mẫu đề Reading & Listening (.xlsx)",
        description: "Mẫu bảng tính Excel nhanh cho bài đọc hiểu và trắc nghiệm câu hỏi nghe kèm đáp án và giải thích.",
        fileName: "Mau_Nhap_De_Reading_Listening.xlsx",
        downloadUrl: "/templates/Mau_Nhap_De_Reading_Listening.xlsx",
        fileType: "XLSX",
        size: "6 KB",
      },
    ]);
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
      // Mặc định chọn tất cả các đề hợp lệ để import
      const validIds = new Set<string>();
      res.exams.forEach((ex: ValidatedExamItem) => {
        if (ex.isValid) validIds.add(ex.idTemp);
      });
      setSelectedExamIds(validIds);
      if (res.exams.length > 0) {
        setSelectedExamId(res.exams[0].idTemp);
      }
      setActiveStep(2); // Sang màn hình Phòng Kiểm Định Studio
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kiểm định tập tin. Vui lòng kiểm tra lại định dạng.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleLoadDemo = () => {
    const demoExams: ValidatedExamItem[] = [
      {
        idTemp: "demo_listening_1",
        title: "Listening Part 1: Conversation at the Railway Station",
        skill: "LISTENING",
        partNumber: 1,
        topic: "Đặt vé tàu và tìm sân ga (Travel & Transport)",
        passageText:
          "Man: Excuse me, could you tell me if this train stops at Oxford Station?\nWoman: No, this is the fast express service to Birmingham. You need platform 4 for the local stopping service via Oxford. It departs at quarter past three.\nMan: Quarter past three? Great, thank you so much for your help!",
        imageUrls: [],
        vocabulary: [
          { en: "express service", vi: "tàu chạy nhanh / tốc hành" },
          { en: "platform", vi: "sân ga / đường ray số" },
          { en: "quarter past three", vi: "3 giờ 15 phút" },
        ],
        questions: [
          {
            questionNumber: 1,
            prompt: "Where does the passenger want to travel to?",
            questionType: "MULTIPLE_CHOICE",
            options: ["London", "Oxford", "Birmingham", "Manchester"],
            correctAnswer: "Oxford",
            explanation: "Hành khách hỏi: 'Does this train stop at Oxford Station?'.",
          },
          {
            questionNumber: 2,
            prompt: "Which platform should the passenger go to?",
            questionType: "MULTIPLE_CHOICE",
            options: ["Platform 1", "Platform 2", "Platform 3", "Platform 4"],
            correctAnswer: "Platform 4",
            explanation: "Nhân viên hướng dẫn: 'You need platform 4 for the local stopping service'.",
          },
          {
            questionNumber: 3,
            prompt: "What time does the train depart?",
            questionType: "MULTIPLE_CHOICE",
            options: ["3:00 PM", "3:15 PM", "3:30 PM", "3:45 PM"],
            correctAnswer: "3:15 PM",
            explanation: "'Quarter past three' tương đương 3:15 chiều.",
          },
        ],
        isValid: true,
        errors: [],
        warnings: [],
      },
      {
        idTemp: "demo_reading_1",
        title: "Reading Part 2: Sustainable Urban Architecture",
        skill: "READING",
        partNumber: 2,
        topic: "Kiến trúc xanh & Năng lượng tái tạo",
        passageText:
          "Renewable energy has become increasingly vital in modern urban planning. Solar panels and wind turbines are now standard elements in sustainable architectural designs, cutting municipal carbon emissions by up to 40%. Cities that have adopted these green standards also report significant reductions in overall public health expenditures.",
        imageUrls: [],
        vocabulary: [
          { en: "renewable energy", vi: "năng lượng tái tạo" },
          { en: "carbon emissions", vi: "lượng khí thải carbon" },
          { en: "sustainable design", vi: "thiết kế bền vững" },
        ],
        questions: [
          {
            questionNumber: 1,
            prompt: "What are now standard elements in sustainable architectural designs?",
            questionType: "MULTIPLE_CHOICE",
            options: [
              "Fossil fuel generators",
              "Solar panels and wind turbines",
              "Traditional coal furnaces",
              "Underground oil tanks",
            ],
            correctAnswer: "Solar panels and wind turbines",
            explanation: "Đoạn văn nêu rõ: 'Solar panels and wind turbines are now standard elements'.",
          },
          {
            questionNumber: 2,
            prompt: "By how much can municipal carbon emissions be reduced?",
            questionType: "MULTIPLE_CHOICE",
            options: ["Up to 10%", "Up to 25%", "Up to 40%", "Over 80%"],
            correctAnswer: "Up to 40%",
            explanation: "Đoạn văn ghi nhận: 'cutting municipal carbon emissions by up to 40%'.",
          },
        ],
        isValid: true,
        errors: [],
        warnings: [],
      },
      {
        idTemp: "demo_speaking_1",
        title: "Speaking Part 2: Describing a Daily Routine at the Library",
        skill: "SPEAKING",
        partNumber: 2,
        topic: "Thói quen đọc sách & Không gian học tập",
        imageUrls: ["/uploads/exams/speaking/sample_library.jpg"],
        vocabulary: [
          { en: "quiet atmosphere", vi: "không khí yên tĩnh" },
          { en: "concentrate on studies", vi: "tập trung vào việc học" },
          { en: "digital resources", vi: "tài nguyên số hóa" },
        ],
        questions: [
          {
            questionNumber: 1,
            prompt: "Describe what you see in the picture.",
            questionType: "SPEAKING_AUDIO",
          },
          {
            questionNumber: 2,
            prompt: "Tell me about the last time you visited a quiet place like this.",
            questionType: "SPEAKING_AUDIO",
          },
          {
            questionNumber: 3,
            prompt: "Do you think digital books will completely replace physical libraries in the future? Why or why not?",
            questionType: "SPEAKING_AUDIO",
          },
        ],
        isValid: true,
        errors: [],
        warnings: [],
      },
      {
        idTemp: "demo_speaking_2_invalid",
        title: "Speaking Part 3: Two Types of Weekend Activities (Thiếu ảnh minh họa)",
        skill: "SPEAKING",
        partNumber: 3,
        topic: "So sánh hoạt động cá nhân và hoạt động nhóm",
        imageUrls: ["/uploads/exams/speaking/sample_hiking.jpg"],
        vocabulary: [
          { en: "outdoor adventure", vi: "chuyến phiêu lưu ngoài trời" },
          { en: "team bonding", vi: "gắn kết đồng đội" },
        ],
        questions: [
          {
            questionNumber: 1,
            prompt: "Tell me what you see in the two pictures.",
            questionType: "SPEAKING_AUDIO",
          },
          {
            questionNumber: 2,
            prompt: "Which of these two activities do you prefer to do on your day off?",
            questionType: "SPEAKING_AUDIO",
          },
          {
            questionNumber: 3,
            prompt: "Why is it important for people to spend time participating in group activities?",
            questionType: "SPEAKING_AUDIO",
          },
        ],
        isValid: false,
        errors: ["Thiếu hình ảnh: Part 3 yêu cầu 2 ảnh (Hiện chỉ có 1 ảnh)."],
        warnings: [],
      },
      {
        idTemp: "demo_writing_1",
        title: "Writing Part 3: Photography Club Chat Room",
        skill: "WRITING",
        partNumber: 3,
        topic: "Thảo luận về thiết bị máy ảnh và kỹ thuật chụp ảnh",
        passageText:
          "Welcome to the Photography Club chat room! Today our topic is: 'How do you choose your camera equipment?' Share your thoughts with other members.",
        imageUrls: [],
        vocabulary: [
          { en: "camera gear", vi: "thiết bị máy ảnh" },
          { en: "focal length", vi: "tiêu cự ống kính" },
          { en: "composition", vi: "bố cục khung hình" },
        ],
        questions: [
          {
            questionNumber: 1,
            prompt: "Member Sam: Hi! How long have you been interested in photography?",
            questionType: "ESSAY",
          },
          {
            questionNumber: 2,
            prompt: "Member Linda: What camera or smartphone do you currently use to take pictures?",
            questionType: "ESSAY",
          },
          {
            questionNumber: 3,
            prompt: "Member Alex: A member suggested organizing an outdoor sunrise photo trip this Sunday. What do you think?",
            questionType: "ESSAY",
          },
        ],
        isValid: true,
        errors: [],
        warnings: [],
      },
    ];

    const validIds = new Set<string>();
    demoExams.forEach((e) => {
      if (e.isValid) validIds.add(e.idTemp);
    });

    setValidationResult({
      fileName: "Bo_De_Kiem_Tra_Chuan_Mau.xlsx",
      fileType: "XLSX",
      totalFound: demoExams.length,
      validCount: demoExams.filter((e) => e.isValid).length,
      invalidCount: demoExams.filter((e) => !e.isValid).length,
      exams: demoExams,
    });
    setSelectedExamIds(validIds);
    setSelectedExamId(demoExams[0].idTemp);
    setActiveStep(2);
  };

  // Lọc danh sách đề thi theo tìm kiếm, kỹ năng, và trạng thái
  const filteredExams = useMemo(() => {
    if (!validationResult) return [];
    return validationResult.exams.filter((item) => {
      // Skill filter
      if (filterSkill !== "ALL" && item.skill.toUpperCase() !== filterSkill.toUpperCase()) {
        return false;
      }
      // Status filter
      if (filterStatus === "VALID" && !item.isValid) return false;
      if (filterStatus === "INVALID" && item.isValid) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchTopic = item.topic.toLowerCase().includes(q);
        const matchQuestions = item.questions.some((qu) => qu.prompt.toLowerCase().includes(q));
        if (!matchTitle && !matchTopic && !matchQuestions) return false;
      }
      return true;
    });
  }, [validationResult, filterSkill, filterStatus, searchQuery]);

  // Đề thi hiện đang được soi chi tiết
  const currentExam = useMemo(() => {
    if (!validationResult || validationResult.exams.length === 0) return null;
    if (!selectedExamId) return validationResult.exams[0];
    return validationResult.exams.find((e) => e.idTemp === selectedExamId) || validationResult.exams[0];
  }, [validationResult, selectedExamId]);

  // Đảm bảo selectedExamId luôn có giá trị hợp lệ khi chuyển tab
  useEffect(() => {
    if (filteredExams.length > 0) {
      const exists = filteredExams.some((e) => e.idTemp === selectedExamId);
      if (!exists) {
        setSelectedExamId(filteredExams[0].idTemp);
      }
    }
  }, [filteredExams, selectedExamId]);

  // Đồng bộ passage text khi đổi đề đang xem
  useEffect(() => {
    if (currentExam) {
      setTempPassageText(currentExam.passageText || "");
      setIsEditingPassage(false);
      stopTts();
    }
  }, [currentExam?.idTemp]);

  // Toggle chọn 1 đề để lưu
  const toggleSelectExam = (idTemp: string) => {
    setSelectedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(idTemp)) {
        next.delete(idTemp);
      } else {
        next.add(idTemp);
      }
      return next;
    });
  };

  // Toggle chọn tất cả đề hợp lệ
  const toggleSelectAllFiltered = () => {
    const validFilteredIds = filteredExams.filter((e) => e.isValid).map((e) => e.idTemp);
    const allSelected = validFilteredIds.every((id) => selectedExamIds.has(id));

    setSelectedExamIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        validFilteredIds.forEach((id) => next.delete(id));
      } else {
        validFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Chức năng Text-to-Speech kiểm tra kịch bản nghe
  const handlePlayTts = (text: string) => {
    if (!("speechSynthesis" in window)) {
      setErrorMsg("Trình duyệt không hỗ trợ Web Speech Synthesis.");
      return;
    }

    if (isPlayingTts) {
      stopTts();
      return;
    }

    if (!text || text.trim().length === 0) {
      setErrorMsg("Bài thi chưa có kịch bản âm thanh để phát.");
      return;
    }

    stopTts();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsSpeed;
    utterance.lang = "en-US";

    // Tìm giọng đọc tiếng Anh
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en-GB") || v.lang.startsWith("en_GB")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setIsPlayingTts(false);
    };

    utterance.onerror = () => {
      setIsPlayingTts(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlayingTts(true);
  };

  // Thay đổi đáp án đúng trực tiếp cho câu hỏi trắc nghiệm
  const handleChangeCorrectAnswer = (questionIndex: number, newOptionValue: string) => {
    if (!validationResult || !currentExam) return;

    const updatedExams = validationResult.exams.map((exam) => {
      if (exam.idTemp !== currentExam.idTemp) return exam;

      const updatedQuestions = [...exam.questions];
      const targetQ = { ...updatedQuestions[questionIndex], correctAnswer: newOptionValue };
      updatedQuestions[questionIndex] = targetQ;

      // Re-evaluate errors for this exam
      const newErrors = exam.errors.filter(
        (err) => !err.includes(`Hàng ${questionIndex + 2}: Thiếu đáp án đúng`)
      );

      const isValid = newErrors.length === 0;

      return {
        ...exam,
        questions: updatedQuestions,
        errors: newErrors,
        isValid,
      };
    });

    const validCount = updatedExams.filter((e) => e.isValid).length;
    setValidationResult({
      ...validationResult,
      exams: updatedExams,
      validCount,
      invalidCount: updatedExams.length - validCount,
    });

    // Tự động chọn đề này nếu nó vừa trở thành hợp lệ
    const updatedExam = updatedExams.find((e) => e.idTemp === currentExam.idTemp);
    if (updatedExam?.isValid) {
      setSelectedExamIds((prev) => new Set(prev).add(updatedExam.idTemp));
    }
  };

  // Lưu chỉnh sửa kịch bản / đoạn văn
  const handleSavePassageText = () => {
    if (!validationResult || !currentExam) return;

    const updatedExams = validationResult.exams.map((exam) => {
      if (exam.idTemp !== currentExam.idTemp) return exam;
      return {
        ...exam,
        passageText: tempPassageText,
      };
    });

    setValidationResult({
      ...validationResult,
      exams: updatedExams,
    });
    setIsEditingPassage(false);
  };

  // Tải ảnh gắn trực tiếp inline cho đề Speaking
  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentExam || !validationResult) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);
    setErrorMsg(null);

    try {
      const res = await api.admin.uploadImportImage(file);
      const newImageUrl = res.url;

      const updatedExams = validationResult.exams.map((exam) => {
        if (exam.idTemp !== currentExam.idTemp) return exam;

        const newImageUrls = [...exam.imageUrls, newImageUrl];
        const requiredImages = exam.partNumber === 3 ? 2 : 1;

        // Nếu đã đủ ảnh thì xóa lỗi thiếu hình ảnh
        const newErrors =
          newImageUrls.length >= requiredImages
            ? exam.errors.filter((err) => !err.includes("Thiếu hình ảnh"))
            : exam.errors;

        const isValid = newErrors.length === 0;

        return {
          ...exam,
          imageUrls: newImageUrls,
          errors: newErrors,
          isValid,
        };
      });

      const validCount = updatedExams.filter((ex) => ex.isValid).length;
      setValidationResult({
        ...validationResult,
        exams: updatedExams,
        validCount,
        invalidCount: updatedExams.length - validCount,
      });

      const updatedCurrent = updatedExams.find((ex) => ex.idTemp === currentExam.idTemp);
      if (updatedCurrent?.isValid) {
        setSelectedExamIds((prev) => new Set(prev).add(updatedCurrent.idTemp));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể tải ảnh lên.");
    } finally {
      setIsUploadingImage(false);
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = "";
    }
  };

  // Xóa ảnh khỏi đề thi Speaking
  const handleRemoveImage = (imgIdx: number) => {
    if (!validationResult || !currentExam) return;

    const updatedExams = validationResult.exams.map((exam) => {
      if (exam.idTemp !== currentExam.idTemp) return exam;

      const newImageUrls = exam.imageUrls.filter((_, idx) => idx !== imgIdx);
      const requiredImages = exam.partNumber === 3 ? 2 : 1;
      const errors = [...exam.errors];

      if (newImageUrls.length < requiredImages) {
        if (!errors.some((err) => err.includes("Thiếu hình ảnh"))) {
          errors.push(
            `Thiếu hình ảnh: Part ${exam.partNumber} yêu cầu ${requiredImages} ảnh (Hiện có ${newImageUrls.length} ảnh).`
          );
        }
      }

      return {
        ...exam,
        imageUrls: newImageUrls,
        errors,
        isValid: errors.length === 0,
      };
    });

    const validCount = updatedExams.filter((ex) => ex.isValid).length;
    setValidationResult({
      ...validationResult,
      exams: updatedExams,
      validCount,
      invalidCount: updatedExams.length - validCount,
    });
  };

  // Lưu các đề đã chọn vào hệ thống
  const handleConfirmSave = async () => {
    if (!validationResult) return;

    // Lọc danh sách đề được chọn và hợp lệ
    const examsToSave = validationResult.exams.filter(
      (e) => e.isValid && selectedExamIds.has(e.idTemp)
    );

    if (examsToSave.length === 0) {
      setErrorMsg("Vui lòng tích chọn ít nhất 1 đề thi hợp lệ để lưu vào hệ thống.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    stopTts();

    try {
      const res = await api.admin.confirmImportExams(examsToSave);
      const count = res.data?.count ?? (res as any)?.count ?? examsToSave.length;
      setSuccessMsg(`Đã nhập thành công ${count} đề thi chuẩn vào hệ thống!`);
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

  // Số lượng đề hợp lệ đang được chọn
  const selectedValidCount = validationResult
    ? validationResult.exams.filter((e) => e.isValid && selectedExamIds.has(e.idTemp)).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 ${
          activeStep === 2
            ? "max-w-[96vw] xl:max-w-7xl h-[94vh]"
            : "max-w-4xl max-h-[90vh]"
        }`}
      >
        {/* HEADER */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-purple-50/60 dark:from-slate-800/80 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {activeStep === 2
                    ? "Phòng Kiểm Định & Soi Chi Tiết Đề Thi (Exam Studio)"
                    : "Tải lên đề thi từ Word & Excel"}
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  Chuẩn Doanh nghiệp
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeStep === 2
                  ? "Nghe thử kịch bản audio, kiểm tra tranh Speaking, rà soát đáp án trắc nghiệm trước khi nhập vào hệ thống"
                  : "Tự động nhận diện cấu trúc, bóc tách câu hỏi, hình ảnh và từ vựng song ngữ"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopTts();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-medium shrink-0">
          <div
            onClick={() => {
              stopTts();
              setActiveStep(1);
            }}
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
            <span>1. Chọn mẫu & Tải file</span>
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
            <span>2. Soi chi tiết & Kiểm định chất lượng</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div
            className={`flex items-center gap-2 opacity-50 ${
              activeStep === 3 ? "text-emerald-600 dark:text-emerald-400 font-bold opacity-100" : "text-slate-500"
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
            <span>3. Hoàn tất & Lưu đề</span>
          </div>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* BODY CONTENT */}
        {/* ======================================================== */}

        {/* STEP 1: DOWNLOAD TEMPLATE & UPLOAD */}
        {activeStep === 1 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* SECTION: TẢI FILE MẪU */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" />
                Bước 1: Tải file mẫu tham khảo (nếu chưa có định dạng)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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
                        <div className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
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
                        Tải mẫu này
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION: GỢI Ý ĐỊNH DẠNG WORD */}
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/50">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                Gợi ý định dạng nhanh cho file Word (.docx) Speaking & Writing:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <span className="font-bold text-blue-600">=== [ĐỀ MỚI] ===</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Đánh dấu bắt đầu một đề thi mới</p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <span className="font-bold text-blue-600">[PHẦN THI]:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Speaking Part 2-3 / Writing Part 1-4</p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <span className="font-bold text-blue-600">[HÌNH ẢNH / NGỮ CẢNH]:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Chèn ảnh (Speaking) hoặc Thông báo (Writing)</p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <span className="font-bold text-blue-600">[TỪ VỰNG]:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Bảng từ vựng song ngữ (Anh - Việt)</p>
                </div>
              </div>
            </div>

            {/* SECTION: DROPZONE UPLOAD */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                Bước 2: Tải file đề thi lên
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
                      ? "Đang phân tích cấu trúc và kiểm định dữ liệu..."
                      : "Kéo thả file vào đây hoặc bấm để chọn từ máy tính"}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hỗ trợ file <span className="font-semibold text-blue-600">.docx</span> (Speaking,
                    Writing kèm ảnh) và <span className="font-semibold text-emerald-600">.xlsx</span>{" "}
                    (Reading, Listening)
                  </p>
                </div>
              </div>

              {/* DEMO STUDIO BUTTON */}
              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>⚡ Trải nghiệm ngay phòng kiểm định với bộ đề mẫu (Demo Studio)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ENTERPRISE EXAM INSPECTION STUDIO */}
        {activeStep === 2 && validationResult && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
            {/* ---------------------------------------------------- */}
            {/* LEFT COLUMN: EXAM NAVIGATOR (SIDEBAR) */}
            {/* ---------------------------------------------------- */}
            <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/60 dark:bg-slate-900/60 shrink-0 min-h-0">
              {/* TOP STATS & SEARCH */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
                {/* File info pill */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {validationResult.fileType === "DOCX" ? (
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    <span className="truncate max-w-[180px]">{validationResult.fileName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {validationResult.validCount} hợp lệ
                    </span>
                    {validationResult.invalidCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        {validationResult.invalidCount} lỗi
                      </span>
                    )}
                  </div>
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo chủ đề, câu hỏi..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Skill Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-semibold no-scrollbar">
                  {[
                    { key: "ALL", label: "Tất cả" },
                    { key: "LISTENING", label: "Listening" },
                    { key: "READING", label: "Reading" },
                    { key: "SPEAKING", label: "Speaking" },
                    { key: "WRITING", label: "Writing" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilterSkill(tab.key)}
                      className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                        filterSkill === tab.key
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Status Toggle & Select All */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80 text-[11px]">
                  <button
                    onClick={toggleSelectAllFiltered}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Chọn tất cả ({filteredExams.filter((e) => e.isValid).length} hợp lệ)
                  </button>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <button
                      onClick={() => setFilterStatus("ALL")}
                      className={`px-1.5 py-0.5 rounded ${
                        filterStatus === "ALL" ? "font-bold text-slate-800 dark:text-white" : ""
                      }`}
                    >
                      Tất cả
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setFilterStatus("INVALID")}
                      className={`px-1.5 py-0.5 rounded text-rose-600 ${
                        filterStatus === "INVALID" ? "font-bold underline" : ""
                      }`}
                    >
                      Lỗi ({validationResult.invalidCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* LIST OF EXAMS (SCROLLABLE) */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredExams.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Không tìm thấy đề thi phù hợp với bộ lọc.
                  </div>
                ) : (
                  filteredExams.map((item, idx) => {
                    const isSelectedExam = currentExam?.idTemp === item.idTemp;
                    const isChecked = selectedExamIds.has(item.idTemp);

                    return (
                      <div
                        key={item.idTemp}
                        onClick={() => setSelectedExamId(item.idTemp)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelectedExam
                            ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-500/30"
                            : item.isValid
                            ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                            : "border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-300"
                        }`}
                      >
                        {/* CHECKBOX */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectExam(item.idTemp);
                          }}
                          className="pt-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by div
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                item.skill.toUpperCase() === "LISTENING"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                  : item.skill.toUpperCase() === "READING"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : item.skill.toUpperCase() === "SPEAKING"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {item.skill} P{item.partNumber}
                            </span>

                            {item.isValid ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold ml-auto">
                                <CheckCircle2 className="w-3 h-3" /> Hợp lệ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-600 font-semibold ml-auto">
                                <XCircle className="w-3 h-3" /> {item.errors.length} lỗi
                              </span>
                            )}
                          </div>

                          <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                            {item.title}
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{item.questions.length} câu hỏi</span>
                            {item.imageUrls.length > 0 && <span>• {item.imageUrls.length} ảnh</span>}
                            {item.vocabulary.length > 0 && <span>• {item.vocabulary.length} từ</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* RIGHT COLUMN: LIVE SIMULATOR & DEEP INSPECTOR */}
            {/* ---------------------------------------------------- */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-900 flex flex-col space-y-6">
              {currentExam ? (
                <>
                  {/* TOP BANNER OF CURRENT EXAM */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-slate-50/50 to-white dark:from-slate-800/60 dark:to-slate-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                          currentExam.skill.toUpperCase() === "LISTENING"
                            ? "bg-purple-600 text-white"
                            : currentExam.skill.toUpperCase() === "READING"
                            ? "bg-emerald-600 text-white"
                            : currentExam.skill.toUpperCase() === "SPEAKING"
                            ? "bg-blue-600 text-white"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        {currentExam.skill.toUpperCase() === "LISTENING" ? (
                          <Headphones className="w-6 h-6" />
                        ) : currentExam.skill.toUpperCase() === "READING" ? (
                          <BookOpen className="w-6 h-6" />
                        ) : currentExam.skill.toUpperCase() === "SPEAKING" ? (
                          <Mic className="w-6 h-6" />
                        ) : (
                          <PenTool className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base text-slate-900 dark:text-white">
                            {currentExam.title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {currentExam.skill} — Part {currentExam.partNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Chủ đề: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentExam.topic}</span>
                          {" • "}
                          Thời lượng chuẩn:{" "}
                          <span className="font-semibold">
                            {currentExam.skill.toUpperCase() === "SPEAKING"
                              ? "12 phút"
                              : currentExam.skill.toUpperCase() === "WRITING"
                              ? "50 phút"
                              : "35 phút"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* SELECT FOR IMPORT TOGGLE */}
                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:border-blue-500">
                        <input
                          type="checkbox"
                          checked={selectedExamIds.has(currentExam.idTemp)}
                          onChange={() => toggleSelectExam(currentExam.idTemp)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Đã chọn để nhập</span>
                      </label>
                    </div>
                  </div>

                  {/* VALIDATION STATUS ALERTS */}
                  {currentExam.isValid ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Đề thi hợp lệ:</span> Đã vượt qua toàn bộ quy chuẩn kiểm định (câu hỏi, đáp án, hình ảnh/kịch bản). Sẵn sàng nhập vào ngân hàng đề.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1.5 text-xs text-rose-800 dark:text-rose-300">
                      <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-200">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Đề thi chưa đủ điều kiện nhập ({currentExam.errors.length} vấn đề cần xử lý):</span>
                      </div>
                      <ul className="pl-6 list-disc space-y-1">
                        {currentExam.errors.map((err, eIdx) => (
                          <li key={eIdx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* =================================================== */}
                  {/* SKILL-SPECIFIC INSPECTOR VIEWPORT */}
                  {/* =================================================== */}

                  {/* CASE 1: LISTENING (KỊCH BẢN & PHÁT ÂM THANH TEXT-TO-SPEECH) */}
                  {currentExam.skill.toUpperCase() === "LISTENING" && (
                    <div className="p-5 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/10 space-y-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-purple-950 dark:text-purple-200">
                          <Volume2 className="w-5 h-5 text-purple-600" />
                          <span>Kịch bản âm thanh & Thử nghiệm giọng đọc (Audio Script Simulation)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Speed toggle */}
                          <div className="flex items-center gap-1 text-[11px] font-semibold bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                            <span className="text-slate-400">Tốc độ:</span>
                            <button
                              onClick={() => setTtsSpeed(1.0)}
                              className={`px-1.5 py-0.5 rounded ${
                                ttsSpeed === 1.0 ? "bg-purple-600 text-white" : "text-slate-600"
                              }`}
                            >
                              1.0x
                            </button>
                            <button
                              onClick={() => setTtsSpeed(0.85)}
                              className={`px-1.5 py-0.5 rounded ${
                                ttsSpeed === 0.85 ? "bg-purple-600 text-white" : "text-slate-600"
                              }`}
                            >
                              0.85x
                            </button>
                          </div>

                          {/* Play / Stop Button */}
                          <button
                            onClick={() => handlePlayTts(currentExam.passageText || "")}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl text-white shadow-sm transition-all ${
                              isPlayingTts
                                ? "bg-rose-600 hover:bg-rose-700 animate-pulse"
                                : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/25"
                            }`}
                          >
                            {isPlayingTts ? (
                              <>
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Dừng đọc âm thanh</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>🔊 Nghe thử kịch bản này (TTS Preview)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Passage text box */}
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/60 shadow-inner">
                        {isEditingPassage ? (
                          <div className="space-y-2">
                            <textarea
                              value={tempPassageText}
                              onChange={(e) => setTempPassageText(e.target.value)}
                              rows={4}
                              className="w-full text-xs p-2.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                              placeholder="Nhập kịch bản hội thoại hoặc độc thoại tiếng Anh..."
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setIsEditingPassage(false)}
                                className="px-3 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-100"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={handleSavePassageText}
                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-purple-600 text-white"
                              >
                                Lưu thay đổi
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group relative">
                            <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                              {currentExam.passageText ? (
                                currentExam.passageText
                              ) : (
                                <span className="text-slate-400 italic">
                                  Chưa có kịch bản bài nghe (Passage_Text trong Excel trống). Học viên sẽ nghe file âm thanh gốc.
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setTempPassageText(currentExam.passageText || "");
                                setIsEditingPassage(true);
                              }}
                              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs transition-opacity flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Sửa kịch bản
                            </button>
                          </div>
                        )}
                      </div>

                      {isPlayingTts && (
                        <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 font-semibold animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                          <span>Hệ thống đang phát âm thanh mô phỏng giọng đọc bản xứ Anh - Mỹ...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CASE 2: READING (ĐOẠN VĂN BÀI ĐỌC) */}
                  {currentExam.skill.toUpperCase() === "READING" && (
                    <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-950 dark:text-emerald-200">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                          <span>Đoạn văn bài đọc (Reading Passage)</span>
                        </div>
                        <button
                          onClick={() => {
                            setTempPassageText(currentExam.passageText || "");
                            setIsEditingPassage(!isEditingPassage);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {isEditingPassage ? "Đóng sửa" : "Sửa đoạn văn"}
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 shadow-inner">
                        {isEditingPassage ? (
                          <div className="space-y-2">
                            <textarea
                              value={tempPassageText}
                              onChange={(e) => setTempPassageText(e.target.value)}
                              rows={6}
                              className="w-full text-xs p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
                              placeholder="Nhập nội dung bài đọc..."
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setIsEditingPassage(false)}
                                className="px-3 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-100"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={handleSavePassageText}
                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
                              >
                                Lưu đoạn văn
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                            {currentExam.passageText ? (
                              currentExam.passageText
                            ) : (
                              <span className="text-slate-400 italic">
                                Không có đoạn văn bài đọc cho phần này (Các câu hỏi độc lập ngắn).
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CASE 3: SPEAKING (TRÌNH SOI TRANH & GẮN ẢNH INLINE) */}
                  {currentExam.skill.toUpperCase() === "SPEAKING" && (
                    <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/10 space-y-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-950 dark:text-blue-200">
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                          <span>
                            Hình ảnh minh họa bài thi Speaking (
                            {currentExam.imageUrls.length} / {currentExam.partNumber === 3 ? "2 tranh đối chiếu" : "1 tranh miêu tả"}
                            )
                          </span>
                        </div>

                        {/* Button đính kèm ảnh */}
                        <div>
                          <input
                            ref={inlineImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAttachImage}
                            className="hidden"
                          />
                          <button
                            disabled={isUploadingImage}
                            onClick={() => inlineImageInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                          >
                            {isUploadingImage ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <PlusCircle className="w-3.5 h-3.5" />
                            )}
                            <span>📷 Tải ảnh lên ngay (Gắn trực tiếp)</span>
                          </button>
                        </div>
                      </div>

                      {/* Image Preview Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentExam.imageUrls.map((url, imgIdx) => (
                          <div
                            key={imgIdx}
                            className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 aspect-video flex items-center justify-center shadow-md"
                          >
                            <img
                              src={url}
                              alt={`Speaking photo ${imgIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold">
                              {currentExam.partNumber === 3
                                ? `Tranh ${imgIdx === 0 ? "A" : "B"}`
                                : "Tranh miêu tả"}
                            </div>
                            <button
                              onClick={() => handleRemoveImage(imgIdx)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-rose-700"
                              title="Xóa ảnh này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* Placeholder if missing image */}
                        {currentExam.imageUrls.length < (currentExam.partNumber === 3 ? 2 : 1) && (
                          <div
                            onClick={() => inlineImageInputRef.current?.click()}
                            className="border-2 border-dashed border-rose-300 dark:border-rose-800/80 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                            <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
                              Chưa có ảnh{" "}
                              {currentExam.partNumber === 3 && currentExam.imageUrls.length === 1
                                ? "thứ 2 (Tranh B)"
                                : ""}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Bấm vào đây để tải ảnh đính kèm bổ sung ngay cho đề này mà không cần sửa file Word
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CASE 4: WRITING (NGỮ CẢNH / THÔNG BÁO CÂU LẠC BỘ) */}
                  {currentExam.skill.toUpperCase() === "WRITING" && (
                    <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-amber-950 dark:text-amber-200">
                          <PenTool className="w-5 h-5 text-amber-600" />
                          <span>Ngữ cảnh & Thông báo câu lạc bộ (Writing Prompt / Club Context)</span>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                          Part {currentExam.partNumber}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/60 shadow-inner text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                        {currentExam.passageText ? (
                          currentExam.passageText
                        ) : (
                          <span className="text-slate-400 italic">
                            Chưa có thông báo ngữ cảnh (Áp dụng hướng dẫn chung của đề thi).
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* =================================================== */}
                  {/* QUESTIONS & ANSWERS MATRIX STUDIO */}
                  {/* =================================================== */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-600" />
                        Danh sách câu hỏi & Đáp án chuẩn ({currentExam.questions.length} câu)
                      </h4>
                      <span className="text-xs text-slate-400">
                        Bấm vào đáp án bất kỳ để chuyển đáp án đúng nếu cần sửa
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {currentExam.questions.map((q, qIdx) => {
                        return (
                          <div
                            key={qIdx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 space-y-3"
                          >
                            {/* Question prompt header */}
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {q.questionNumber}
                              </span>
                              <div className="flex-1">
                                <div className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                                  {q.prompt}
                                </div>
                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {q.questionType}
                                </span>
                              </div>
                            </div>

                            {/* Options if Multiple Choice */}
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                                {q.options.map((opt, optIdx) => {
                                  const optLetter = String.fromCharCode(65 + optIdx); // A, B, C, D
                                  const isCorrect =
                                    q.correctAnswer === opt ||
                                    q.correctAnswer === optLetter ||
                                    q.correctAnswer === String(optIdx);

                                  return (
                                    <div
                                      key={optIdx}
                                      onClick={() => handleChangeCorrectAnswer(qIdx, opt)}
                                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center gap-2 ${
                                        isCorrect
                                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm ring-1 ring-emerald-500"
                                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                                      }`}
                                    >
                                      <span
                                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                          isCorrect
                                            ? "bg-emerald-600 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        }`}
                                      >
                                        {optLetter}
                                      </span>
                                      <span className="flex-1 truncate">{opt}</span>
                                      {isCorrect && (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider shrink-0">
                                          <Check className="w-3.5 h-3.5" /> Đúng
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Explanation if present */}
                            {q.explanation && (
                              <div className="ml-8 p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Giải thích đáp án: </span>
                                  {q.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* =================================================== */}
                  {/* BILINGUAL VOCABULARY SECTION */}
                  {/* =================================================== */}
                  {currentExam.vocabulary && currentExam.vocabulary.length > 0 && (
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <span>Bảng từ vựng song ngữ trọng tâm ({currentExam.vocabulary.length} từ)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {currentExam.vocabulary.map((vocab, vIdx) => (
                          <div
                            key={vIdx}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between"
                          >
                            <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                              {vocab.en}
                            </span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                              {vocab.vi}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                  Chọn một đề thi từ cột bên trái để soi chi tiết nội dung.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {activeStep === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Đã Lưu Đề Thi Thành Công!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {successMsg ||
                "Các đề thi chuẩn đã được lưu vào hệ thống và sẵn sàng cho học viên luyện tập."}
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* FOOTER ACTIONS */}
        {/* ======================================================== */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
          {activeStep === 2 ? (
            <button
              onClick={() => {
                stopTts();
                setActiveStep(1);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              ← Chọn file khác
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                stopTts();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Đóng
            </button>

            {activeStep === 2 && (
              <button
                disabled={isSaving || selectedValidCount === 0}
                onClick={handleConfirmSave}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-md transition-all ${
                  isSaving || selectedValidCount === 0
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
                    Lưu {selectedValidCount} đề đã chọn vào hệ thống
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
