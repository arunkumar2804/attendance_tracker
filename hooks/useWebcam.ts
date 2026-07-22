"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useWebcam(resolution: string = "1280x720") {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWidthHeight = useCallback(() => {
    switch (resolution) {
      case "1920x1080":
        return { width: 1920, height: 1080 };
      case "640x480":
        return { width: 640, height: 480 };
      case "1280x720":
      default:
        return { width: 1280, height: 720 };
    }
  }, [resolution]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsPlaying(false);
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setError(null);

    const { width, height } = getWidthHeight();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            console.error("Video play error:", err);
            setError("Failed to start video playback.");
          });
        };
      }
    } catch (err) {
      console.error("Webcam access error:", err);
      setError("Webcam access denied or unavailable. Please check permissions.");
      setIsPlaying(false);
    }
  }, [getWidthHeight, stopStream]);

  useEffect(() => {
    startStream();
    return () => {
      stopStream();
    };
  }, [startStream, stopStream]);

  return {
    videoRef,
    isPlaying,
    error,
    startStream,
    stopStream,
  };
}
