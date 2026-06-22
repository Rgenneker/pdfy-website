import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { FEATURED_SLUGS, TOOLS, getToolBySlug } from "@/lib/tools";

function FeaturedToolCard({ slug, index }: { slug: string; index: number }) {
  const colors = useColors();
  const router = useRouter();
  const tool = getToolBySlug(slug);
  if (!tool) return null;

  const styles = StyleSheet.create({
    card: {
      width: 130,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginRight: 10,
      gap: 10,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 11,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    name: {
      fontSize: 13,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      lineHeight: 18,
    },
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/tool/${slug}` as any);
        }}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={tool.icon as any} size={20} color={colors.primary} />
        </View>
        <Text style={styles.name}>{tool.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const stats = [
    { label: "Tools", value: String(TOOLS.filter((t) => t.available).length) },
    { label: "Formats", value: "8+" },
    { label: "Free", value: "100%" },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: isWeb ? 67 + 16 : insets.top + 16,
      paddingBottom: isWeb ? 34 + 90 : 90,
    },
    hero: {
      paddingHorizontal: 20,
      paddingBottom: 28,
    },
    logoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 24,
    },
    logoIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    appName: {
      fontSize: 22,
      fontWeight: "900" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.5,
    },
    appNameDot: {
      color: colors.primary,
    },
    headline: {
      fontSize: 30,
      fontWeight: "900" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.8,
      lineHeight: 37,
      marginBottom: 10,
    },
    subheadline: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      lineHeight: 22,
      marginBottom: 24,
    },
    ctaButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 50,
      paddingVertical: 14,
      paddingHorizontal: 28,
      alignSelf: "flex-start",
    },
    ctaText: {
      fontSize: 15,
      fontWeight: "800" as const,
      color: "#ffffff",
      fontFamily: "Inter_700Bold",
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 24,
    },
    stat: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      alignItems: "center",
    },
    statValue: {
      fontSize: 22,
      fontWeight: "900" as const,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    statLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      marginTop: 2,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    seeAll: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
    featuredScroll: {
      marginHorizontal: -20,
      paddingHorizontal: 20,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 20,
      marginBottom: 28,
    },
    tipCard: {
      backgroundColor: colors.accent,
      borderRadius: colors.radius,
      padding: 16,
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    tipIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    tipTitle: {
      fontSize: 13,
      fontWeight: "700" as const,
      color: colors.accentForeground,
      fontFamily: "Inter_700Bold",
      marginBottom: 3,
    },
    tipBody: {
      fontSize: 12,
      color: colors.accentForeground,
      fontFamily: "Inter_400Regular",
      lineHeight: 17,
      opacity: 0.8,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled
      >
        <View style={styles.hero}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={["#f43f5e", "#fb923c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoIcon}
            >
              <Ionicons name="document-text" size={22} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>
              PDFShuffl<Text style={styles.appNameDot}>.</Text>
            </Text>
          </View>

          <Text style={styles.headline}>
            {"Document work,\nmade effortless."}
          </Text>
          <Text style={styles.subheadline}>
            Create, convert, edit and sign PDFs right from your phone.
          </Text>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/tools" as any);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={["#f43f5e", "#fb7185"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.ctaText}>Explore All Tools</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.statsRow}>
            {stats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <Pressable onPress={() => router.push("/(tabs)/tools" as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.featuredScroll}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {FEATURED_SLUGS.map((slug, i) => (
              <FeaturedToolCard key={slug} slug={slug} index={i} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.tipCard}>
            <View style={styles.tipIconWrap}>
              <Ionicons name="bulb" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Pro tip</Text>
              <Text style={styles.tipBody}>
                Use "Create PDF" to draft documents from scratch, then "Sign
                PDF" to add your signature before sharing.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
