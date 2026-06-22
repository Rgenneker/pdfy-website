import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { apiUrl } from "@/lib/api";
import { getToolBySlug } from "@/lib/tools";

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

export default function ToolScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const tool = getToolBySlug(slug ?? "");

  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [resultPath, setResultPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!tool) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 16, fontFamily: "Inter_400Regular" }}>
          Tool not found.
        </Text>
      </View>
    );
  }

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: tool.fileTypes ?? ["*/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setPickedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? "application/octet-stream",
          size: asset.size,
        });
        setResultPath(null);
        setError(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError("Could not pick file. Please try again.");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleConvert = async () => {
    setError(null);
    setResultPath(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let response: Response;

      if (tool.slug === "create-pdf") {
        const text = fieldValues["text"] ?? "";
        if (!text.trim()) {
          setError("Please enter some text content.");
          setLoading(false);
          return;
        }
        response = await fetch(apiUrl("/create-pdf"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      } else {
        if (!pickedFile) {
          setError("Please select a file first.");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", {
          uri: pickedFile.uri,
          type: pickedFile.mimeType,
          name: pickedFile.name,
        } as any);

        for (const field of tool.fields ?? []) {
          const val = fieldValues[field.key];
          if (val) formData.append(field.key, val);
        }

        response = await fetch(apiUrl(`/${tool.slug}`), {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || `Server error ${response.status}`);
      }

      if (isWeb) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PDFShuffl-result.${tool.outputExtension}`;
        a.click();
        URL.revokeObjectURL(url);
        setResultPath("downloaded");
      } else {
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        const fileName = `PDFShuffl-result-${Date.now()}.${tool.outputExtension}`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setResultPath(filePath);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const msg = err?.message ?? "Conversion failed. Please try again.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!resultPath || resultPath === "downloaded") return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(resultPath, {
          mimeType: tool.outputMime,
          dialogTitle: `Save ${tool.outputExtension.toUpperCase()} file`,
        });
      } else {
        Alert.alert("Sharing unavailable", "Sharing is not available on this device.");
      }
    } catch {
      setError("Could not share file.");
    }
  };

  const canSubmit =
    tool.slug === "create-pdf"
      ? (fieldValues["text"] ?? "").trim().length > 0
      : !!pickedFile;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: isWeb ? 67 : insets.top + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 12,
      backgroundColor: colors.background,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    navTitle: {
      fontSize: 17,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: isWeb ? 34 + 40 : 40,
      gap: 16,
    },
    heroCard: {
      borderRadius: colors.radius,
      padding: 20,
      flexDirection: "row",
      gap: 14,
      alignItems: "center",
    },
    heroIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: "900" as const,
      color: "#ffffff",
      fontFamily: "Inter_700Bold",
      marginBottom: 4,
    },
    heroDesc: {
      fontSize: 13,
      color: "rgba(255,255,255,0.8)",
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
      flex: 1,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    cardLabel: {
      fontSize: 13,
      fontWeight: "700" as const,
      color: colors.mutedForeground,
      fontFamily: "Inter_700Bold",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    filePicker: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: "dashed",
      borderRadius: colors.radius,
      padding: 24,
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.background,
    },
    filePickerText: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
    filePickerHint: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    selectedFile: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.accent,
      borderRadius: 10,
      padding: 12,
    },
    selectedFileName: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.accentForeground,
      fontFamily: "Inter_600SemiBold",
    },
    selectedFileSize: {
      fontSize: 11,
      color: colors.accentForeground,
      fontFamily: "Inter_400Regular",
      opacity: 0.7,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    textArea: {
      minHeight: 140,
      textAlignVertical: "top",
    },
    convertButton: {
      borderRadius: 50,
      overflow: "hidden",
    },
    convertButtonInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
    },
    convertButtonText: {
      fontSize: 16,
      fontWeight: "800" as const,
      color: "#ffffff",
      fontFamily: "Inter_700Bold",
    },
    convertButtonDisabled: {
      opacity: 0.45,
    },
    errorCard: {
      backgroundColor: "#fef2f2",
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: "#fecaca",
      padding: 14,
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: "#991b1b",
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },
    successCard: {
      backgroundColor: "#f0fdf4",
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: "#bbf7d0",
      padding: 16,
      gap: 12,
    },
    successTitle: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: "#166534",
      fontFamily: "Inter_700Bold",
    },
    successDesc: {
      fontSize: 13,
      color: "#166534",
      fontFamily: "Inter_400Regular",
      opacity: 0.8,
    },
    shareButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#16a34a",
      borderRadius: 50,
      paddingVertical: 12,
    },
    shareButtonText: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: "#ffffff",
      fontFamily: "Inter_700Bold",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {tool.name}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#f43f5e", "#fb923c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name={tool.icon as any} size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{tool.name}</Text>
            <Text style={styles.heroDesc}>{tool.description}</Text>
          </View>
        </LinearGradient>

        {(tool.inputType === "file" || tool.inputType === "file+text") && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              Select File ({tool.fileExtensions?.join(", ") ?? "any"})
            </Text>
            {!pickedFile ? (
              <Pressable
                style={({ pressed }) => [
                  styles.filePicker,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={pickFile}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.filePickerText}>Tap to select file</Text>
                <Text style={styles.filePickerHint}>
                  {tool.fileExtensions?.join(", ") ?? "Any file"} · Max 20 MB
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={pickFile}>
                <View style={styles.selectedFile}>
                  <Ionicons
                    name="document"
                    size={22}
                    color={colors.accentForeground}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {pickedFile.name}
                    </Text>
                    {pickedFile.size !== undefined && (
                      <Text style={styles.selectedFileSize}>
                        {formatBytes(pickedFile.size)}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={colors.accentForeground}
                  />
                </View>
              </Pressable>
            )}
          </View>
        )}

        {(tool.fields ?? []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Details</Text>
            {tool.fields!.map((field) => (
              <View key={field.key}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.required ? " *" : ""}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    field.multiline && styles.textArea,
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={fieldValues[field.key] ?? ""}
                  onChangeText={(val) =>
                    setFieldValues((prev) => ({ ...prev, [field.key]: val }))
                  }
                  multiline={field.multiline}
                  returnKeyType={field.multiline ? "default" : "next"}
                />
              </View>
            ))}
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color="#991b1b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {resultPath && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>
              {resultPath === "downloaded" ? "Download started!" : "Conversion complete!"}
            </Text>
            <Text style={styles.successDesc}>
              {resultPath === "downloaded"
                ? "Your file has been downloaded."
                : "Your file is ready. Tap below to save or share it."}
            </Text>
            {resultPath !== "downloaded" && (
              <Pressable
                style={({ pressed }) => [
                  styles.shareButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={18} color="#fff" />
                <Text style={styles.shareButtonText}>
                  Save / Share {tool.outputExtension.toUpperCase()}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <Pressable
          onPress={handleConvert}
          disabled={!canSubmit || loading}
          style={({ pressed }) => [
            styles.convertButton,
            (!canSubmit || loading) && styles.convertButtonDisabled,
            { opacity: pressed && canSubmit ? 0.85 : 1 },
          ]}
        >
          <LinearGradient
            colors={["#f43f5e", "#fb7185"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.convertButtonInner}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.convertButtonText}>
                  {tool.slug === "create-pdf" ? "Create PDF" : `Convert to ${tool.outputExtension.toUpperCase()}`}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}
