/* ============================================================= */
/* IMPORTS */
/* ============================================================= */

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  Animated,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { deletePrediction, getPredictions } from "../services/historyService";
import type { DiseaseSeverity, SavedPrediction } from "../types/prediction";

/* ============================================================= */
/* DESIGN TOKENS — shared with HomeScreen for a consistent system */
/* ============================================================= */

type Tone = "positive" | "warning" | "danger";

const COLORS = {
  background: "#07100E",
  card: "#0E1916",
  text: "#FFFFFF",
  textSecondary: "#9BAFA7",
  muted: "#71827B",
  faint: "#5A6B64",
  track: "#1B2925",
  border: "#1D302A",
  primary: "#19D98A",
  primaryDark: "#10372C",
  onPrimary: "#04110C",
  warning: "#F3B94D",
  danger: "#F06C6C",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const RADIUS = {
  sm: 12,
  md: 16,
  lg: 18,
};

const TONES: Record<Tone, { fg: string; bg: string }> = {
  positive: { fg: COLORS.primary, bg: "#10372C" },
  warning: { fg: COLORS.warning, bg: "#34291A" },
  danger: { fg: COLORS.danger, bg: "#341E21" },
};

/* ============================================================= */
/* DATA */
/* ============================================================= */

type Severity = "None" | DiseaseSeverity;

type HistoryEntry = {
  id: string;
  disease: string;
  confidence: number;
  severity: Severity;
  date: string; // dd/mm/yyyy
  dateLabel: string; // relative label shown as the section header
  imageUri: string | null;
};

/** Maps a diagnosis severity to the tone used for its badge, icon and bar. */
const SEVERITY_TONE: Record<Severity, Tone> = {
  None: "positive",
  Mild: "positive",
  Moderate: "warning",
  Severe: "danger",
  Unknown: "warning",
};

function toHistoryEntry(record: SavedPrediction): HistoryEntry {
  const created = new Date(record.createdAt);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
  const dateLabel = sameDay(created, today)
    ? "Today"
    : sameDay(created, yesterday)
      ? "Yesterday"
      : created.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  return {
    id: record.id,
    disease: record.disease,
    confidence: record.confidence,
    severity: record.severity,
    date: created.toLocaleDateString("en-GB"),
    dateLabel,
    imageUri: record.imageUri,
  };
}

type FilterKey = "all" | "healthy" | "disease";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "healthy", label: "Healthy" },
  { key: "disease", label: "Disease" },
];

/* ============================================================= */
/* PRIMITIVES */
/* ============================================================= */

