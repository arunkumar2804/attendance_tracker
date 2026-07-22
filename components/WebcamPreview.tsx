"use client";

import React from "react";
import { Camera, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Student } from "@/types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface WebcamPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  error: string | null;
  scanStatus: "loading" | "scanning" | "recognized" | "cooldown" | "idle";
  lastRecognizedStudent: Student | null;
  confidence: number;
  onRefreshStream: () => void;
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  videoRef,
  isPlaying,
  error,
  scanStatus,
  lastRecognizedStudent,
  confidence,
  onRefreshStream,
}) => {
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center group">
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100"
      />

      {/* Futuristic Scan overlay line */}
      {isPlaying && scanStatus === "scanning" && (
        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_#6366f1] animate-scan-line pointer-events-none" />
      )}

      {/* Target framing box */}
      {isPlaying && (
        <div className="absolute inset-12 sm:inset-16 md:inset-20 border-2 border-dashed border-indigo-500/40 rounded-3xl pointer-events-none transition-all duration-300 group-hover:border-indigo-400/70">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
        </div>
      )}

      {/* Status Badge Top Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {scanStatus === "loading" && (
          <Badge variant="warning" className="gap-1.5 py-1 px-3 bg-amber-950/80 border-amber-500/30 text-amber-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Loading AI Models...
          </Badge>
        )}
        {scanStatus === "scanning" && (
          <Badge variant="info" className="gap-1.5 py-1 px-3 bg-indigo-950/80 border-indigo-500/30 text-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            Scanning Faces...
          </Badge>
        )}
        {scanStatus === "recognized" && (
          <Badge variant="success" className="gap-1.5 py-1.5 px-3 bg-emerald-950/90 border-emerald-500/40 text-emerald-200 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Recognized ({confidence}% Match)
          </Badge>
        )}
        {scanStatus === "cooldown" && (
          <Badge variant="neutral" className="gap-1.5 py-1 px-3 bg-slate-900/80 border-slate-700 text-slate-300">
            Processing Cooldown...
          </Badge>
        )}
      </div>

      {/* Refresh Stream Button Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          onClick={onRefreshStream}
          variant="ghost"
          size="sm"
          className="bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/50 p-2"
          title="Restart Camera"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Recognition Success Overlay Notification */}
      {scanStatus === "recognized" && lastRecognizedStudent && (
        <div className="absolute inset-x-4 bottom-4 z-30 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-emerald-950/95 border border-emerald-500/50 shadow-2xl backdrop-blur-xl animate-pop-in flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Attendance Marked Automatically!
              </p>
              <h4 className="text-lg font-bold text-white">{lastRecognizedStudent.name}</h4>
              <p className="text-xs text-slate-300">
                {lastRecognizedStudent.studentId} • {lastRecognizedStudent.course} ({lastRecognizedStudent.batch})
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-2xl font-extrabold text-emerald-400">100%</span>
            <p className="text-[10px] text-slate-400 uppercase">Present Today</p>
          </div>
        </div>
      )}

      {/* Error or Inactive Camera Fallback */}
      {error && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h4 className="text-base font-semibold text-white mb-1">Camera Stream Unavailable</h4>
          <p className="text-xs text-slate-400 max-w-md mb-4">{error}</p>
          <Button onClick={onRefreshStream} variant="primary" size="sm" className="gap-2">
            <Camera className="w-4 h-4" /> Re-enable Camera
          </Button>
        </div>
      )}
    </div>
  );
};
