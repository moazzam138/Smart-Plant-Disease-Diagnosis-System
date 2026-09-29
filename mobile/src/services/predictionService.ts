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

/** Reads FastAPI's {"detail": "..."} error message, if present. */
async function readErrorDetail(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    return typeof body?.detail === "string" && body.detail.trim() ? body.detail.trim() : null;
  } catch {
    return null;
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    let response: Response;
    try {
      response = await fetch(PREDICTION_ENDPOINT, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
    } catch (error) {
      // Visible in the Expo terminal - helps diagnose network problems.
      console.warn(
        `[prediction] POST ${PREDICTION_ENDPOINT} failed:`,
        error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        { uri: image.uri, name: file.name, type: file.type },
      );
      if (controller.signal.aborted) {
        throw new Error("The analysis took too long. Please try again when your connection is stable.");
      }
      throw new Error(
        `We could not reach the prediction service at ${PREDICTION_ENDPOINT}. Check your connection and try again.`,
      );
    }

    if (!response.ok) {
      const detail = await readErrorDetail(response);
      if (response.status === 404) {
        throw new Error("The prediction service endpoint is not available yet. Please try again later.");
      }
      if (response.status === 503) {
        throw new Error("The diagnosis model is not ready on the server yet. Please try again shortly.");
      }
      if (response.status >= 500) {
        throw new Error("The prediction service is temporarily unavailable. Please try again later.");
      }
      if (response.status === 413) {
        throw new Error("This photo is too large. Please choose a smaller image.");
      }
      // 400 / 415: the server explains what is wrong with the photo.
      throw new Error(detail ?? "The photo could not be analyzed. Please check it and try again.");
    }

    let payload: PredictionApiResponse;
    try {
      payload = await response.json() as PredictionApiResponse;
    } catch {
      if (controller.signal.aborted) {
        throw new Error("The analysis took too long. Please try again when your connection is stable.");
      }
      throw new Error("The prediction service sent an unreadable response. Please try again.");
    }

    if (!payload || typeof payload !== "object") {
      throw new Error("The prediction service sent an invalid result. Please try again.");
    }

    return normalizeApiResponse(payload);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Validates a selected leaf image and produces a mock result or API prediction.
 * Multipart boundaries are deliberately left to the fetch runtime.
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