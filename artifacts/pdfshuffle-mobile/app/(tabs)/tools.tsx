import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ToolCard } from "@/components/ToolCard";
import { useColors } from "@/hooks/useColors";
import {
  CATEGORY_LABELS,
  TOOLS,
  type ToolCategory,
} from "@/lib/tools";

const ORDERED_CATEGORIES: ToolCategory[] = [
  "convert",
  "extract",
  "edit",
  "signing",
  "coming-soon",
];

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: isWeb ? 67 : insets.top + 16,
      paddingHorizontal: 20,
      paddingBottom: 12,
      backgroundColor: colors.background,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "900" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.8,
      marginBottom: 14,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 12,
      paddingHorizontal: 20,
      paddingBottom: isWeb ? 34 + 90 : 90,
    },
    categoryTitle: {
      fontSize: 13,
      fontWeight: "700" as const,
      color: colors.mutedForeground,
      fontFamily: "Inter_700Bold",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: 16,
      marginBottom: 8,
    },
    toolList: {
      gap: 8,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 60,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PDF Tools</Text>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, color: colors.mutedForeground }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tools..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered !== null ? (
          filtered.length === 0 ? (
            <Text style={styles.emptyText}>No tools match "{query}"</Text>
          ) : (
            <View style={styles.toolList}>
              {filtered.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} compact />
              ))}
            </View>
          )
        ) : (
          ORDERED_CATEGORIES.map((cat) => {
            const tools = TOOLS.filter((t) => t.category === cat);
            if (tools.length === 0) return null;
            return (
              <View key={cat}>
                <Text style={styles.categoryTitle}>
                  {CATEGORY_LABELS[cat]}
                </Text>
                <View style={styles.toolList}>
                  {tools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} compact />
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
