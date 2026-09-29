export type PredictionMode = "mock" | "api";

/**
 * Backend address.
 *
 * Set it without editing code by creating `mobile/.env.local` with:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.25:8000
 * then restart Expo (npx expo start -c).
 *
 * Defaults:
 *   Android emulator -> http://10.0.2.2:8000 (the development machine)
 *   iOS simulator    -> http://localhost:8000
 *   Physical phone   -> the computer's LAN IPv4 address (run `ipconfig` on Windows).
 *                       Never use localhost from a physical device.
 */
export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8000").replace(/\/+$/, "");

/** Shared team contract: POST /predict, multipart/form-data, field "image". */
export const PREDICTION_ENDPOINT = `${BASE_URL}/predict`;
export const HEALTH_ENDPOINT = `${BASE_URL}/health`;
export const TIMEOUT = 30_000;

/** "api" = real backend (primary path). "mock" = offline demo data only. */
export const MODE: PredictionMode = process.env.EXPO_PUBLIC_PREDICTION_MODE === "mock" ? "mock" : "api";

/** Keep false for demos: a failed request must show an error, not a fake result. */
export const ALLOW_MOCK_FALLBACK = false;
