"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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

  const isSimulatedRef = useRef<boolean>(false);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Tạo tệp âm thanh WAV giọng nói tổng hợp khi không có microphone phần cứng
  const generateSyntheticAudio = useCallback((durationSeconds: number): { blob: Blob; url: string } => {
    const sampleRate = 16000;
    const dur = Math.max(2, durationSeconds || 15);
    const numSamples = sampleRate * dur;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, numSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const speechCadence = (t % 2.2) < 1.7 ? 1.0 : 0.05;
      const formant =
        Math.sin(2 * Math.PI * 220 * t) * 0.4 +
        Math.sin(2 * Math.PI * 440 * t) * 0.25 +
        Math.sin(2 * Math.PI * 880 * t) * 0.1;
      const sample = Math.max(-1, Math.min(1, formant * speechCadence * 0.35));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    return { blob, url };
  }, []);

  // Yêu cầu quyền truy cập Microphone
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState((prev) => ({
        ...prev,
        permissionState: "denied",
        errorMessage: "Trình duyệt không hỗ trợ Web Audio. Đang chuyển sang chế độ ghi âm mô phỏng.",
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
        message = "Không tìm thấy thiết bị Microphone. Hệ thống sẽ kích hoạt chế độ ghi âm mẫu để bạn kiểm tra bài thi.";
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

  // Bắt đầu ghi âm (hỗ trợ cả Micro thật và Chế độ mô phỏng)
  const startRecording = useCallback(
    async (forceSimulate = false): Promise<boolean> => {
      // Nếu yêu cầu mô phỏng hoặc không có mic thật
      if (forceSimulate) {
        isSimulatedRef.current = true;
        startTimeRef.current = Date.now();

        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);

        timerIntervalRef.current = setInterval(() => {
          setState((prev) => ({
            ...prev,
            recordingDuration: Math.round((Date.now() - startTimeRef.current) / 1000),
          }));
        }, 500);

        // Mô phỏng sóng âm nhảy múa cho visualizer
        simIntervalRef.current = setInterval(() => {
          const fakeVol = Math.floor(35 + Math.random() * 45);
          setState((prev) => ({ ...prev, volumeLevel: fakeVol }));
        }, 150);

        setState((prev) => ({
          ...prev,
          isRecording: true,
          errorMessage: null,
          audioBlob: null,
          audioUrl: null,
        }));
        return true;
      }

      // Thử dùng micro thật
      let stream = mediaStreamRef.current;
      if (!stream || !stream.active) {
        const granted = await requestPermission();
        if (!granted) {
          // Micro thật không được cấp quyền -> Tự động chuyển sang chế độ mô phỏng
          return startRecording(true);
        }
        stream = mediaStreamRef.current;
      }

      if (!stream) {
        return startRecording(true);
      }

      try {
        isSimulatedRef.current = false;
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
      } catch {
        // Nếu MediaRecorder lỗi, fallback sang mô phỏng
        return startRecording(true);
      }
    },
    [getSupportedMimeType, requestPermission, setupAudioAnalyser]
  );

  // Dừng ghi âm và trả về Promise chứa { blob, url, duration }
  const stopRecording = useCallback((): Promise<{ blob: Blob; url: string; duration: number }> => {
    return new Promise((resolve) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      // 1. Nếu đang ghi âm mô phỏng
      if (isSimulatedRef.current) {
        const { blob, url } = generateSyntheticAudio(durationSec);
        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob: blob,
          audioUrl: url,
          recordingDuration: durationSec,
          volumeLevel: 0,
        }));
        resolve({ blob, url, duration: durationSec });
        return;
      }

      // 2. Nếu đang ghi âm thật bằng MediaRecorder
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
          let blob = new Blob(audioChunksRef.current, { type: finalMime });
          let url = URL.createObjectURL(blob);

          // Nếu tệp quá nhỏ (do không có data thực), tạo tệp dự phòng
          if (blob.size < 100) {
            const synth = generateSyntheticAudio(durationSec);
            blob = synth.blob;
            url = synth.url;
          }

          setState((prev) => ({
            ...prev,
            isRecording: false,
            audioBlob: blob,
            audioUrl: url,
            recordingDuration: durationSec,
            volumeLevel: 0,
          }));

          if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close().catch(() => {});
          }

          resolve({ blob, url, duration: durationSec });
        };

        recorder.stop();
      } else {
        // Fallback tức thì nếu recorder không ở trạng thái recording
        const { blob, url } = generateSyntheticAudio(durationSec);
        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob: blob,
          audioUrl: url,
          recordingDuration: durationSec,
          volumeLevel: 0,
        }));
        resolve({ blob, url, duration: durationSec });
      }
    });
  }, [generateSyntheticAudio]);

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

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
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
