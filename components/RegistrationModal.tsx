"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Check, RefreshCw, AlertCircle } from "lucide-react";
import { Dialog } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { detectFaceAndDescriptor, computeAverageDescriptor } from "@/lib/faceApi";
import { Student, RegistrationFormData } from "@/types";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (data: RegistrationFormData & { faceDescriptor: number[] }) => Promise<boolean>;
  existingStudents: Student[];
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
  existingStudents,
}) => {
  const [step, setStep] = useState<"details" | "capture">("details");
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: "",
    phone: "",
    course: "",
    batch: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<RegistrationFormData>>({});
  const [capturedDescriptors, setCapturedDescriptors] = useState<Float32Array[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Camera start error in registration modal:", err);
      setCaptureError("Unable to access camera. Please allow camera permissions.");
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen && step === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, step, startCamera, stopCamera]);

  const validateForm = () => {
    const errors: Partial<RegistrationFormData> = {};
    if (!formData.name.trim()) errors.name = "Full name is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = "Enter a valid 10-digit phone number";
    } else if (existingStudents.some((s) => s.phone.trim() === formData.phone.trim())) {
      errors.phone = "A student with this phone number already exists.";
    }

    if (!formData.course.trim()) errors.course = "Course is required";
    if (!formData.batch.trim()) errors.batch = "Batch number is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateForm()) {
      setStep("capture");
    }
  };

  const captureSingleSample = async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);
    setCaptureError(null);

    try {
      const faceData = await detectFaceAndDescriptor(videoRef.current);
      if (faceData) {
        setCapturedDescriptors((prev) => [...prev, faceData.descriptor]);
      } else {
        setCaptureError("No face detected! Make sure your face is clearly visible in center frame.");
      }
    } catch (e) {
      console.warn("Sample capture error:", e);
    } finally {
      setIsCapturing(false);
    }
  };

  const autoCaptureSamples = async () => {
    if (isCapturing || !videoRef.current) return;
    setIsCapturing(true);
    setCaptureError(null);

    let count = capturedDescriptors.length;

    for (let i = 0; i < 5; i++) {
      if (count >= 5 || !videoRef.current) break;
      const faceData = await detectFaceAndDescriptor(videoRef.current);
      if (faceData) {
        setCapturedDescriptors((prev) => {
          const next = [...prev, faceData.descriptor];
          count = next.length;
          return next;
        });
      }
      // Non-blocking sleep 600ms
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    setIsCapturing(false);
  };

  const handleResetModal = () => {
    stopCamera();
    setStep("details");
    setFormData({ name: "", phone: "", course: "", batch: "" });
    setCapturedDescriptors([]);
    setFormErrors({});
    setCaptureError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (capturedDescriptors.length === 0) {
      setCaptureError("Please capture at least 1 face sample before submitting.");
      return;
    }

    setIsSubmitting(true);
    const avgDescriptor = computeAverageDescriptor(capturedDescriptors);

    const success = await onRegisterSuccess({
      ...formData,
      faceDescriptor: avgDescriptor,
    });

    setIsSubmitting(false);
    if (success) {
      handleResetModal();
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleResetModal} title="Register New Student" maxWidth="lg">
      <div className="space-y-6">
        {/* Step Wizard Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "details"
                  ? "bg-indigo-600 text-white"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              1
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Student Information
            </span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "capture"
                  ? "bg-indigo-600 text-white"
                  : capturedDescriptors.length > 0
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400"
              }`}
            >
              2
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Face Scan (5 Samples)
            </span>
          </div>
        </div>

        {/* Step 1: Form Fields */}
        {step === "details" && (
          <div className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
            />

            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={formErrors.phone}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Course"
                placeholder="e.g. Computer Science"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                error={formErrors.course}
              />
              <Input
                label="Batch"
                placeholder="e.g. 2024-A"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                error={formErrors.batch}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleResetModal}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleNextStep}>
                Next: Scan Face
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Camera Face Capture */}
        {step === "capture" && (
          <div className="space-y-4">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Progress counter */}
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-slate-700">
                Samples: {capturedDescriptors.length} / 5
              </div>
            </div>

            {captureError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {captureError}
              </div>
            )}

            {/* Action controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={captureSingleSample}
                  disabled={isCapturing || capturedDescriptors.length >= 5}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" /> Capture Sample
                </Button>

                <Button
                  onClick={autoCaptureSamples}
                  disabled={isCapturing || capturedDescriptors.length >= 5}
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isCapturing ? "animate-spin" : ""}`} /> Auto Scan (5x)
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep("details")}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={capturedDescriptors.length === 0 || isSubmitting}
                  variant="primary"
                  size="sm"
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Student
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
