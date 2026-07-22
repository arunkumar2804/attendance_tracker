"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Student } from "@/types";
import {
  loadFaceApiModels,
  detectFaceAndDescriptor,
  updateFaceMatcher,
  matchFaceDescriptor,
} from "@/lib/faceApi";
import { playSuccessChime } from "@/lib/audio";

interface UseFaceApiProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  students: Student[];
  threshold: number;
  autoScan: boolean;
  soundEnabled: boolean;
  onRecognized: (student: Student) => void;
}

export function useFaceApi({
  videoRef,
  isPlaying,
  students,
  threshold,
  autoScan,
  soundEnabled,
  onRecognized,
}: UseFaceApiProps) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [scanStatus, setScanStatus] = useState<"loading" | "scanning" | "recognized" | "cooldown" | "idle">("loading");
  const [lastRecognizedStudent, setLastRecognizedStudent] = useState<Student | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  const cooldownMap = useRef<Map<string, number>>(new Map());
  const isBusyRef = useRef(false);
  const activeRef = useRef(true);

  // Load face-api models on mount
  useEffect(() => {
    let isMounted = true;
    loadFaceApiModels().then((success) => {
      if (isMounted) {
        setIsModelLoaded(success);
        setScanStatus(success ? "idle" : "loading");
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update matcher whenever registered students or threshold changes
  useEffect(() => {
    if (students.length > 0) {
      updateFaceMatcher(students, threshold);
    }
  }, [students, threshold]);

  const processSingleFrame = useCallback(async () => {
    if (
      !videoRef.current ||
      !isPlaying ||
      !isModelLoaded ||
      !autoScan ||
      isBusyRef.current ||
      !activeRef.current
    ) {
      return;
    }

    isBusyRef.current = true;

    try {
      if (scanStatus !== "cooldown" && scanStatus !== "recognized") {
        setScanStatus("scanning");
      }

      const faceData = await detectFaceAndDescriptor(videoRef.current);

      if (faceData) {
        const { descriptor } = faceData;
        const match = matchFaceDescriptor(descriptor, threshold);

        if (match.studentId) {
          const student = students.find((s) => s.studentId === match.studentId);
          if (student) {
            const now = Date.now();
            const lastTime = cooldownMap.current.get(student.studentId) || 0;

            // 10 second cooldown per student
            if (now - lastTime > 10000) {
              cooldownMap.current.set(student.studentId, now);
              setLastRecognizedStudent(student);
              setConfidence(match.confidence);
              setScanStatus("recognized");

              if (soundEnabled) {
                playSuccessChime();
              }

              onRecognized(student);

              setTimeout(() => {
                setScanStatus("cooldown");
                setTimeout(() => {
                  setScanStatus("scanning");
                  setLastRecognizedStudent(null);
                }, 3000);
              }, 2500);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Frame detection error:", err);
    } finally {
      isBusyRef.current = false;
    }
  }, [videoRef, isPlaying, isModelLoaded, autoScan, scanStatus, threshold, students, soundEnabled, onRecognized]);

  // Non-blocking recursive setTimeout loop for ultra-smooth UI performance
  useEffect(() => {
    activeRef.current = true;
    let timerId: NodeJS.Timeout | null = null;

    const scheduleNextFrame = async () => {
      if (!activeRef.current) return;
      await processSingleFrame();
      if (activeRef.current) {
        timerId = setTimeout(scheduleNextFrame, 500); // 500ms smooth polling interval
      }
    };

    if (isPlaying && isModelLoaded && autoScan) {
      scheduleNextFrame();
    }

    return () => {
      activeRef.current = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isPlaying, isModelLoaded, autoScan, processSingleFrame]);

  return {
    isModelLoaded,
    scanStatus,
    lastRecognizedStudent,
    confidence,
  };
}
