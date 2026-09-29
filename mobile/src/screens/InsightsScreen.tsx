import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  background: "#07100E",
  card: "#0E1916",
  cardLight: "#1B2925",
  primary: "#19D98A",
  text: "#FFFFFF",
  secondary: "#9BAFA7",
  border: "#1D302A",
  red: "#F06C6C",
  yellow: "#F3B94D",
  blue: "#75BFA0",
};

const weeklyData = [
  { day: "Mon", value: 35 },
  { day: "Tue", value: 65 },
  { day: "Wed", value: 45 },
  { day: "Thu", value: 85 },
  { day: "Fri", value: 55 },
  { day: "Sat", value: 75 },
  { day: "Sun", value: 40 },
];

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.subtitle}>
              Understand your crop health
            </Text>
          </View>

          <View style={styles.iconButton}>
            <Ionicons
              name="calendar-outline"
              size={21}
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* OVERVIEW */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.period}>Last 7 days</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="scan-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.statValue}>48</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
            <Text style={styles.statChange}>+12% this week</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="leaf-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.statValue}>82%</Text>
            <Text style={styles.statLabel}>Healthy Plants</Text>
            <Text style={styles.statChange}>+5% this week</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={COLORS.yellow}
              />
            </View>

            <Text style={styles.statValue}>08</Text>
            <Text style={styles.statLabel}>Diseases Found</Text>
            <Text style={styles.statWarning}>Needs attention</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.statValue}>76%</Text>
            <Text style={styles.statLabel}>Crop Vitality</Text>
            <Text style={styles.statChange}>Good condition</Text>
          </View>
        </View>

        {/* WEEKLY ACTIVITY */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>
              Weekly Scan Activity
            </Text>

            <Ionicons
              name="stats-chart-outline"
              size={20}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.chartValue}>48 Scans</Text>
          <Text style={styles.chartSubtitle}>
            Your scanning activity this week
          </Text>

          <View style={styles.chart}>
            {weeklyData.map((item, index) => (
              <View key={item.day} style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${item.value}%` },
                      index === 3 && styles.highlightBar,
                    ]}
                  />
                </View>

                <Text style={styles.dayLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* DISEASE DISTRIBUTION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Disease Distribution
          </Text>

          <Text style={styles.cardSubtitle}>
            Based on your recent scans
          </Text>

          <View style={styles.diseaseRow}>
            <View
              style={[
                styles.diseaseDot,
                { backgroundColor: COLORS.red },
              ]}
            />
            <Text style={styles.diseaseName}>Early Blight</Text>
            <Text style={styles.diseaseCount}>4 cases</Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: "50%", backgroundColor: COLORS.red },
              ]}
            />
          </View>

          <View style={styles.diseaseRow}>
            <View
              style={[
                styles.diseaseDot,
                { backgroundColor: COLORS.yellow },
              ]}
            />
            <Text style={styles.diseaseName}>Late Blight</Text>
            <Text style={styles.diseaseCount}>2 cases</Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: "25%", backgroundColor: COLORS.yellow },
              ]}
            />
          </View>

          <View style={styles.diseaseRow}>
            <View
              style={[
                styles.diseaseDot,
                { backgroundColor: COLORS.blue },
              ]}
            />
            <Text style={styles.diseaseName}>Leaf Mold</Text>
            <Text style={styles.diseaseCount}>2 cases</Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: "25%", backgroundColor: COLORS.blue },
              ]}
            />
          </View>
        </View>

        {/* CROP HEALTH */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>
              Crop Health Summary
            </Text>

            <Ionicons
              name="leaf-outline"
              size={20}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.healthRow}>
            <View>
              <Text style={styles.healthLabel}>
                Overall Crop Vitality
              </Text>

              <Text style={styles.healthDescription}>
                Based on sample dashboard data
              </Text>
            </View>

            <Text style={styles.healthPercentage}>76%</Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: "76%" },
              ]}
            />
          </View>

          <View style={styles.healthStatus}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={COLORS.primary}
            />

            <Text style={styles.healthStatusText}>
              Continue regular monitoring of your plants.
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Sample dashboard data. Real analytics will be connected
          with prediction history.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "800",
  },

  subtitle: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 5,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 13,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },

  period: {
    color: COLORS.primary,
    fontSize: 12,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    marginBottom: 18,
  },

  statCard: {
    width: "46%",
    margin: "2%",
    backgroundColor: COLORS.card,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
  },

  statIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#10372C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
  },

  statLabel: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 4,
  },

  statChange: {
    color: COLORS.primary,
    fontSize: 10,
    marginTop: 10,
  },

  statWarning: {
    color: COLORS.yellow,
    fontSize: 10,
    marginTop: 10,
  },

  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  chartValue: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "800",
    marginTop: 20,
  },

  chartSubtitle: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 4,
  },

  chart: {
    height: 145,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    marginTop: 20,
  },

  barContainer: {
    alignItems: "center",
    flex: 1,
  },

  barBackground: {
    height: 110,
    width: 19,
    backgroundColor: COLORS.cardLight,
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  bar: {
    width: "100%",
    backgroundColor: "#10372C",
    borderRadius: 8,
  },

  highlightBar: {
    backgroundColor: COLORS.primary,
  },

  dayLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 9,
  },

  cardSubtitle: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 5,
    marginBottom: 20,
  },

  diseaseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
  },

  diseaseDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 9,
  },

  diseaseName: {
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
  },

  diseaseCount: {
    color: COLORS.secondary,
    fontSize: 12,
  },

  progressBackground: {
    height: 6,
    backgroundColor: COLORS.cardLight,
    borderRadius: 5,
    marginTop: 9,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },

  healthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
  },

  healthLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },

  healthDescription: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 5,
  },

  healthPercentage: {
    color: COLORS.primary,
    fontSize: 25,
    fontWeight: "800",
  },

  healthStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 17,
  },

  healthStatusText: {
    color: COLORS.secondary,
    fontSize: 11,
    marginLeft: 8,
    flex: 1,
  },

  disclaimer: {
    color: COLORS.secondary,
    fontSize: 10,
    textAlign: "center",
    marginHorizontal: 25,
    marginBottom: 25,
    lineHeight: 16,
  },
});