import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function AnalysisScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { imageUri } = route.params || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Result", {
        imageUri,
        disease: "Early Blight",
        confidence: 93,
        severity: "Moderate",
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Analyzing Leaf</Text>

        <Text style={styles.subtitle}>
          AI is analyzing your tomato leaf image
        </Text>

        <View style={styles.imageContainer}>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#19D98A" />
          </View>
        </View>

        <Text style={styles.analyzingText}>
          Detecting plant disease...
        </Text>

        <Text style={styles.smallText}>
          This may take a few seconds
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#07100E",
  },

  container: {
    flex: 1,
    backgroundColor: "#07100E",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginBottom: 8,
  },

  subtitle: {
    color: "#8EA19A",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
  },

  imageContainer: {
    width: "100%",
    height: 360,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0E1916",
    borderWidth: 1,
    borderColor: "#1A332B",
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(7,16,14,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  analyzingText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 28,
  },

  smallText: {
    color: "#71827B",
    fontSize: 12,
    marginTop: 8,
  },
});