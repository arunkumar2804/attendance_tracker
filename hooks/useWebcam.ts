"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useWebcam(resolution: string = "1280x720") {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    let width = 1280;
    let height = 720;
    if (resolution === "1920x1080") {
      width = 1920;
      height = 1080;
    } else if (resolution === "640x480") {
      width = 640;
      height = 480;
    }

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
          videoRef.current
            ?.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
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
  }, [resolution, stopStream]);

  useEffect(() => {
    startStream();
    return () => {
      stopStream();
    };
  }, [resolution]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    videoRef,
    isPlaying,
    error,
    startStream,
    stopStream,
  };
}
