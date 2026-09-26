import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BottomTabNavigator from "./BottomTabNavigator";

import PreviewScreen from "../screens/PreviewScreen";
import AnalysisScreen from "../screens/AnalysisScreen";
import ResultScreen from "../screens/ResultScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* Main application */}
      <Stack.Screen
        name="MainTabs"
        component={BottomTabNavigator}
      />

      {/* Scan flow */}
      <Stack.Screen
        name="Preview"
        component={PreviewScreen}
      />

      <Stack.Screen
        name="Analysis"
        component={AnalysisScreen}
      />

      <Stack.Screen
        name="Result"
        component={ResultScreen}
      />

    </Stack.Navigator>
  );
}