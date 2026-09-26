import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ScanScreen() {
  const navigation = useNavigation<any>();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // ================================
  // OPEN CAMERA
  // ================================
  const openCamera = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please allow camera access from your phone settings."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera Error:", error);

      Alert.alert(
        "Camera Error",
        "Unable to open the camera. Please try again."
      );
    }
  };

  // ================================
  // OPEN GALLERY
  // ================================
  const openGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Gallery Permission Required",
          "Please allow photo access from your phone settings."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Gallery Error:", error);

      Alert.alert(
        "Gallery Error",
        "Unable to open the gallery. Please try again."
      );
    }
  };

  // ================================
  // REMOVE IMAGE
  // ================================
  const removeImage = () => {
    setSelectedImage(null);
  };

  // ================================
  // CONTINUE TO PREVIEW
  // ================================
  const analyzeImage = () => {
    if (!selectedImage) {
      Alert.alert(
        "No Image Selected",
        "Please capture or select a tomato leaf image first."
      );
      return;
    }

    navigation.navigate("Preview", {
      imageUri: selectedImage,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ================================
              HEADER
          ================================= */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Scan Plant</Text>

              <Text style={styles.subtitle}>
                Detect tomato leaf diseases using AI
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons name="scan-outline" size={24} color="#19D98A" />
            </View>
          </View>

          {/* ================================
              IMAGE PREVIEW
          ================================= */}
          <View style={styles.previewCard}>
            {selectedImage ? (
              <>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={removeImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.scanIconContainer}>
                  <Ionicons name="scan-outline" size={48} color="#19D98A" />
                </View>

                <Text style={styles.previewTitle}>Scan a Tomato Leaf</Text>

                <Text style={styles.previewDescription}>
                  Capture a clear photo of the leaf or choose an existing image from your gallery.
                </Text>
              </>
            )}
          </View>

          {/* ================================
              CAMERA BUTTON
          ================================= */}
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={openCamera}
            activeOpacity={0.8}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="camera-outline" size={24} color="#07100E" />
            </View>

            <Text style={styles.cameraButtonText}>Open Camera</Text>

            <Ionicons name="arrow-forward" size={22} color="#07100E" />
          </TouchableOpacity>

          {/* ================================
              GALLERY BUTTON
          ================================= */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={openGallery}
            activeOpacity={0.8}
          >
            <Ionicons name="images-outline" size={23} color="#19D98A" />

            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          {/* ================================
              ANALYZE BUTTON
          ================================= */}
          {selectedImage && (
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={analyzeImage}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles-outline" size={22} color="#FFFFFF" />

              <Text style={styles.analyzeButtonText}>Continue</Text>

              <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* ================================
              INFORMATION
          ================================= */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="bulb-outline" size={21} color="#F3B94D" />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>For better results</Text>

              <Text style={styles.infoText}>
                Use a clear image with good lighting. Make sure the tomato leaf is visible and not heavily blurred.
              </Text>
            </View>
          </View>

          {/* ================================
              FEATURES
          ================================= */}
          <View style={styles.featuresRow}>
            <View style={styles.feature}>
              <Ionicons name="flash-outline" size={20} color="#19D98A" />
              <Text style={styles.featureText}>Instant Analysis</Text>
            </View>

            <View style={styles.feature}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#19D98A" />
              <Text style={styles.featureText}>Plant Focused</Text>
            </View>
          </View>
        </ScrollView>
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
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },

  // ================================
  // HEADER
  // ================================
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },

  subtitle: {
    color: "#8EA19A",
    fontSize: 13,
    marginTop: 5,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#0E2B22",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#174D3C",
  },

  // ================================
  // IMAGE PREVIEW
  // ================================
  previewCard: {
    height: 300,
    borderRadius: 24,
    backgroundColor: "#0E1916",
    borderWidth: 1,
    borderColor: "#1A332B",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 18,
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  scanIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "#0E3025",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  previewTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 8,
  },

  previewDescription: {
    color: "#8EA19A",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  removeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ================================
  // CAMERA BUTTON
  // ================================
  cameraButton: {
    height: 58,
    borderRadius: 17,
    backgroundColor: "#19D98A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 17,
    marginBottom: 12,
  },

  buttonIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraButtonText: {
    flex: 1,
    color: "#07100E",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 12,
  },

  // ================================
  // GALLERY BUTTON
  // ================================
  galleryButton: {
    height: 56,
    borderRadius: 17,
    backgroundColor: "#0E1916",
    borderWidth: 1,
    borderColor: "#1A332B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },

  galleryButtonText: {
    color: "#19D98A",
    fontSize: 15,
    fontWeight: "700",
  },

  // ================================
  // ANALYZE BUTTON
  // ================================
  analyzeButton: {
    height: 58,
    borderRadius: 17,
    backgroundColor: "#123F31",
    borderWidth: 1,
    borderColor: "#19D98A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },

  analyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  // ================================
  // INFORMATION
  // ================================
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#101C18",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1B3029",
    padding: 16,
    marginBottom: 20,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#332814",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },

  infoText: {
    color: "#84978F",
    fontSize: 12,
    lineHeight: 18,
  },

  // ================================
  // FEATURES
  // ================================
  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },

  feature: {
    alignItems: "center",
    flex: 1,
  },

  featureText: {
    color: "#71827B",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
});