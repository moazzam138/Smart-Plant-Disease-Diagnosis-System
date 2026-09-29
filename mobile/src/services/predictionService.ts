import {
  ALLOW_MOCK_FALLBACK,
  MODE,
  PREDICTION_ENDPOINT,
  TIMEOUT,
} from "../config/api";
import type {
  DiseaseSeverity,
  PredictionApiResponse,
  PredictionResult,
  SelectedImage,
} from "../types/prediction";

const SUPPORTED_IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function getImageFile(image: SelectedImage): { name: string; type: string } {
  if (!image.uri?.trim()) {
    throw new Error("Please capture or select a leaf photo before analyzing.");
  }

  const extension = image.fileName?.split(".").pop()?.toLowerCase()
    ?? image.uri.split(/[?#]/, 1)[0].split(".").pop()?.toLowerCase();
  const extensionType = extension ? SUPPORTED_IMAGE_TYPES[extension] : undefined;
  const mimeType = image.mimeType?.toLowerCase().split(";")[0].trim();
  const mimeExtension = mimeType
    ? Object.keys(SUPPORTED_IMAGE_TYPES).find(
        (key) => SUPPORTED_IMAGE_TYPES[key] === mimeType,
      )
    : undefined;
  const type = mimeType && mimeExtension ? mimeType : extensionType;

  if (!type) {
    throw new Error("This photo format is not supported. Please use a JPG, PNG, or WebP image.");
  }

  if (mimeType && !mimeExtension) {
    throw new Error("This photo format is not supported. Please use a JPG, PNG, or WebP image.");
  }

  const resolvedExtension = mimeExtension ?? extension ?? "jpg";
  const selectedFileName = image.fileName?.trim();
  const selectedNameExtension = selectedFileName?.split(".").pop()?.toLowerCase();
  const selectedNameMatchesType = selectedNameExtension
    ? SUPPORTED_IMAGE_TYPES[selectedNameExtension] === type
    : false;
  const name = selectedNameMatchesType && selectedFileName
    ? selectedFileName
    : `tomato-leaf.${resolvedExtension}`;

  return { name, type };
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("The prediction service returned an invalid confidence value.");
  }

  const percent = value <= 1 ? value * 100 : value;
  if (percent < 0 || percent > 100) {
    throw new Error("The prediction service returned an invalid confidence value.");
  }

  return Math.round(percent * 100) / 100;
}

function normalizeSeverity(value: unknown): DiseaseSeverity {
  if (typeof value !== "string") return "Unknown";
  const normalized = value.trim().toLowerCase();
  if (normalized === "mild") return "Mild";
  if (normalized === "moderate") return "Moderate";
  if (normalized === "severe") return "Severe";
  return "Unknown";
}

function normalizeApiResponse(payload: PredictionApiResponse): PredictionResult {
  const response = payload.data ?? payload;

  if (typeof response.disease !== "string" || !response.disease.trim()) {
    throw new Error("The prediction service returned an incomplete result. Please try again.");
  }

  const label = response.disease.trim();
  const displayName = typeof response.display_name === "string" && response.display_name.trim()
    ? response.display_name.trim()
    : label;

  return {
    disease: displayName,
    label,
    confidence: normalizeConfidence(response.confidence),
    severity: normalizeSeverity(response.severity),
    model: typeof response.model === "string" && response.model.trim()
      ? response.model.trim()
      : "Model not specified",
    source: "api",
  };
}

function createMockPrediction(): PredictionResult {
  return {
    disease: "Early Blight",
    confidence: 93,
    severity: "Moderate",
    model: "Mock Model",
    source: "mock",
  };
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

type UploadOutcome =
  | { kind: "response"; status: number; body: string }
  | { kind: "network"; message: string }
  | { kind: "timeout" };

/**
 * Sends multipart form data with React Native's XMLHttpRequest.
 *
 * Why not fetch: from Expo SDK 52+ the global fetch is `expo/fetch`, which rejects
 * React Native-style file parts ({ uri, name, type }) with
 * "Unsupported FormDataPart implementation". RN's XMLHttpRequest still uploads
 * local files from their `file://` URI, so it is used for the image upload.
 */
function postMultipart(url: string, body: FormData, timeoutMs: number): Promise<UploadOutcome> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = timeoutMs;
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = () => resolve({ kind: "response", status: xhr.status, body: xhr.responseText ?? "" });
    xhr.onerror = () => resolve({ kind: "network", message: "XMLHttpRequest network error" });
    xhr.ontimeout = () => resolve({ kind: "timeout" });
    // Content-Type (with the multipart boundary) is set by the runtime - do not set it here.
    xhr.send(body);
  });
}

