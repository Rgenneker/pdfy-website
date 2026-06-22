import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { documentDirectory, EncodingType, writeAsStringAsync } from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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

import PreviewModal from "@/components/PreviewModal";
import { useColors } from "@/hooks/useColors";
import { apiUrl } from "@/lib/api";
import { getToolBySlug } from "@/lib/tools";

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

const IMAGE_TOOLS = ["jpg-to-pdf"];

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
  const [previewVisible, setPreviewVisible] = useState(false);
  const [sizeSummary, setSizeSummary] = useState<string | null>(null);

  const [cameraPermission, requestCameraPermission] =
    ImagePicker.useCameraPermissions();

  const isImageTool = IMAGE_TOOLS.includes(slug ?? "");

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

  const scanFromCamera = async () => {
    if (Platform.OS === "web") {
      setError("Camera scanning is not available on web. Please select a file.");
      return;
    }

    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        if (!result.canAskAgain) {
          Alert.alert(
            "Camera Access Required",
            "Please enable camera access in your device settings to scan documents.",
            [{ text: "OK" }]
          );
        }
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.92,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = `scan-${Date.now()}.jpg`;
        setPickedFile({
          uri: asset.uri,
          name: fileName,
          mimeType: "image/jpeg",
          size: asset.fileSize,
        });
        setResultPath(null);
        setError(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError("Could not open camera. Please try again.");
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
    setSizeSummary(null);
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

      if (tool.slug === "compress-pdf") {
        const originalSize = Number(response.headers.get("X-Original-Size"));
        const compressedSize = Number(response.headers.get("X-Compressed-Size"));
        const savings = Number(response.headers.get("X-Size-Savings-Percent"));
        if (originalSize > 0 && compressedSize > 0) {
          setSizeSummary(
            savings > 0
              ? `Your file shrank from ${formatBytes(originalSize)} to ${formatBytes(compressedSize)} (${savings}% smaller).`
              : `Your file was already well optimised, so it stayed at ${formatBytes(compressedSize)}.`
          );
        }
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
        const filePath = `${documentDirectory}${fileName}`;
        await writeAsStringAsync(filePath, base64, {
          encoding: EncodingType.Base64,
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
    filePickerRow: {
      flexDirection: "row",
      gap: 10,
    },
    filePickerHalf: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: "dashed",
      borderRadius: colors.radius,
      paddingVertical: 20,
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.background,
    },
    filePickerHalfText: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
    },
    scanButton: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderStyle: "dashed",
      borderRadius: colors.radius,
      paddingVertical: 20,
      alignItems: "center",
      gap: 6,
      backgroundColor: `${colors.primary}10`,
    },
    scanButtonText: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
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
    sizeSummaryRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: "#dcfce7",
      borderRadius: 10,
      padding: 12,
    },
    sizeSummaryText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700" as const,
      color: "#166534",
      fontFamily: "Inter_700Bold",
      lineHeight: 18,
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
    previewButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: "#16a34a",
      borderRadius: 50,
      paddingVertical: 12,
    },
    previewButtonText: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: "#16a34a",
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
              isImageTool && Platform.OS !== "web" ? (
                <View style={styles.filePickerRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.filePickerHalf,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={pickFile}
                    testID="pick-file-button"
                  >
                    <Ionicons
                      name="images-outline"
                      size={26}
                      color={colors.primary}
                    />
                    <Text style={styles.filePickerHalfText}>
                      Choose Photo
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.scanButton,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push("/scan" as any);
                    }}
                    testID="scan-camera-button"
                  >
                    <Ionicons
                      name="documents"
                      size={26}
                      color={colors.primary}
                    />
                    <Text style={styles.scanButtonText}>
                      Scan Pages
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.filePicker,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={pickFile}
                  testID="pick-file-button"
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
              )
            ) : (
              <View style={{ gap: 8 }}>
                <Pressable onPress={pickFile}>
                  <View style={styles.selectedFile}>
                    <Ionicons
                      name={pickedFile.name.startsWith("scan-") ? "camera" : "document"}
                      size={22}
                      color={colors.accentForeground}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedFileName} numberOfLines={1}>
                        {pickedFile.name.startsWith("scan-")
                          ? "Scanned document"
                          : pickedFile.name}
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
                {isImageTool && Platform.OS !== "web" && (
                  <Pressable
                    style={({ pressed }) => [
                      {
                        flexDirection: "row" as const,
                        alignItems: "center" as const,
                        justifyContent: "center" as const,
                        gap: 6,
                        paddingVertical: 8,
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                    onPress={scanFromCamera}
                  >
                    <Ionicons name="camera-outline" size={15} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.primary,
                        fontFamily: "Inter_600SemiBold",
                      }}
                    >
                      Scan a different document
                    </Text>
                  </Pressable>
                )}
              </View>
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
                : "Your file is ready. Tap below to preview, save, or share it."}
            </Text>
            {sizeSummary && (
              <View style={styles.sizeSummaryRow}>
                <Ionicons name="trending-down" size={18} color="#166534" />
                <Text style={styles.sizeSummaryText}>{sizeSummary}</Text>
              </View>
            )}
            {resultPath !== "downloaded" && (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.previewButton,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => setPreviewVisible(true)}
                  testID="preview-button"
                >
                  <Ionicons name="eye-outline" size={18} color="#16a34a" />
                  <Text style={styles.previewButtonText}>
                    Preview {tool.outputExtension.toUpperCase()}
                  </Text>
                </Pressable>
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
              </>
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

      {resultPath && resultPath !== "downloaded" && (
        <PreviewModal
          visible={previewVisible}
          onClose={() => setPreviewVisible(false)}
          filePath={resultPath}
          outputExtension={tool.outputExtension}
          fileName={`PDFShuffl-result.${tool.outputExtension}`}
        />
      )}
    </View>
  );
}
