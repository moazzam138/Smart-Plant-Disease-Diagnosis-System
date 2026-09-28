import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

/* ============================================================= */
/* DESIGN TOKENS */
/* ============================================================= */

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Tone = "positive" | "warning" | "danger";

const COLORS = {
  background: "#07100E",
  card: "#0E1916",
  cardAlt: "#10211C",
  hero: "#0F2A21",
  primary: "#19D98A",
  primaryDark: "#10372C",
  onPrimary: "#04110C",
  text: "#FFFFFF",
  textSecondary: "#9BAFA7",
  muted: "#71827B",
  faint: "#5A6B64",
  track: "#1B2925",
  border: "#1D302A",
  borderStrong: "#245844",
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
  xxxl: 32,
};

const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
};

const SCREEN_PADDING = SPACING.xl;
const TAB_BAR_CLEARANCE = 120;

/** Tone → colors used for stat cards, activity icons and badges. */
const TONES: Record<Tone, { fg: string; bg: string; border: string }> = {
  positive: { fg: COLORS.primary, bg: "#10372C", border: "#1D6048" },
  warning: { fg: COLORS.warning, bg: "#34291A", border: "#5A4424" },
  danger: { fg: COLORS.danger, bg: "#341E21", border: "#5C2F34" },
};

/** Existing tab routes. Change here if your navigator uses other names. */
const ROUTES = {
  scan: "Scan",
  history: "History",
  insights: "Insights",
  profile: "Profile",
};

/* ============================================================= */
/* SCREEN DATA */
/* ============================================================= */

const STATS: {
  id: string;
  icon: IconName;
  value: string;
  label: string;
  trend: string;
  trendIcon: IconName;
  tone: Tone;
}[] = [
  {
    id: "scans",
    icon: "scan-outline",
    value: "48",
    label: "Total Scans",
    trend: "+12 this month",
    trendIcon: "trending-up",
    tone: "positive",
  },
  {
    id: "diseases",
    icon: "warning-outline",
    value: "6",
    label: "Diseases Detected",
    trend: "2 active",
    trendIcon: "alert-circle-outline",
    tone: "warning",
  },
  {
    id: "health",
    icon: "heart-outline",
    value: "82%",
    label: "Farm Health",
    trend: "+4% this month",
    trendIcon: "trending-up",
    tone: "positive",
  },
  {
    id: "alerts",
    icon: "notifications-outline",
    value: "1",
    label: "Active Alerts",
    trend: "Needs attention",
    trendIcon: "alert-circle-outline",
    tone: "danger",
  },
];

const ACTIVITIES: {
  id: string;
  icon: IconName;
  tone: Tone;
  title: string;
  description: string;
  time: string;
}[] = [
  {
    id: "scan",
    icon: "scan-outline",
    tone: "positive",
    title: "Leaf Scan Completed",
    description: "Early Blight detected with 93% confidence",
    time: "Today • 10:45 AM",
  },
  {
    id: "weather",
    icon: "cloud-outline",
    tone: "warning",
    title: "Weather Alert",
    description: "High humidity may increase disease risk",
    time: "Today • 08:30 AM",
  },
];

const TOOLS: {
  id: string;
  icon: IconName;
  title: string;
  subtitle: string;
  route?: string;
}[] = [
  {
    id: "library",
    icon: "book-outline",
    title: "Tomato Library",
    subtitle: "Diseases & guides",
  },
  {
    id: "weather",
    icon: "partly-sunny-outline",
    title: "Weather Intel",
    subtitle: "Risk & forecast",
    route: ROUTES.insights,
  },
  {
    id: "medicine",
    icon: "qr-code-outline",
    title: "Verify Medicine",
    subtitle: "Scan medicine QR",
  },
  {
    id: "expert",
    icon: "people-outline",
    title: "Expert Help",
    subtitle: "Get assistance",
  },
];

/* ============================================================= */
/* REUSABLE PRIMITIVES */
/* ============================================================= */

