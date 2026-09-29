import type { NavigatorScreenParams } from "@react-navigation/native";
import type { DiseaseSeverity, PredictionSource } from "../types/prediction";

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Scan: undefined;
  Insights: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Preview: {
    imageUri?: string;
    fileName?: string | null;
    mimeType?: string | null;
  };
  Analysis: { imageUri: string };
  Result: {
    imageUri?: string;
    disease?: string;
    confidence?: number;
    severity?: DiseaseSeverity;
    model?: string;
    source?: PredictionSource;
  };
  Treatment: {
    disease: string;
    severity: string;
    confidence: number;
  };
};