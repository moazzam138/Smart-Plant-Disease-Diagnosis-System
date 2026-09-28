import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  background: "#07100E",
  card: "#0E1916",
  cardLight: "#1B2925",
  primary: "#19D98A",
  onPrimary: "#04110C",
  text: "#FFFFFF",
  secondary: "#9BAFA7",
  border: "#1D302A",
  borderStrong: "#245844",
  red: "#F06C6C",
};

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
};

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View
        style={[
          styles.menuIcon,
          danger && styles.dangerIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={danger ? COLORS.red : COLORS.primary}
        />
      </View>

      <View style={styles.menuTextContainer}>
        <Text
          style={[
            styles.menuTitle,
            danger && { color: COLORS.red },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={COLORS.secondary}
      />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const handleAction = (name: string) => {
    Alert.alert(
      name,
      `${name} will be connected in a future update.`
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Demo",
              "Authentication will be connected later."
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => handleAction("Settings")}
          >
            <Ionicons
              name="settings-outline"
              size={21}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={38}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.userName}>Moazzam Husain</Text>

          <Text style={styles.userRole}>Tomato Farmer</Text>

          <View style={styles.locationContainer}>
            <Ionicons
              name="location-outline"
              size={15}
              color={COLORS.primary}
            />

            <Text style={styles.location}>
              Bareilly, Uttar Pradesh
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleAction("Edit Profile")}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={COLORS.background}
            />

            <Text style={styles.editButtonText}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>48</Text>
            <Text style={styles.miniStatLabel}>Total Scans</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>01</Text>
            <Text style={styles.miniStatLabel}>Crop Type</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>76%</Text>
            <Text style={styles.miniStatLabel}>Crop Health</Text>
          </View>
        </View>

        {/* ACCOUNT */}
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.menuCard}>
          <MenuItem
            icon="person-outline"
            title="Personal Information"
            subtitle="Name, email and mobile number"
            onPress={() => handleAction("Personal Information")}
          />

          <View style={styles.separator} />

          <MenuItem
            icon="leaf-outline"
            title="My Crops"
            subtitle="Manage your crop information"
            onPress={() => handleAction("My Crops")}
          />

          <View style={styles.separator} />

          <MenuItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage alerts and reminders"
            onPress={() => handleAction("Notifications")}
          />
        </View>

        {/* PREFERENCES */}
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.menuCard}>
          <MenuItem
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => handleAction("Language")}
          />

          <View style={styles.separator} />

          <MenuItem
            icon="shield-checkmark-outline"
            title="Privacy & Security"
            onPress={() => handleAction("Privacy & Security")}
          />

          <View style={styles.separator} />

          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => handleAction("Help & Support")}
          />

          <View style={styles.separator} />

          <MenuItem
            icon="information-circle-outline"
            title="About AgriCare AI"
            subtitle="Version 1.0.0"
            onPress={() => handleAction("About AgriCare AI")}
          />
        </View>

        {/* LOGOUT */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="log-out-outline"
            title="Logout"
            danger
            onPress={handleLogout}
          />
        </View>

        <Text style={styles.footer}>
          AgriCare AI • Version 1.0.0
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
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
  },

  settingsButton: {
    height: 42,
    width: 42,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  profileCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    marginHorizontal: 18,
    borderRadius: 20,
    paddingVertical: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 28,
    backgroundColor: "#10372C",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#245844",
  },

  userName: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
    marginTop: 15,
  },

  userRole: {
    color: COLORS.primary,
    fontSize: 13,
    marginTop: 5,
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  location: {
    color: COLORS.secondary,
    fontSize: 12,
    marginLeft: 4,
  },

  editButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 18,
  },

  editButtonText: {
    color: COLORS.onPrimary,
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 7,
  },

  statsContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 17,
    paddingVertical: 19,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  miniStat: {
    flex: 1,
    alignItems: "center",
  },

  miniStatValue: {
    color: COLORS.primary,
    fontSize: 21,
    fontWeight: "800",
  },

  miniStatLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 5,
  },

  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 20,
    marginBottom: 12,
  },

  menuCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 18,
    marginBottom: 22,
    borderRadius: 17,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  menuIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#10372C",
    alignItems: "center",
    justifyContent: "center",
  },

  dangerIcon: {
    backgroundColor: "#3A2025",
  },

  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  menuTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },

  menuSubtitle: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 4,
  },

  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 50,
  },

  footer: {
    color: COLORS.secondary,
    textAlign: "center",
    fontSize: 11,
    marginBottom: 25,
  },
});