"use client";

import { useState, useEffect } from "react";
import { SystemSettings } from "@/types";

const DEFAULT_SETTINGS: SystemSettings = {
  recognitionThreshold: 0.50,
  cameraResolution: "1280x720",
  autoScan: true,
  successSound: true,
  darkMode: true,
  appsScriptUrl: "",
};

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("attendance_system_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.warn("Failed to load settings from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      // Toggle dark mode class on document elem
      if (settings.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [settings.darkMode, isLoaded]);

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem("attendance_system_settings", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to save settings:", e);
      }
      return updated;
    });
  };

  return { settings, updateSettings, isLoaded };
}
