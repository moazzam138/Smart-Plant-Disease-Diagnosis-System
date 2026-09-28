export type DiseaseSeverity = "Mild" | "Moderate" | "Severe" | "Unknown";

export type PredictionSource = "mock" | "api";

/** Confidence is normalized to a percentage from 0 through 100. */
export interface PredictionResult {
  disease: string;
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

/** Expected JSON shape returned by the prediction API. */
export interface PredictionApiResponse {
  disease?: unknown;
  confidence?: unknown;
  severity?: unknown;
  model?: unknown;
  data?: {
    disease?: unknown;
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