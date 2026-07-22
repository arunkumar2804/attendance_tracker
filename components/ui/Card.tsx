import React from "react";
import { cn } from "@/lib/utils";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-xl shadow-slate-200/20 dark:shadow-none p-6 transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
