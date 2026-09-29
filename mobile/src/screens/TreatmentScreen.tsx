import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Treatment">;
type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Guidance = {
  summary: string;
  cultural: string;
};

const DEFAULT_GUIDANCE: Guidance = {
  summary:
    "Use these general plant-care steps while you monitor symptoms. Confirm the diagnosis with a qualified local agricultural adviser before choosing a disease-specific product.",
  cultural:
    "Prioritize sanitation, good airflow, and careful watering. Ask a local agricultural extension service whether any biological or organic option is appropriate for the confirmed diagnosis.",
};

const DISEASE_GUIDANCE: Record<string, Guidance> = {
  "early blight": {
    summary:
      "For suspected Early Blight, remove severely affected foliage when practical, keep leaves dry, and monitor whether symptoms appear on new growth. Confirm the diagnosis locally before treatment.",
    cultural:
      "Use clean tools, remove affected plant debris, and improve airflow around plants. Ask a local agricultural extension service whether a biological or organic option is appropriate.",
  },
  "late blight": {
    summary:
      "For suspected Late Blight, keep affected plants under close observation and promptly seek local agricultural advice to confirm the diagnosis and containment steps.",
    cultural:
      "Avoid moving potentially affected plant material between plants, keep foliage dry, and clean tools after use. Ask a local agricultural extension service for locally appropriate options.",
  },
  "leaf mold": {
    summary:
      "For suspected Leaf Mold, focus on reducing prolonged leaf wetness and improving airflow. Monitor new growth and confirm the diagnosis before choosing a treatment.",
    cultural:
      "Maintain good spacing, water near the soil, and remove severely affected leaves with clean tools where appropriate. Seek local advice about biological or organic options.",
  },
};

const IMMEDIATE_ACTIONS: { icon: IconName; text: string }[] = [
  { icon: "leaf-outline", text: "Remove severely affected leaves where appropriate." },
  { icon: "water-outline", text: "Avoid unnecessary overhead watering; keep foliage as dry as practical." },
  { icon: "eye-outline", text: "Keep affected plants under observation." },
  { icon: "cut-outline", text: "Clean gardening tools before and after use." },
];

const PREVENTION_TIPS: { icon: IconName; title: string; detail: string }[] = [
  { icon: "resize-outline", title: "Space plants well", detail: "Allow room for foliage to dry and air to move." },
  { icon: "leaf-outline", title: "Support air circulation", detail: "Keep the canopy manageable and avoid crowding." },
  { icon: "search-outline", title: "Monitor regularly", detail: "Check leaves and stems for changes in symptoms." },
  { icon: "sparkles-outline", title: "Keep tools and beds clean", detail: "Remove plant debris and clean tools between plants." },
  { icon: "water-outline", title: "Water appropriately", detail: "Prefer watering at soil level and avoid overwatering." },
];

