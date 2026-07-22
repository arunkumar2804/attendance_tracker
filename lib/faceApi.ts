import { Student } from "@/types";

let faceapi: typeof import("@vladmandic/face-api") | null = null;
let isModelsLoaded = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let faceMatcher: any = null;

const MODEL_URL_CDN = "https://vladmandic.github.io/face-api/model/";
const MODEL_URL_LOCAL = "/models";

export async function getFaceApi() {
  if (typeof window === "undefined") return null;
  if (!faceapi) {
    faceapi = await import("@vladmandic/face-api");
    // Enable TFJS WebGL optimizations if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tf = (faceapi as any).tf;
    if (tf && typeof tf.setBackend === "function") {
      try {
        await tf.setBackend("webgl");
        await tf.ready();
      } catch {
        console.warn("WebGL backend fallback");
      }
    }
  }
  return faceapi;
}

async function warmupModel(api: any) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 224;
    canvas.height = 224;
    // Run dummy inference to compile WebGL shaders in background and prevent UI freeze later
    await api
      .detectSingleFace(canvas as any, new api.TinyFaceDetectorOptions({ inputSize: 224 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
  } catch (e) {
    console.warn("Warmup failed, skipping:", e);
  }
}

export async function loadFaceApiModels(): Promise<boolean> {
  if (isModelsLoaded) return true;
  const api = await getFaceApi();
  if (!api) return false;

  try {
    // Load lightweight TinyFaceDetector, 68 Landmarks, and Face Recognition Net
    try {
      await Promise.all([
        api.nets.tinyFaceDetector.loadFromUri(MODEL_URL_LOCAL),
        api.nets.faceLandmark68Net.loadFromUri(MODEL_URL_LOCAL),
        api.nets.faceRecognitionNet.loadFromUri(MODEL_URL_LOCAL),
      ]);
      isModelsLoaded = true;
      await warmupModel(api);
      return true;
    } catch {
      await Promise.all([
        api.nets.tinyFaceDetector.loadFromUri(MODEL_URL_CDN),
        api.nets.faceLandmark68Net.loadFromUri(MODEL_URL_CDN),
        api.nets.faceRecognitionNet.loadFromUri(MODEL_URL_CDN),
      ]);
      isModelsLoaded = true;
      await warmupModel(api);
      return true;
    }
  } catch (err) {
    console.error("Failed to load face-api models:", err);
    // Secondary fallback to ssdMobilenetv1 if tiny detector misses
    try {
      await Promise.all([
        api.nets.ssdMobilenetv1.loadFromUri(MODEL_URL_CDN),
        api.nets.faceLandmark68Net.loadFromUri(MODEL_URL_CDN),
        api.nets.faceRecognitionNet.loadFromUri(MODEL_URL_CDN),
      ]);
      isModelsLoaded = true;
      await warmupModel(api);
      return true;
    } catch (e) {
      console.error("Secondary model loading error:", e);
      return false;
    }
  }
}

/**
 * Detect a single face in a video element smoothly without freezing UI
 */
export async function detectFaceAndDescriptor(
  videoElement: HTMLVideoElement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ descriptor: Float32Array; detection: any; landmarks: any } | null> {
  const api = await getFaceApi();
  if (!api || !videoElement || videoElement.paused || videoElement.ended || videoElement.readyState < 2) {
    return null;
  }

  if (!isModelsLoaded) {
    const loaded = await loadFaceApiModels();
    if (!loaded) return null;
  }

  try {
    // Use TinyFaceDetector with inputSize 224 for ultra-fast, smooth inference
    let detection = await api
      .detectSingleFace(videoElement, new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Fallback to SSD Mobilenet if Tiny Face Detector returns null
    if (!detection && api.nets.ssdMobilenetv1.isLoaded) {
      detection = await api
        .detectSingleFace(videoElement, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    }

    if (!detection) return null;

    return {
      descriptor: detection.descriptor,
      detection: detection.detection,
      landmarks: detection.landmarks,
    };
  } catch (err) {
    console.warn("Face detection frame error:", err);
    return null;
  }
}

/**
 * Compute the average descriptor (128 floats vector) from multiple descriptor samples
 */
export function computeAverageDescriptor(descriptors: Float32Array[] | number[][]): number[] {
  if (descriptors.length === 0) return [];

  const vectorLength = descriptors[0].length;
  const avg = new Float32Array(vectorLength);

  for (let i = 0; i < vectorLength; i++) {
    let sum = 0;
    for (let j = 0; j < descriptors.length; j++) {
      sum += descriptors[j][i];
    }
    avg[i] = sum / descriptors.length;
  }

  return Array.from(avg);
}

/**
 * Update global FaceMatcher instance with registered students
 */
export async function updateFaceMatcher(students: Student[], maxDistance: number = 0.55): Promise<void> {
  const api = await getFaceApi();
  if (!api) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const labeledDescriptors: any[] = [];

  students.forEach((student) => {
    if (Array.isArray(student.faceDescriptor) && student.faceDescriptor.length === 128) {
      const floatArray = new Float32Array(student.faceDescriptor);
      labeledDescriptors.push(new api.LabeledFaceDescriptors(student.studentId, [floatArray]));
    }
  });

  if (labeledDescriptors.length > 0) {
    faceMatcher = new api.FaceMatcher(labeledDescriptors, maxDistance);
  } else {
    faceMatcher = null;
  }
}

/**
 * Match a detected face descriptor against registered student face matchers
 */
export function matchFaceDescriptor(
  descriptor: Float32Array,
  threshold: number = 0.55
): { studentId: string | null; distance: number; confidence: number } {
  if (!faceMatcher) {
    return { studentId: null, distance: 1, confidence: 0 };
  }

  const match = faceMatcher.findBestMatch(descriptor);
  const distance = match.distance;

  if (match.label !== "unknown" && distance <= threshold) {
    const confidence = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
    return {
      studentId: match.label,
      distance,
      confidence,
    };
  }

  return { studentId: null, distance, confidence: 0 };
}
