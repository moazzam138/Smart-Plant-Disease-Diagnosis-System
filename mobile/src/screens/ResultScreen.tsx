import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function ResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    imageUri,
    disease = "Early Blight",
    confidence = 93,
    severity = "Moderate",
  } = route.params || {};

  // ================================
  // SAVE RESULT TO HISTORY
  // ================================
  const saveToHistory = () => {
    navigation.navigate("MainTabs", {
      screen: "History",
      params: {
        newResult: {
          imageUri,
          disease,
          confidence,
          severity,
          date: new Date().toLocaleDateString(),
        },
      },
    });
  };

  // ================================
  // VIEW TREATMENT
  // ================================
  const viewTreatment = () => {
    navigation.navigate("MainTabs", {
      screen: "Insights",
    });
  };

  // ================================
  // SCAN ANOTHER LEAF
  // ================================
  const scanAnotherLeaf = () => {
    navigation.navigate("MainTabs", {
      screen: "Scan",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* ================================
              HEADER
          ================================= */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Diagnosis Result</Text>

            <View style={{ width: 25 }} />
          </View>

          {/* ================================
              IMAGE
          ================================= */}
          <View style={styles.imageContainer}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
          </View>

          {/* ================================
              RESULT CARD
          ================================= */}
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.label}>DETECTED DISEASE</Text>
                <Text style={styles.disease}>{disease}</Text>
              </View>

              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={24} color="#07100E" />
              </View>
            </View>

            {/* CONFIDENCE */}
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceLabel}>AI Confidence</Text>
              <Text style={styles.confidence}>{confidence}%</Text>
            </View>

            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progress,
                  { width: `${confidence}%` },
                ]}
              />
            </View>

            {/* SEVERITY */}
            <View style={styles.severityBox}>
              <Ionicons name="warning-outline" size={20} color="#F3B94D" />

              <View>
                <Text style={styles.severityLabel}>Severity</Text>
                <Text style={styles.severity}>{severity}</Text>
              </View>
            </View>
          </View>

          {/* ================================
              INFORMATION
          ================================= */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={22} color="#19D98A" />

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>What does this mean?</Text>

              <Text style={styles.infoText}>
                The AI model has identified the leaf condition based on the uploaded image. Review the recommended treatment and preventive measures.
              </Text>
            </View>
          </View>

          {/* ================================
              TREATMENT BUTTON
          ================================= */}
          <TouchableOpacity
            style={styles.treatmentButton}
            onPress={viewTreatment}
            activeOpacity={0.8}
          >
            <Ionicons name="medkit-outline" size={21} color="#07100E" />
            <Text style={styles.treatmentText}>View Treatment & Prevention</Text>
            <Ionicons name="arrow-forward" size={20} color="#07100E" />
          </TouchableOpacity>

          {/* ================================
              SAVE TO HISTORY
          ================================= */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveToHistory}
            activeOpacity={0.8}
          >
            <Ionicons name="bookmark-outline" size={20} color="#19D98A" />
            <Text style={styles.saveText}>Save to History</Text>
          </TouchableOpacity>

          {/* ================================
              SCAN ANOTHER LEAF
          ================================= */}
          <TouchableOpacity
            style={styles.scanButton}
            onPress={scanAnotherLeaf}
            activeOpacity={0.8}
          >
            <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
            <Text style={styles.scanText}>Scan Another Leaf</Text>
          </TouchableOpacity>
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

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // ================================
  // HEADER
  // ================================
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  // ================================
  // IMAGE
  // ================================
  imageContainer: {
    height: 300,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0E1916",
    borderWidth: 1,
    borderColor: "#1A332B",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  // ================================
  // RESULT CARD
  // ================================
  resultCard: {
    backgroundColor: "#0E1916",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1A332B",
    padding: 18,
    marginTop: 18,
  },

  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    color: "#71827B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  disease: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    marginTop: 5,
  },

  checkIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#19D98A",
    alignItems: "center",
    justifyContent: "center",
  },

  // ================================
  // CONFIDENCE
  // ================================
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },

  confidenceLabel: {
    color: "#8EA19A",
    fontSize: 13,
  },

  confidence: {
    color: "#19D98A",
    fontSize: 15,
    fontWeight: "800",
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#1A2A25",
    borderRadius: 4,
    marginTop: 9,
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    backgroundColor: "#19D98A",
    borderRadius: 4,
  },

  // ================================
  // SEVERITY
  // ================================
  severityBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#332814",
    borderRadius: 14,
    padding: 13,
    marginTop: 18,
  },

  severityLabel: {
    color: "#8EA19A",
    fontSize: 11,
    marginLeft: 10,
  },

  severity: {
    color: "#F3B94D",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 10,
    marginTop: 2,
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
    marginTop: 18,
  },

  infoTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 10,
  },

  infoText: {
    color: "#84978F",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginLeft: 10,
  },

  // ================================
  // TREATMENT
  // ================================
  treatmentButton: {
    height: 56,
    borderRadius: 17,
    backgroundColor: "#19D98A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    marginTop: 20,
  },

  treatmentText: {
    flex: 1,
    color: "#07100E",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 10,
  },

  // ================================
  // SAVE
  // ================================
  saveButton: {
    height: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#19D98A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  saveText: {
    color: "#19D98A",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },

  // ================================
  // SCAN ANOTHER
  // ================================
  scanButton: {
    height: 54,
    borderRadius: 17,
    backgroundColor: "#101C18",
    borderWidth: 1,
    borderColor: "#1B3029",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  scanText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
});