function GuidanceSection({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={19} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function TreatmentScreen({ navigation, route }: Props) {
  const { disease, severity, confidence } = route.params;
  const guidance = DISEASE_GUIDANCE[disease.trim().toLowerCase()] ?? DEFAULT_GUIDANCE;
  const isSeverityElevated = /severe|moderate/i.test(severity);
  const confidenceProgress = Math.min(Math.max(confidence, 0), 100);

  const scanAnotherLeaf = () => {
    navigation.navigate("MainTabs", { screen: "Scan" });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to result"
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Treatment &amp; Prevention</Text>
            <Text style={styles.subtitle}>Recommended care for your tomato plant</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="leaf" size={22} color={colors.primary} />
            </View>
            <View style={styles.severityBadge}>
              <View
                style={[
                  styles.severityDot,
                  isSeverityElevated ? styles.severityWarningDot : styles.severityPositiveDot,
                ]}
              />
              <Text
                style={[
                  styles.severityText,
                  isSeverityElevated ? styles.severityWarningText : styles.severityPositiveText,
                ]}
              >
                {severity}
              </Text>
            </View>
          </View>
          <Text style={styles.eyebrow}>DIAGNOSIS</Text>
          <Text style={styles.diseaseName}>{disease}</Text>
          <View style={styles.confidenceRow}>
            <Text style={styles.bodyLabel}>AI confidence</Text>
            <Text style={styles.confidenceValue}>{confidence}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${confidenceProgress}%` }]} />
          </View>
        </View>

        <GuidanceSection icon="flash-outline" title="Immediate Actions">
          {IMMEDIATE_ACTIONS.map((action) => (
            <View key={action.text} style={styles.actionRow}>
              <Ionicons name={action.icon} size={18} color={colors.primary} />
              <Text style={styles.bodyText}>{action.text}</Text>
            </View>
          ))}
        </GuidanceSection>

        <GuidanceSection icon="medkit-outline" title="Treatment Recommendations">
          <Text style={styles.guidanceText}>{guidance.summary}</Text>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Cultural / organic options</Text>
            <Text style={styles.guidanceText}>{guidance.cultural}</Text>
          </View>
          <View style={styles.cautionBox}>
            <Ionicons name="alert-circle-outline" size={19} color={colors.warning} />
            <Text style={styles.cautionText}>
              Chemical treatment is not specified here. Use only products verified for the confirmed disease and approved for tomatoes in your area; follow the product label and local agricultural guidance. No dosage or cure is provided.
            </Text>
          </View>
        </GuidanceSection>

        <GuidanceSection icon="shield-checkmark-outline" title="Prevention Tips">
          {PREVENTION_TIPS.map((tip) => (
            <View key={tip.title} style={styles.tipRow}>
              <Ionicons name={tip.icon} size={18} color={colors.primary} />
              <View style={styles.tipCopy}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.bodyText}>{tip.detail}</Text>
              </View>
            </View>
          ))}
        </GuidanceSection>

        <GuidanceSection icon="eye-outline" title="Monitoring">
          <View style={styles.actionRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.bodyText}>Check the plant regularly and track changes in symptoms.</Text>
          </View>
          <View style={styles.actionRow}>
            <Ionicons name="scan-outline" size={18} color={colors.primary} />
            <Text style={styles.bodyText}>Scan again when symptoms change or you need an updated assessment.</Text>
          </View>
        </GuidanceSection>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={19} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Back to Result</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={scanAnotherLeaf}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-outline" size={20} color={colors.onPrimary} />
          <Text style={styles.primaryButtonText}>Scan Another Leaf</Text>
          <Ionicons name="arrow-forward" size={19} color={colors.onPrimary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#07100E",
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginRight: spacing.md,
  },
  headerText: { flex: 1 },
  title: {
    color: colors.textPrimary,
    ...typography.h2,
  },
  subtitle: {
    color: colors.textSecondary,
    ...typography.caption,
    marginTop: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#10372C",
    alignItems: "center",
    justifyContent: "center",
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  severityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: spacing.xs + 2,
  },
  severityWarningDot: { backgroundColor: colors.warning },
  severityPositiveDot: { backgroundColor: colors.primary },
  severityWarningText: { color: colors.warning },
  severityPositiveText: { color: colors.primary },
  severityText: {
    fontSize: 12,
    fontWeight: "700",
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  diseaseName: {
    color: colors.textPrimary,
    ...typography.h1,
    marginTop: spacing.xs,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  bodyLabel: { color: colors.textSecondary, ...typography.caption },
  confidenceValue: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  progressTrack: {
    height: 7,
    backgroundColor: colors.input,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#10372C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  sectionTitle: { color: colors.textPrimary, ...typography.h3 },
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.sm,
  },
  bodyText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginLeft: spacing.sm,
  },
  guidanceText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  subsection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  subsectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  cautionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#332814",
    borderRadius: 13,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  cautionText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: spacing.sm,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
  },
  tipCopy: { flex: 1, marginLeft: spacing.sm },
  tipTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  secondaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    marginTop: spacing.xs,
  },
  secondaryButtonText: {
    color: colors.primary,
    ...typography.button,
    marginLeft: spacing.sm,
  },
  primaryButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    borderRadius: 17,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    flex: 1,
    color: colors.onPrimary,
    ...typography.button,
    textAlign: "center",
  },
});