import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function PreviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { imageUri } = route.params || {};

  const analyzeImage = () => {
    if (!imageUri) return;

    navigation.navigate("Analysis", {
      imageUri,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={25}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Preview
          </Text>

          <View style={{ width: 25 }} />
        </View>

        <Text style={styles.title}>
          Preview Your Leaf
        </Text>

        <Text style={styles.subtitle}>
          Make sure the leaf is clear before analysis
        </Text>

        <View style={styles.imageContainer}>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#19D98A"
          />

          <Text style={styles.infoText}>
            Make sure the tomato leaf is clearly visible
            and properly focused.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={analyzeImage}
          activeOpacity={0.8}
        >
          <Ionicons
            name="sparkles-outline"
            size={22}
            color="#07100E"
          />

          <Text style={styles.analyzeText}>
            Analyze Leaf
          </Text>

          <Ionicons
            name="arrow-forward"
            size={21}
            color="#07100E"
          />
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },

  subtitle: {
    color: "#8EA19A",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 22,
  },

  imageContainer: {
    width: "100%",
    height: 390,
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

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#101C18",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1B3029",
    padding: 14,
    marginTop: 18,
  },

  infoText: {
    flex: 1,
    color: "#8EA19A",
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 10,
  },

  analyzeButton: {
    height: 58,
    borderRadius: 17,
    backgroundColor: "#19D98A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 20,
  },

  analyzeText: {
    flex: 1,
    color: "#07100E",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 12,
  },
});