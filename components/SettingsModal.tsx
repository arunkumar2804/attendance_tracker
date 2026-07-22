"use client";

import React, { useState } from "react";
import { Sliders, Volume2, Video, Moon, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { SystemSettings } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [testStatus, setTestStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    if (!settings.appsScriptUrl) {
      setTestStatus({ type: "error", message: "Please enter a Google Apps Script Web App URL first." });
      return;
    }

    setIsTesting(true);
    setTestStatus({ type: null, message: "" });

    try {
      const res = await fetch(`${settings.appsScriptUrl}?action=getStats`);
      const json = await res.json();
      if (json.success) {
        setTestStatus({ type: "success", message: "Connection successful! Google Sheets database linked." });
      } else {
        setTestStatus({ type: "error", message: "Connected, but Google Apps Script returned error response." });
      }
    } catch (err) {
      setTestStatus({ type: "error", message: `Connection failed: ${(err as Error).message}` });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="System Configurations & Settings" maxWidth="lg">
      <div className="space-y-6">
        {/* Face Recognition Threshold */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" /> Recognition Match Threshold
            </label>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {settings.recognitionThreshold.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.30"
            max="0.70"
            step="0.05"
            value={settings.recognitionThreshold}
            onChange={(e) => onUpdateSettings({ recognitionThreshold: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Lower = strict match (fewer false positives). Higher = loose match (easier recognition).
          </p>
        </div>

        {/* Camera Resolution */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-500" /> Preferred Camera Resolution
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["640x480", "1280x720", "1920x1080"] as const).map((res) => (
              <button
                key={res}
                onClick={() => onUpdateSettings({ cameraResolution: res })}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  settings.cameraResolution === res
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles Row */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Auto Continuous Scan</p>
                <p className="text-[11px] text-slate-500">Automatically mark attendance when face is recognized</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoScan}
              onChange={(e) => onUpdateSettings({ autoScan: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Success Audio Sound</p>
                <p className="text-[11px] text-slate-500">Play pleasant audio chime upon successful scan</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.successSound}
              onChange={(e) => onUpdateSettings({ successSound: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Dark Theme</p>
                <p className="text-[11px] text-slate-500">Switch application appearance mode</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) => onUpdateSettings({ darkMode: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Google Apps Script Integration URL */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <Input
            label="Google Apps Script Web App URL"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={settings.appsScriptUrl}
            onChange={(e) => onUpdateSettings({ appsScriptUrl: e.target.value })}
          />
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500">
              Leave blank to run in-memory API mock mode for immediate testing.
            </p>
            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !settings.appsScriptUrl}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
            >
              <LinkIcon className="w-3.5 h-3.5" /> Test Connection
            </Button>
          </div>

          {testStatus.type && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                testStatus.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {testStatus.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              {testStatus.message}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={onClose} variant="primary">
            Done & Save
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