/** Reads FastAPI's {"detail": "..."} error message, if present. */
function readErrorDetail(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    return typeof parsed?.detail === "string" && parsed.detail.trim() ? parsed.detail.trim() : null;
  } catch {
    return null;
  }
}

async function requestPrediction(
  image: SelectedImage,
  file: { name: string; type: string },
): Promise<PredictionResult> {
  const formData = new FormData();
  const imagePart = {
    uri: image.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob;
  formData.append("image", imagePart);

  const outcome = await postMultipart(PREDICTION_ENDPOINT, formData, TIMEOUT);

  if (outcome.kind !== "response") {
    // Visible in the Expo terminal - helps diagnose network problems.
    console.warn(
      `[prediction] POST ${PREDICTION_ENDPOINT} failed:`,
      outcome.kind === "timeout" ? "timeout" : outcome.message,
      { uri: image.uri, name: file.name, type: file.type },
    );
    if (outcome.kind === "timeout") {
      throw new Error("The analysis took too long. Please try again when your connection is stable.");
    }
    throw new Error(
      `We could not reach the prediction service at ${PREDICTION_ENDPOINT}. Check your connection and try again.`,
    );
  }

  const { status, body } = outcome;
  if (status < 200 || status >= 300) {
    const detail = readErrorDetail(body);
    console.warn(`[prediction] POST ${PREDICTION_ENDPOINT} returned ${status}:`, detail ?? body.slice(0, 200));
    if (status === 404) {
      throw new Error("The prediction service endpoint is not available yet. Please try again later.");
    }
    if (status === 503) {
      throw new Error("The diagnosis model is not ready on the server yet. Please try again shortly.");
    }
    if (status >= 500 || status === 0) {
      throw new Error("The prediction service is temporarily unavailable. Please try again later.");
    }
    if (status === 413) {
      throw new Error("This photo is too large. Please choose a smaller image.");
    }
    // 400 / 415: the server explains what is wrong with the photo.
    throw new Error(detail ?? "The photo could not be analyzed. Please check it and try again.");
  }

  let payload: PredictionApiResponse;
  try {
    payload = JSON.parse(body) as PredictionApiResponse;
  } catch {
    throw new Error("The prediction service sent an unreadable response. Please try again.");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("The prediction service sent an invalid result. Please try again.");
  }

  return normalizeApiResponse(payload);
}

/**
 * Validates a selected leaf image and produces a mock result or API prediction.
 * Multipart boundaries are deliberately left to the networking runtime.
 */
export async function analyzeImage(image: SelectedImage): Promise<PredictionResult> {
  const file = getImageFile(image);
  console.log(`[prediction] mode=${MODE} endpoint=${PREDICTION_ENDPOINT}`);

  if (MODE === "mock") {
    await wait(650);
    return createMockPrediction();
  }

  try {
    return await requestPrediction(image, file);
  } catch (error) {
    if (ALLOW_MOCK_FALLBACK) {
      await wait(250);
      return createMockPrediction();
    }

    throw error instanceof Error
      ? error
      : new Error("The prediction could not be completed. Please try again.");
  }
}