function ScalePressable({
  children,
  onPress,
  style,
  scaleTo = 0.97,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  scaleTo?: number;
  accessibilityLabel?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Leaf glyph used as an image placeholder when no scan photo exists. */
function LeafPlaceholder({ tone }: { tone: Tone }) {
  const colors = TONES[tone];

  return (
    <View style={[styles.thumb, { backgroundColor: colors.bg }]}>
      <Ionicons name="leaf" size={26} color={colors.fg} />
    </View>
  );
}

/* ============================================================= */
/* HEADER */
/* ============================================================= */

function Header({ total }: { total: number }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Diagnosis History</Text>
        <Text style={styles.subtitle}>
          {total} previous tomato leaf scan{total === 1 ? "" : "s"}
        </Text>
      </View>

      <View style={styles.headerIcon}>
        <Ionicons name="time-outline" size={20} color={COLORS.primary} />
      </View>
    </View>
  );
}

/* ============================================================= */
/* SUMMARY STRIP */
/* ============================================================= */

function SummaryStrip({
  total,
  healthy,
  issues,
}: {
  total: number;
  healthy: number;
  issues: number;
}) {
  const items: {
    key: string;
    label: string;
    value: number;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    tone: Tone;
  }[] = [
    { key: "total", label: "Total Scans", value: total, icon: "scan-outline", tone: "positive" },
    { key: "healthy", label: "Healthy", value: healthy, icon: "checkmark-circle-outline", tone: "positive" },
    { key: "issues", label: "Issues Found", value: issues, icon: "alert-circle-outline", tone: "warning" },
  ];

  return (
    <View style={styles.summaryRow}>
      {items.map((item) => {
        const tone = TONES[item.tone];

        return (
          <View key={item.key} style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: tone.bg }]}>
              <Ionicons name={item.icon} size={16} color={tone.fg} />
            </View>
            <Text style={styles.summaryValue}>{item.value}</Text>
            <Text style={styles.summaryLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ============================================================= */
/* FILTER CHIPS */
/* ============================================================= */

function FilterChips({
  active,
  onChange,
  counts,
}: {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
  counts: Record<FilterKey, number>;
}) {
  return (
    <View style={styles.filterRow}>
      {FILTERS.map((filter) => {
        const isActive = filter.key === active;

        return (
          <ScalePressable
            key={filter.key}
            onPress={() => onChange(filter.key)}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
            accessibilityLabel={`Filter: ${filter.label}`}
          >
            <Text
              style={[
                styles.filterChipText,
                isActive && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.filterCount,
                isActive && styles.filterCountActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  isActive && styles.filterCountTextActive,
                ]}
              >
                {counts[filter.key]}
              </Text>
            </View>
          </ScalePressable>
        );
      })}
    </View>
  );
}

/* ============================================================= */
/* SECTION HEADER (date group) */
/* ============================================================= */

function DateSectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.dateHeader}>
      <Text style={styles.dateHeaderText}>{label}</Text>
      <View style={styles.dateHeaderLine} />
    </View>
  );
}

/* ============================================================= */
/* HISTORY CARD */
/* ============================================================= */

function HistoryCard({
  item,
  isLatest,
  onDelete,
}: {
  item: HistoryEntry;
  isLatest: boolean;
  onDelete: () => void;
}) {
  const tone = SEVERITY_TONE[item.severity];
  const toneColors = TONES[tone];
  const isHealthy = item.severity === "None" || item.disease.trim().toLowerCase() === "healthy";

  return (
    <ScalePressable style={styles.card} accessibilityLabel={item.disease}>
      <View>
        <LeafPlaceholder tone={tone} />
        {isLatest && (
          <View style={styles.latestBadge}>
            <Text style={styles.latestBadgeText}>NEW</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.disease} numberOfLines={1}>
            {item.disease}
          </Text>

          <TouchableOpacity
            onPress={onDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.disease} scan`}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.faint} />
          </TouchableOpacity>
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={11} color={COLORS.faint} />
          <Text style={styles.date}>{item.date}</Text>
        </View>

        <View style={styles.confidenceBlock}>
          <View style={styles.confidenceLabelRow}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={[styles.confidenceValue, { color: toneColors.fg }]}>
              {item.confidence}%
            </Text>
          </View>

          <View style={styles.confidenceTrack}>
            <View
              style={[
                styles.confidenceFill,
                { width: `${item.confidence}%`, backgroundColor: toneColors.fg },
              ]}
            />
          </View>
        </View>

        {!isHealthy && (
          <View
            style={[styles.severityBadge, { backgroundColor: toneColors.bg }]}
          >
            <View
              style={[styles.severityDot, { backgroundColor: toneColors.fg }]}
            />
            <Text style={[styles.severityText, { color: toneColors.fg }]}>
              {item.severity} severity
            </Text>
          </View>
        )}
      </View>
    </ScalePressable>
  );
}

/* ============================================================= */
/* EMPTY STATE */
/* ============================================================= */

function EmptyState({ filter }: { filter: FilterKey }) {
  const copy =
    filter === "all"
      ? "Scan a tomato leaf to start building your diagnosis history."
      : filter === "healthy"
      ? "No healthy scans yet. Results will appear here once your plants check out clean."
      : "No disease detections yet. That's good news for your farm.";

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="leaf-outline" size={28} color={COLORS.muted} />
      </View>
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptyText}>{copy}</Text>
    </View>
  );
}

function HistoryLoading() {
  return (
    <View style={styles.loadState}>
      <ActivityIndicator color={COLORS.primary} />
      <Text style={styles.loadText}>Loading saved scans...</Text>
    </View>
  );
}

function HistoryLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.loadState}>
      <Ionicons name="cloud-offline-outline" size={25} color={COLORS.warning} />
      <Text style={styles.emptyTitle}>History could not be loaded</Text>
      <Text style={styles.loadText}>Check device storage and try again.</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ============================================================= */
/* SCREEN */
/* ============================================================= */

type Section = { title: string; data: HistoryEntry[] };

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getPredictions();
      setHistory(records.map(toHistoryEntry));
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const confirmDelete = (entry: HistoryEntry) => {
    Alert.alert(
      "Delete scan?",
      `Remove the ${entry.disease} record from this device?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePrediction(entry.id);
              setHistory((current) => current.filter((item) => item.id !== entry.id));
            } catch (error) {
              Alert.alert(
                "Could not delete scan",
                error instanceof Error ? error.message : "Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const counts = useMemo<Record<FilterKey, number>>(
    () => ({
      all: history.length,
      healthy: history.filter((h) => h.severity === "None" || h.disease.trim().toLowerCase() === "healthy").length,
      disease: history.filter((h) => h.severity !== "None" && h.disease.trim().toLowerCase() !== "healthy").length,
    }),
    [history]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return history;
    if (filter === "healthy") {
      return history.filter((h) => h.severity === "None" || h.disease.trim().toLowerCase() === "healthy");
    }
    return history.filter((h) => h.severity !== "None" && h.disease.trim().toLowerCase() !== "healthy");
  }, [history, filter]);

  // Group entries by their relative date label, preserving newest-first order.
  const sections = useMemo<Section[]>(() => {
    const groups: Section[] = [];

    filtered.forEach((entry) => {
      const existing = groups.find((g) => g.title === entry.dateLabel);
      if (existing) {
        existing.data.push(entry);
      } else {
        groups.push({ title: entry.dateLabel, data: [entry] });
      }
    });

    return groups;
  }, [filtered]);

  const latestId = history[0]?.id;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            {loadError && history.length > 0 ? (
              <TouchableOpacity onPress={() => void loadHistory()} style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>Couldn’t refresh saved scans. Tap to retry.</Text>
              </TouchableOpacity>
            ) : null}
            <Header total={history.length} />
            <SummaryStrip
              total={counts.all}
              healthy={counts.healthy}
              issues={counts.disease}
            />
            <FilterChips active={filter} onChange={setFilter} counts={counts} />
          </>
        }
        ListEmptyComponent={
          isLoading ? <HistoryLoading /> : loadError ? <HistoryLoadError onRetry={() => void loadHistory()} /> : <EmptyState filter={filter} />
        }
        renderSectionHeader={({ section }) => (
          <DateSectionHeader label={section.title} />
        )}
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            isLatest={item.id === latestId}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        SectionSeparatorComponent={() => <View style={{ height: SPACING.xs }} />}
      />
    </SafeAreaView>
  );
}

/* ============================================================= */
/* STYLES */
/* ============================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  list: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: 120,
    flexGrow: 1,
  },

  /* ------------------------------ Header ------------------------------ */

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },

  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "500",
    marginTop: SPACING.xs,
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm - 2,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ------------------------------ Summary strip ------------------------------ */

  summaryRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },

  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },

  summaryValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },

  /* ------------------------------ Filters ------------------------------ */

  filterRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs + 2,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  filterChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },

  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  filterChipTextActive: {
    color: COLORS.primary,
  },

  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.track,
    alignItems: "center",
    justifyContent: "center",
  },

  filterCountActive: {
    backgroundColor: "#0B241C",
  },

  filterCountText: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: "800",
  },

  filterCountTextActive: {
    color: COLORS.primary,
  },

  /* ------------------------------ Date section header ------------------------------ */

  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },

  dateHeaderText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  /* ------------------------------ Card ------------------------------ */

  card: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,

    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },

  thumb: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md - 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  latestBadge: {
    position: "absolute",
    top: -6,
    left: -6,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },

  latestBadgeText: {
    color: COLORS.onPrimary,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  cardBody: {
    flex: 1,
    justifyContent: "center",
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  disease: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginRight: SPACING.sm,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  date: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "500",
  },

  confidenceBlock: {
    marginTop: SPACING.sm + 2,
  },

  confidenceLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  confidenceLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
  },

  confidenceValue: {
    fontSize: 10,
    fontWeight: "800",
  },

  confidenceTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.track,
    overflow: "hidden",
  },

  confidenceFill: {
    height: "100%",
    borderRadius: 3,
  },

  severityBadge: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 5,
    borderRadius: 9,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    marginTop: SPACING.sm,
  },

  severityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  severityText: {
    fontSize: 10,
    fontWeight: "700",
  },

  /* ------------------------------ Empty state ------------------------------ */

  emptyState: {
    alignItems: "center",
    paddingTop: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: SPACING.xs,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  loadState: {
    alignItems: "center",
    paddingTop: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },

  loadText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: SPACING.sm,
  },

  retryButton: {
    backgroundColor: COLORS.primaryDark,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },

  retryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  errorBanner: {
    backgroundColor: "#332814",
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },

  errorBannerText: {
    color: COLORS.warning,
    fontSize: 11,
    textAlign: "center",
  },
});