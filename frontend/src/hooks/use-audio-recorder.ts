"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api-client";

export type MicPermissionState = "idle" | "requesting" | "granted" | "denied";

export interface AudioRecorderState {
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  volumeLevel: number; // 0 - 100 (dùng cho visualizer sóng âm thật)
  permissionState: MicPermissionState;
  errorMessage: string | null;
  isUploading: boolean;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    recordingDuration: 0,
    audioBlob: null,
    audioUrl: null,
    volumeLevel: 0,
    permissionState: "idle",
    errorMessage: null,
    isUploading: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Phát hiện MIME type tối ưu theo từng trình duyệt (Chrome, Safari, Firefox)
  const getSupportedMimeType = useCallback((): string => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      return "audio/webm";
    }

    const candidateMimes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/aac",
      "audio/ogg;codecs=opus",
    ];

    for (const mime of candidateMimes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }

    return "";
  }, []);

  // Yêu cầu quyền truy cập Microphone
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState((prev) => ({
        ...prev,
        permissionState: "denied",
        errorMessage: "Trình duyệt không hỗ trợ Web Audio. Vui lòng sử dụng Chrome, Edge hoặc Safari.",
      }));
      return false;
    }

    try {
      setState((prev) => ({ ...prev, permissionState: "requesting", errorMessage: null }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
        video: false,
      });

      mediaStreamRef.current = stream;
      setState((prev) => ({ ...prev, permissionState: "granted", errorMessage: null }));
      return true;
    } catch (err: any) {
      let message = "Không thể truy cập Microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Bạn đã từ chối quyền Micro. Hãy nhấp vào biểu tượng ổ khóa cạnh thanh địa chỉ để cấp quyền.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "Không tìm thấy thiết bị Microphone. Vui lòng kết nối micro hoặc tai nghe để thực hiện bài nói.";
      }

      setState((prev) => ({
        ...prev,
        permissionState: "denied",
        errorMessage: message,
      }));
      return false;
    }
  }, []);

  // Xử lý phân tích biên độ âm thanh thời gian thực (Audio Visualizer)
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedVolume = Math.min(100, Math.round((average / 128) * 100));

        setState((prev) => ({ ...prev, volumeLevel: normalizedVolume }));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch {
      // Bỏ qua nếu Web Audio API bị hạn chế
    }
  }, []);

  // Bắt đầu ghi âm thật từ Microphone
  const startRecording = useCallback(
    async (): Promise<boolean> => {
      // Thử dùng micro thật
      let stream = mediaStreamRef.current;
      if (!stream || !stream.active) {
        const granted = await requestPermission();
        if (!granted) {
          return false;
        }
        stream = mediaStreamRef.current;
      }

      if (!stream) {
        setState((prev) => ({
          ...prev,
          isRecording: false,
          errorMessage: "Không thể kết nối Microphone. Vui lòng kiểm tra lại thiết bị.",
        }));
        return false;
      }

      try {
        audioChunksRef.current = [];
        const mimeType = getSupportedMimeType();

        const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        startTimeRef.current = Date.now();
        recorder.start(1000);
        setupAudioAnalyser(stream);

        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
          setState((prev) => ({
            ...prev,
            recordingDuration: Math.round((Date.now() - startTimeRef.current) / 1000),
          }));
        }, 500);

        setState((prev) => ({
          ...prev,
          isRecording: true,
          errorMessage: null,
          audioBlob: null,
          audioUrl: null,
        }));

        return true;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isRecording: false,
          errorMessage: `Không thể bắt đầu ghi âm: ${err.message}`,
        }));
        return false;
      }
    },
    [getSupportedMimeType, requestPermission, setupAudioAnalyser]
  );

  // Dừng ghi âm và trả về Promise chứa { blob, url, duration }
  const stopRecording = useCallback((): Promise<{ blob: Blob | null; url: string | null; duration: number }> => {
    return new Promise((resolve) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === "recording") {
        try {
          if (typeof recorder.requestData === "function") {
            recorder.requestData();
          }
        } catch {
          // ignore
        }
        recorder.onstop = () => {
          const finalMime = recorder.mimeType || "audio/webm";
          const blob = audioChunksRef.current.length > 0
            ? new Blob(audioChunksRef.current, { type: finalMime })
            : null;

          if (!blob || blob.size < 50) {
            setState((prev) => ({
              ...prev,
              isRecording: false,
              audioBlob: null,
              audioUrl: null,
              recordingDuration: 0,
              volumeLevel: 0,
              errorMessage: "Bản thu không có dữ liệu âm thanh. Vui lòng nói to và rõ hơn.",
            }));
            resolve({ blob: null, url: null, duration: 0 });
            return;
          }

          const url = URL.createObjectURL(blob);
          setState((prev) => ({
            ...prev,
            isRecording: false,
            audioBlob: blob,
            audioUrl: url,
            recordingDuration: durationSec,
            volumeLevel: 0,
            errorMessage: null,
          }));

          if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close().catch(() => {});
          }

          resolve({ blob, url, duration: durationSec });
        };

        recorder.stop();
      } else {
        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob: null,
          audioUrl: null,
          recordingDuration: 0,
          volumeLevel: 0,
        }));
        resolve({ blob: null, url: null, duration: 0 });
      }
    });
  }, []);

  // Reset bản thu để nói lại (chỉ cho câu hiện tại)
  const resetRecording = useCallback(() => {
    setState((prev) => ({
      ...prev,
      audioBlob: null,
      audioUrl: null,
      recordingDuration: 0,
      volumeLevel: 0,
      errorMessage: null,
    }));
  }, []);

  // Upload file ghi âm lên Backend API
  const uploadRecording = useCallback(
    async (
      submissionId: string,
      questionId: string,
      token: string,
      blobOverride?: Blob,
      durationOverride?: number
    ): Promise<string | null> => {
      const blobToUpload = blobOverride || state.audioBlob;
      if (!blobToUpload) return null;

      setState((prev) => ({ ...prev, isUploading: true }));

      try {
        const formData = new FormData();
        const ext = blobToUpload.type.includes("mp4")
          ? "mp4"
          : blobToUpload.type.includes("wav")
          ? "wav"
          : "webm";
        formData.append("audio", blobToUpload, `speech_q_${questionId}.${ext}`);
        formData.append("durationSeconds", String(durationOverride || state.recordingDuration || 30));

        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(
          `${apiBaseUrl}/submissions/${submissionId}/answers/${questionId}/audio`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const data = await res.json();
        setState((prev) => ({ ...prev, isUploading: false }));

        if (data.success && data.data?.audioUrl) {
          return data.data.audioUrl;
        } else {
          throw new Error(data.message || "Upload tệp âm thanh thất bại");
        }
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          errorMessage: `Lỗi tải lên máy chủ: ${err.message}`,
        }));
        return null;
      }
    },
    [state.audioBlob, state.recordingDuration]
  );

  // Dọn dẹp stream khi unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    ...state,
    requestPermission,
    startRecording,
    stopRecording,
    resetRecording,
    uploadRecording,
  };
}