/** Pressable with a subtle native-driven scale for tactile feedback. */
function ScalePressable({
  children,
  onPress,
  style,
  containerStyle,
  scaleTo = 0.97,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
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
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Small status dot with an expanding halo (used for LIVE / Ready states). */
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.8],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  return (
    <View
      style={{
        width: size * 2,
        height: size * 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/** Title row used above every section. */
function SectionHeader({
  title,
  actionLabel,
  onActionPress,
  trailing,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {trailing}

      {actionLabel ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={12}
          style={styles.sectionAction}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title}`}
        >
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Circular progress ring built only from Views (no SVG dependency).
 * Two clipped half-rings are rotated to represent 0–100%.
 */
function HealthRing({
  percent,
  size = 104,
  thickness = 10,
  children,
}: {
  percent: number;
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const angle = clamped * 3.6;
  const rightRotation = Math.min(angle, 180) - 135;
  const leftRotation = angle > 180 ? angle - 315 : -135;

  const circleBase = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: thickness,
    borderColor: "transparent",
  } as const;

  return (
    <View style={{ width: size, height: size }}>
      {/* Track */}
      <View
        style={[
          styles.ringAbsolute,
          circleBase,
          { borderColor: COLORS.track },
        ]}
      />

      {/* Right half (0° – 180°) */}
      <View
        style={{
          position: "absolute",
          left: size / 2,
          width: size / 2,
          height: size,
          overflow: "hidden",
        }}
      >
        <View
          style={[
            styles.ringAbsolute,
            circleBase,
            {
              left: -size / 2,
              borderTopColor: COLORS.primary,
              borderRightColor: COLORS.primary,
              transform: [{ rotate: `${rightRotation}deg` }],
            },
          ]}
        />
      </View>

      {/* Left half (180° – 360°) */}
      <View
        style={{
          position: "absolute",
          left: 0,
          width: size / 2,
          height: size,
          overflow: "hidden",
        }}
      >
        <View
          style={[
            styles.ringAbsolute,
            circleBase,
            {
              left: 0,
              borderBottomColor: COLORS.primary,
              borderLeftColor: COLORS.primary,
              transform: [{ rotate: `${leftRotation}deg` }],
            },
          ]}
        />
      </View>

      {/* Center content */}
      <View style={styles.ringCenter}>{children}</View>
    </View>
  );
}

/** Corner brackets that give a "viewfinder" feel to scan visuals. */
function ViewfinderCorners({ inset = 0 }: { inset?: number }) {
  return (
    <>
      <View style={[styles.corner, styles.cornerTL, { top: inset, left: inset }]} />
      <View style={[styles.corner, styles.cornerTR, { top: inset, right: inset }]} />
      <View style={[styles.corner, styles.cornerBL, { bottom: inset, left: inset }]} />
      <View style={[styles.corner, styles.cornerBR, { bottom: inset, right: inset }]} />
    </>
  );
}

/* ============================================================= */
/* 3. HEADER */
/* ============================================================= */

function Header({ onProfilePress }: { onProfilePress: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logo}>
          <Ionicons name="leaf" size={22} color={COLORS.primary} />
          <View style={styles.logoBadge}>
            <Ionicons name="sparkles" size={8} color={COLORS.onPrimary} />
          </View>
        </View>

        <View style={styles.headerTextWrap}>
          <Text style={styles.appName} numberOfLines={1}>
            AgriCare AI
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Smart Plant Health
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <View style={styles.statusPill}>
          <PulseDot color={COLORS.primary} size={6} />
          <Text style={styles.statusText}>Farm Ready</Text>
        </View>

        <ScalePressable
          onPress={onProfilePress}
          style={styles.profileCircle}
          scaleTo={0.92}
          accessibilityLabel="Open profile"
        >
          <Text style={styles.profileLetter}>M</Text>
        </ScalePressable>
      </View>
    </View>
  );
}

/* ============================================================= */
/* 4. WELCOME */
/* ============================================================= */

function Welcome() {
  return (
    <View style={styles.welcome}>
      <View style={styles.welcomeLeft}>
        <Text style={styles.greeting}>Good Morning 👋</Text>
        <Text style={styles.farmerName} numberOfLines={1}>
          Moazzam
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.muted} />
          <Text style={styles.locationText} numberOfLines={1}>
            Bareilly, U.P., India
          </Text>
        </View>
      </View>

      <ScalePressable
        style={styles.farmSelector}
        accessibilityLabel="Active farm: Tomato Farm"
        scaleTo={0.96}
      >
        <View style={styles.farmSelectorIcon}>
          <Ionicons name="leaf-outline" size={14} color={COLORS.primary} />
        </View>

        <View>
          <Text style={styles.farmSelectorLabel}>Active farm</Text>
          <Text style={styles.farmSelectorName}>Tomato Farm</Text>
        </View>

        <Ionicons name="chevron-down" size={14} color={COLORS.muted} />
      </ScalePressable>
    </View>
  );
}

/* ============================================================= */
/* 5. SCAN HERO */
/* ============================================================= */

function ScanHero({ onScanPress }: { onScanPress: () => void }) {
  return (
    <View style={styles.heroShadow}>
      <View style={styles.heroCard}>
        {/* Subtle ambient glow */}
        <View style={styles.heroGlowLarge} />
        <View style={styles.heroGlowSmall} />

        <View style={styles.heroTop}>
          <View style={styles.heroTextArea}>
            <View style={styles.heroEyebrow}>
              <Ionicons name="sparkles" size={11} color={COLORS.primary} />
              <Text style={styles.heroEyebrowText}>AI Scan</Text>
            </View>

            <Text style={styles.heroTitle}>Is your tomato plant healthy?</Text>

            <Text style={styles.heroDescription}>
              Capture or upload a leaf photo. AI detects disease and gives you
              actionable guidance.
            </Text>
          </View>

          <View style={styles.viewfinder}>
            <ViewfinderCorners />
            <Ionicons name="leaf" size={28} color={COLORS.primary} />
          </View>
        </View>

        <ScalePressable
          onPress={onScanPress}
          style={styles.scanButton}
          containerStyle={styles.scanButtonContainer}
          scaleTo={0.98}
          accessibilityLabel="Scan tomato leaf"
        >
          <View style={styles.scanButtonIconLeft}>
            <Ionicons name="scan" size={18} color={COLORS.onPrimary} />
          </View>

          <Text style={styles.scanButtonText}>Scan Tomato Leaf</Text>

          <View style={styles.scanButtonIconRight}>
            <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
          </View>
        </ScalePressable>

        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Ionicons name="flash" size={13} color={COLORS.primary} />
            <Text style={styles.trustText}>Instant Analysis</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustItem}>
            <Ionicons
              name="shield-checkmark"
              size={13}
              color={COLORS.primary}
            />
            <Text style={styles.trustText}>95%+ Precision</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ============================================================= */
/* 6. AI STATUS */
/* ============================================================= */

function AiStatus() {
  return (
    <View style={styles.aiStatus}>
      <View style={styles.aiStatusIcon}>
        <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
      </View>

      <View style={styles.aiStatusContent}>
        <Text style={styles.aiStatusTitle}>AI Crop Monitoring Active</Text>
        <Text style={styles.aiStatusText} numberOfLines={1}>
          Your farm is being monitored for disease risk.
        </Text>
      </View>

      <View style={styles.liveBadge}>
        <PulseDot color={COLORS.primary} size={5} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </View>
  );
}

/* ============================================================= */
/* 7. FARM OVERVIEW */
/* ============================================================= */

function FarmOverview({ cardWidth }: { cardWidth: number }) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Farm Overview"
        trailing={
          <View style={styles.periodChip}>
            <Ionicons name="calendar-outline" size={11} color={COLORS.muted} />
            <Text style={styles.periodChipText}>This month</Text>
          </View>
        }
      />

      <View style={styles.grid}>
        {STATS.map((stat) => {
          const tone = TONES[stat.tone];

          return (
            <View
              key={stat.id}
              style={[
                styles.statCard,
                { width: cardWidth, borderColor: `${tone.fg}2E` },
              ]}
            >
              <View style={styles.statTop}>
                <View style={[styles.statIcon, { backgroundColor: tone.bg }]}>
                  <Ionicons name={stat.icon} size={18} color={tone.fg} />
                </View>

                <View
                  style={[
                    styles.statAccentDot,
                    { backgroundColor: tone.fg },
                  ]}
                />
              </View>

              <Text style={styles.statValue}>{stat.value}</Text>

              <Text style={styles.statLabel} numberOfLines={1}>
                {stat.label}
              </Text>

              <View style={styles.statTrendRow}>
                <Ionicons name={stat.trendIcon} size={12} color={tone.fg} />
                <Text
                  style={[styles.statTrendText, { color: tone.fg }]}
                  numberOfLines={1}
                >
                  {stat.trend}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ============================================================= */
/* 8. CROP VITALITY */
/* ============================================================= */

function CropVitality() {
  const health = 78;

  return (
    <View style={styles.vitalityCard}>
      <View style={styles.vitalityHeader}>
        <View>
          <Text style={styles.cardTitle}>Crop Vitality</Text>
          <Text style={styles.cardSubtitle}>Overall Farm Health</Text>
        </View>

        <View style={styles.healthBadge}>
          <Ionicons name="trending-up" size={13} color={COLORS.primary} />
          <Text style={styles.healthBadgeText}>Healthy</Text>
        </View>
      </View>

      <View style={styles.vitalityBody}>
        <HealthRing percent={health} size={104} thickness={10}>
          <Text style={styles.ringValue}>{health}%</Text>
          <Text style={styles.ringLabel}>Health</Text>
        </HealthRing>

        <View style={styles.vitalityInfo}>
          <View style={styles.vitalityPoint}>
            <Ionicons name="alert-circle" size={15} color={COLORS.warning} />
            <Text style={styles.vitalityPointText}>
              3 plants require monitoring
            </Text>
          </View>

          <View style={styles.vitalityPoint}>
            <Ionicons name="checkmark-circle" size={15} color={COLORS.primary} />
            <Text style={styles.vitalityPointText}>
              Weather conditions are favorable
            </Text>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Farm health</Text>
              <Text style={styles.progressValue}>{health}%</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${health}%` }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ============================================================= */
/* 9. RECENT ACTIVITY */
/* ============================================================= */

function RecentActivity({
  onViewAll,
  onItemPress,
}: {
  onViewAll: () => void;
  onItemPress: () => void;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Recent Activity"
        actionLabel="View All"
        onActionPress={onViewAll}
      />

      {ACTIVITIES.map((item) => {
        const tone = TONES[item.tone];

        return (
          <ScalePressable
            key={item.id}
            onPress={onItemPress}
            style={styles.activityCard}
            containerStyle={styles.activityContainer}
            scaleTo={0.98}
            accessibilityLabel={`${item.title}. ${item.description}`}
          >
            <View style={[styles.activityIcon, { backgroundColor: tone.bg }]}>
              <Ionicons name={item.icon} size={20} color={tone.fg} />
              <View
                style={[styles.activityStatusDot, { backgroundColor: tone.fg }]}
              />
            </View>

            <View style={styles.activityContent}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.activityDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.activityTimeRow}>
                <Ionicons name="time-outline" size={11} color={COLORS.faint} />
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color={COLORS.faint} />
          </ScalePressable>
        );
      })}
    </View>
  );
}

/* ============================================================= */
/* 10. LATEST DIAGNOSIS */
/* ============================================================= */

function LatestDiagnosis({
  onViewAll,
  onReportPress,
}: {
  onViewAll: () => void;
  onReportPress: () => void;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Latest Diagnosis"
        actionLabel="View All"
        onActionPress={onViewAll}
      />

      <View style={styles.diagnosisCard}>
        <View style={styles.diagnosisTop}>
          {/* Placeholder leaf visual (no external image needed) */}
          <View style={styles.diagnosisVisual}>
            <ViewfinderCorners inset={6} />
            <Ionicons name="leaf" size={32} color={COLORS.primary} />
            <View style={styles.diagnosisSpot} />
            <View style={[styles.diagnosisSpot, styles.diagnosisSpotAlt]} />
          </View>

          <View style={styles.diagnosisInfo}>
            <View style={styles.diagnosisTitleRow}>
              <Text style={styles.diagnosisName} numberOfLines={1}>
                Early Blight
              </Text>

              <View style={styles.severityBadge}>
                <View style={styles.severityDot} />
                <Text style={styles.severityText}>Moderate</Text>
              </View>
            </View>

            <Text style={styles.diagnosisMeta}>Tomato • Today</Text>

            <Text style={styles.diagnosisDescription}>
              Fungal infection detected. Early treatment is recommended.
            </Text>
          </View>
        </View>

        <ScalePressable
          onPress={onReportPress}
          style={styles.reportButton}
          scaleTo={0.98}
          accessibilityLabel="View full diagnostic report"
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.reportButtonText}>View Full Diagnostic Report</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
        </ScalePressable>
      </View>
    </View>
  );
}

/* ============================================================= */
/* 11. QUICK TOOLS */
/* ============================================================= */

function QuickTools({
  cardWidth,
  onToolPress,
}: {
  cardWidth: number;
  onToolPress: (route?: string) => void;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Quick Tools" />

      <View style={styles.grid}>
        {TOOLS.map((tool) => (
          <ScalePressable
            key={tool.id}
            onPress={() => onToolPress(tool.route)}
            style={styles.toolCard}
            containerStyle={{ width: cardWidth }}
            scaleTo={0.97}
            accessibilityLabel={`${tool.title}. ${tool.subtitle}`}
          >
            <View style={styles.toolTop}>
              <View style={styles.toolIcon}>
                <Ionicons name={tool.icon} size={19} color={COLORS.primary} />
              </View>
              <Ionicons name="arrow-forward" size={15} color={COLORS.faint} />
            </View>

            <Text style={styles.toolTitle} numberOfLines={1}>
              {tool.title}
            </Text>
            <Text style={styles.toolSubtitle} numberOfLines={1}>
              {tool.subtitle}
            </Text>
          </ScalePressable>
        ))}
      </View>
    </View>
  );
}

/* ============================================================= */
/* 2. COMPONENT */
/* ============================================================= */

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  // Two-column card width that adapts to any phone size.
  const cardWidth = Math.floor((width - SCREEN_PADDING * 2 - SPACING.md) / 2);

  const go = (route?: string) => {
    if (route) navigation.navigate(route);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header onProfilePress={() => go(ROUTES.profile)} />

        <Welcome />

        <ScanHero onScanPress={() => navigation.navigate(ROUTES.scan)} />

        <AiStatus />

        <FarmOverview cardWidth={cardWidth} />

        <CropVitality />

        <RecentActivity
          onViewAll={() => go(ROUTES.history)}
          onItemPress={() => go(ROUTES.history)}
        />

        <LatestDiagnosis
          onViewAll={() => go(ROUTES.history)}
          onReportPress={() => go(ROUTES.history)}
        />

        <QuickTools cardWidth={cardWidth} onToolPress={go} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================= */
/* 12. STYLES */
/* ============================================================= */

const styles = StyleSheet.create({
  /* ------------------------------ Screen ------------------------------ */

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SPACING.sm,
    paddingBottom: TAB_BAR_CLEARANCE,
  },

  section: {
    marginBottom: SPACING.xxl,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  /* ------------------------------ Section header ------------------------------ */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  sectionActionText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  periodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
  },

  periodChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  /* ------------------------------ Header ------------------------------ */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.sm,
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#0F2A22",
    borderWidth: 1,
    borderColor: "#1E5744",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,

    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },

  logoBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextWrap: {
    flexShrink: 1,
  },

  appName: {
    color: "#F5FFFB",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#0D2921",
    borderWidth: 1,
    borderColor: "#1B513F",
    borderRadius: 20,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.md,
    paddingVertical: 5,
  },

  statusText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#14382D",
    borderWidth: 1.5,
    borderColor: "#22B77D",
    alignItems: "center",
    justifyContent: "center",
  },

  profileLetter: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "800",
  },

  /* ------------------------------ Welcome ------------------------------ */

  welcome: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },

  welcomeLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },

  greeting: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },

  farmerName: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginTop: SPACING.xs,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs + 2,
    gap: SPACING.xs,
  },

  locationText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "500",
  },

  farmSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#1B4939",
    borderRadius: RADIUS.sm,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },

  farmSelectorIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },

  farmSelectorLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "500",
  },

  farmSelectorName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
  },

  /* ------------------------------ Scan hero ------------------------------ */

  heroShadow: {
    borderRadius: RADIUS.lg + 4,
    marginBottom: SPACING.lg,

    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },

  heroCard: {
    backgroundColor: COLORS.hero,
    borderRadius: RADIUS.lg + 4,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    padding: SPACING.lg + 2,
    overflow: "hidden",
  },

  heroGlowLarge: {
    position: "absolute",
    top: -70,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    opacity: 0.08,
  },

  heroGlowSmall: {
    position: "absolute",
    bottom: -50,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    opacity: 0.05,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  heroTextArea: {
    flex: 1,
    marginRight: SPACING.md,
  },

  heroEyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#19D98A1F",
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginBottom: SPACING.sm + 2,
  },

  heroEyebrowText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  heroTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    letterSpacing: 0.1,
  },

  heroDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: SPACING.sm - 2,
  },

  viewfinder: {
    width: 66,
    height: 66,
    borderRadius: RADIUS.md,
    backgroundColor: "#12382C",
    alignItems: "center",
    justifyContent: "center",
  },

  scanButtonContainer: {
    marginTop: SPACING.lg + 2,
  },

  scanButton: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 2,

    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  scanButtonIconLeft: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#04110C1F",
    alignItems: "center",
    justifyContent: "center",
  },

  scanButtonText: {
    flex: 1,
    color: COLORS.onPrimary,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginLeft: SPACING.md,
  },

  scanButtonIconRight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.onPrimary,
    alignItems: "center",
    justifyContent: "center",
  },

  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md + 2,
  },

  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  trustText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#2A4A3E",
    marginHorizontal: SPACING.lg,
  },

  /* ------------------------------ Viewfinder corners ------------------------------ */

  corner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: COLORS.primary,
    opacity: 0.9,
  },

  cornerTL: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 6,
  },

  cornerTR: {
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 6,
  },

  cornerBL: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 6,
  },

  cornerBR: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 6,
  },

  /* ------------------------------ AI status ------------------------------ */

  aiStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0C211A",
    borderWidth: 1,
    borderColor: "#1B4938",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xxl,
  },

  aiStatusIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm - 2,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  aiStatusContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },

  aiStatusTitle: {
    color: "#EAF8F2",
    fontSize: 13,
    fontWeight: "700",
  },

  aiStatusText: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#123428",
    borderRadius: 9,
    paddingLeft: SPACING.xs + 2,
    paddingRight: SPACING.sm,
    paddingVertical: 3,
  },

  liveText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  /* ------------------------------ Stats ------------------------------ */

  statCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,

    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },

  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm - 2,
    alignItems: "center",
    justifyContent: "center",
  },

  statAccentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.9,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginTop: SPACING.md,
  },

  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  statTrendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: SPACING.md,
  },

  statTrendText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
  },

  /* ------------------------------ Card typography (shared) ------------------------------ */

  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  /* ------------------------------ Crop vitality ------------------------------ */

  vitalityCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg + 2,
    marginBottom: SPACING.xxl,

    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 2,
  },

  vitalityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#10382B",
    borderWidth: 1,
    borderColor: "#1D6048",
    borderRadius: 12,
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: 5,
  },

  healthBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  vitalityBody: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.lg + 2,
  },

  ringAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
  },

  ringCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },

  ringValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
  },

  ringLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },

  vitalityInfo: {
    flex: 1,
    marginLeft: SPACING.xl,
  },

  vitalityPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  vitalityPointText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  progressBlock: {
    marginTop: SPACING.xs,
  },

  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  progressLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
  },

  progressValue: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.track,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },

  /* ------------------------------ Recent activity ------------------------------ */

  activityContainer: {
    marginBottom: SPACING.sm + 2,
  },

  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md + 2,
  },

  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  activityStatusDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.card,
  },

  activityContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },

  activityTitle: {
    color: "#EDF5F1",
    fontSize: 14,
    fontWeight: "700",
  },

  activityDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  activityTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: SPACING.xs + 2,
  },

  activityTime: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: "500",
  },

  /* ------------------------------ Latest diagnosis ------------------------------ */

  diagnosisCard: {
    backgroundColor: "#101B18",
    borderWidth: 1,
    borderColor: "#294039",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,

    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 2,
  },

  diagnosisTop: {
    flexDirection: "row",
  },

  diagnosisVisual: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.md,
    backgroundColor: "#183A2F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md + 2,
  },

  diagnosisSpot: {
    position: "absolute",
    top: 30,
    right: 24,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
    opacity: 0.85,
  },

  diagnosisSpotAlt: {
    top: 44,
    right: 36,
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  diagnosisInfo: {
    flex: 1,
  },

  diagnosisTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  diagnosisName: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#392D1B",
    borderWidth: 1,
    borderColor: "#5A4424",
    borderRadius: 9,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },

  severityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.warning,
  },

  severityText: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: "700",
  },

  diagnosisMeta: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "500",
    marginTop: SPACING.xs,
  },

  diagnosisDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: SPACING.sm - 2,
  },

  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    height: 44,
    marginTop: SPACING.lg,
    backgroundColor: "#19D98A14",
    borderWidth: 1,
    borderColor: "#1D6048",
    borderRadius: RADIUS.sm,
  },

  reportButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  /* ------------------------------ Quick tools ------------------------------ */

  toolCard: {
    minHeight: 96,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md + 2,
  },

  toolTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },

  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm - 2,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },

  toolTitle: {
    color: "#E9F2EF",
    fontSize: 13,
    fontWeight: "700",
  },

  toolSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
});