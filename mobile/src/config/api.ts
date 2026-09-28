export type PredictionMode = "mock" | "api";

/**
 * Android emulator address for a backend running on the development machine.
 * For a physical phone, replace 10.0.2.2 with the computer's LAN IPv4 address
 * (for example, http://192.168.1.25:8000). Use http://localhost:8000 for the
 * iOS simulator. Do not use localhost from a physical device.
 */
export const BASE_URL = "http://10.0.2.2:8000";

export const PREDICTION_ENDPOINT = `${BASE_URL}/api/predictions/analyze`;
export const TIMEOUT = 30_000;
export const MODE: PredictionMode = "mock";
export const ALLOW_MOCK_FALLBACK = false;