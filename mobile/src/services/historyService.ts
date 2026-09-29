import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  DiseaseSeverity,
  NewSavedPrediction,
  SavedPrediction,
} from "../types/prediction";

const HISTORY_STORAGE_KEY = "@agricare/prediction-history:v1";
const SEVERITIES: DiseaseSeverity[] = ["Mild", "Moderate", "Severe", "Unknown"];

function isSavedPrediction(value: unknown): value is SavedPrediction {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Partial<SavedPrediction>;
  return (
    typeof record.id === "string" &&
    (typeof record.imageUri === "string" || record.imageUri === null) &&
    typeof record.disease === "string" &&
    typeof record.confidence === "number" &&
    Number.isFinite(record.confidence) &&
    typeof record.severity === "string" &&
    SEVERITIES.includes(record.severity as DiseaseSeverity) &&
    typeof record.createdAt === "string" &&
    Number.isFinite(Date.parse(record.createdAt)) &&
    (record.source === "mock" || record.source === "api") &&
    typeof record.model === "string"
  );
}

function sortNewestFirst(records: SavedPrediction[]): SavedPrediction[] {
  return [...records].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export async function getPredictions(): Promise<SavedPrediction[]> {
  try {
    const storedValue = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!storedValue) return [];

    const parsed: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) {
      throw new Error("Saved history has an unexpected format.");
    }

    return sortNewestFirst(parsed.filter(isSavedPrediction));
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Saved history could not be loaded from this device.");
  }
}

export async function savePrediction(
  prediction: NewSavedPrediction,
): Promise<SavedPrediction> {
  try {
    const current = await getPredictions();
    const saved: SavedPrediction = {
      ...prediction,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(sortNewestFirst([saved, ...current])),
    );
    return saved;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("This scan could not be saved. Please try again.");
  }
}

export async function deletePrediction(id: string): Promise<void> {
  try {
    const remaining = (await getPredictions()).filter((record) => record.id !== id);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(remaining));
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("This scan could not be deleted. Please try again.");
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("History could not be cleared. Please try again.");
  }
}
