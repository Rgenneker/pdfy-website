import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import type { Tool } from "@/lib/tools";

interface ToolCardProps {
  tool: Tool;
  compact?: boolean;
}

export function ToolCard({ tool, compact = false }: ToolCardProps) {
  const colors = useColors();
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!tool.available) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/tool/${tool.slug}` as any);
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const styles = StyleSheet.create({
    container: {
      flex: compact ? undefined : 1,
      width: compact ? "100%" : undefined,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: compact ? 16 : 14,
      flexDirection: compact ? "row" : "column",
      alignItems: compact ? "center" : "flex-start",
      gap: compact ? 12 : 8,
      opacity: tool.available ? 1 : 0.45,
    },
    iconWrap: {
      width: compact ? 40 : 44,
      height: compact ? 40 : 44,
      borderRadius: compact ? 10 : 12,
      backgroundColor: tool.available ? colors.accent : colors.muted,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    textWrap: {
      flex: compact ? 1 : undefined,
    },
    name: {
      fontSize: compact ? 15 : 14,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 2,
    },
    description: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      lineHeight: 17,
    },
    badge: {
      marginTop: compact ? 0 : 6,
      alignSelf: "flex-start",
      backgroundColor: colors.muted,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: 10,
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    chevron: {
      marginLeft: "auto" as any,
    },
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!tool.available}
      >
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={tool.icon as any}
              size={compact ? 20 : 22}
              color={tool.available ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.name}>{tool.name}</Text>
            {compact && (
              <Text style={styles.description} numberOfLines={2}>
                {tool.description}
              </Text>
            )}
            {!tool.available && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Coming Soon</Text>
              </View>
            )}
          </View>
          {compact && tool.available && (
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.mutedForeground}
              style={styles.chevron}
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
