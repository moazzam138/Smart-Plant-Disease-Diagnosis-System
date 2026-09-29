export type DiseaseSeverity = "Mild" | "Moderate" | "Severe" | "Unknown";

export type PredictionSource = "mock" | "api";

/** Confidence is normalized to a percentage from 0 through 100. */
export interface PredictionResult {
  /** Readable disease name shown to the user, e.g. "Late Blight". */
  disease: string;
  /** Raw ML class label from the backend, e.g. "Tomato___Late_blight" (API results only). */
  label?: string;
  confidence: number;
  severity: DiseaseSeverity;
  model: string;
  source: PredictionSource;
}

/** Prediction record persisted locally for the History screen. */
export interface SavedPrediction extends PredictionResult {
  id: string;
  imageUri: string | null;
  createdAt: string;
}

export type NewSavedPrediction = Omit<SavedPrediction, "id" | "createdAt">;

/**
 * JSON returned by POST /predict (see backend README "Prediction contract").
 * `disease` is the raw ML label; `display_name` is the readable name.
 */
export interface PredictionApiResponse {
  disease?: unknown;
  display_name?: unknown;
  confidence?: unknown;
  severity?: unknown;
  model?: unknown;
  data?: {
    disease?: unknown;
    display_name?: unknown;
    confidence?: unknown;
    severity?: unknown;
    model?: unknown;
  };
}

/** Local image-picker metadata required to construct a multipart upload. */
export interface SelectedImage {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}