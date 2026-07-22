import React from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: { type: "success" | "error" | "info"; text: string } | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />,
  };

  const bgStyles = {
    success: "border-emerald-500/30 bg-emerald-950/90 text-emerald-100",
    error: "border-rose-500/30 bg-rose-950/90 text-rose-100",
    info: "border-indigo-500/30 bg-indigo-950/90 text-indigo-100",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-pop-in">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md max-w-md",
          bgStyles[message.type]
        )}
      >
        {icons[message.type]}
        <p className="text-sm font-medium">{message.text}</p>
      </div>
    </div>
  );
};
