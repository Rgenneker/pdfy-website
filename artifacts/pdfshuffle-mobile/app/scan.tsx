import { Ionicons } from "@expo/vector-icons";
import { documentDirectory, EncodingType, writeAsStringAsync } from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PreviewModal from "@/components/PreviewModal";
import { useColors } from "@/hooks/useColors";
import { apiUrl } from "@/lib/api";

type ScannedPage = {
  id: string;
  uri: string;
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

export default function ScanScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultPath, setResultPath] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cameraPermission, requestCameraPermission] =
    ImagePicker.useCameraPermissions();

  // Kick off the first capture automatically when the screen opens.
  const didAutoCapture = useRef(false);

  const capturePage = async () => {
    setError(null);

    if (Platform.OS === "web") {
      setError("Camera scanning is not available on web.");
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

      if (result.canceled || !result.assets.length) return;

      const asset = result.assets[0];
      setPages((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, uri: asset.uri },
      ]);
      setResultPath(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Could not open camera. Please try again.");
    }
  };

  useEffect(() => {
    if (didAutoCapture.current) return;
    didAutoCapture.current = true;
    capturePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removePage = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPages((prev) => prev.filter((p) => p.id !== id));
    setResultPath(null);
  };

  const buildPdf = async () => {
    if (pages.length === 0) {
      setError("Add at least one page first.");
      return;
    }
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formData = new FormData();
      pages.forEach((page, index) => {
        formData.append("files", {
          uri: page.uri,
          type: "image/jpeg",
          name: `scan-page-${index + 1}.jpg`,
        } as any);
      });

      const response = await fetch(apiUrl("/images-to-pdf"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || `Server error ${response.status}`);
      }

      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      const fileName = `PDFShuffl-scan-${Date.now()}.pdf`;
      const filePath = `${documentDirectory}${fileName}`;
      await writeAsStringAsync(filePath, base64, {
        encoding: EncodingType.Base64,
      });

      setResultPath(filePath);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err?.message ?? "Could not build the PDF. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!resultPath) return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(resultPath, {
          mimeType: "application/pdf",
          dialogTitle: "Save scanned PDF",
        });
      } else {
        Alert.alert("Sharing unavailable", "Sharing is not available on this device.");
      }
    } catch {
      setError("Could not share the PDF.");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: insets.top + 8,
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
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
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
    },
    emptyState: {
      alignItems: "center",
      gap: 8,
      paddingVertical: 24,
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    thumbStrip: {
      flexDirection: "row",
      gap: 12,
    },
    thumbWrap: {
      width: 96,
    },
    thumb: {
      width: 96,
      height: 128,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    pageBadge: {
      position: "absolute",
      bottom: 6,
      left: 6,
      backgroundColor: "rgba(0,0,0,0.65)",
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    pageBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    removeButton: {
      position: "absolute",
      top: -8,
      right: -8,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "#ef4444",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.background,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 50,
      paddingVertical: 14,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: "800" as const,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    doneButton: {
      borderRadius: 50,
      overflow: "hidden",
    },
    doneButtonInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: "800" as const,
      color: "#ffffff",
      fontFamily: "Inter_700Bold",
    },
    disabled: { opacity: 0.45 },
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
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          Scan Document
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#f43f5e", "#fb923c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="documents" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Multi-page scan</Text>
            <Text style={styles.heroDesc}>
              Photograph each page, then combine them into one PDF.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            {pages.length > 0 ? `${pages.length} page${pages.length > 1 ? "s" : ""}` : "Pages"}
          </Text>

          {pages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={32} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>
                No pages yet. Tap "Add another page" to capture your first page.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbStrip}
            >
              {pages.map((page, index) => (
                <View key={page.id} style={styles.thumbWrap}>
                  <Image
                    source={{ uri: page.uri }}
                    style={styles.thumb}
                    contentFit="cover"
                  />
                  <View style={styles.pageBadge}>
                    <Text style={styles.pageBadgeText}>{index + 1}</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.removeButton,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => removePage(page.id)}
                    hitSlop={8}
                    testID={`remove-page-${index}`}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.addButton, { opacity: pressed ? 0.8 : 1 }]}
          onPress={capturePage}
          testID="add-page-button"
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.addButtonText}>Add another page</Text>
        </Pressable>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color="#991b1b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {resultPath && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>PDF ready!</Text>
            <Text style={styles.successDesc}>
              Your {pages.length}-page document is ready. Preview, save, or share it below.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.previewButton, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => setPreviewVisible(true)}
              testID="preview-button"
            >
              <Ionicons name="eye-outline" size={18} color="#16a34a" />
              <Text style={styles.previewButtonText}>Preview PDF</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Save / Share PDF</Text>
            </Pressable>
          </View>
        )}

        {!resultPath && (
          <Pressable
            onPress={buildPdf}
            disabled={pages.length === 0 || loading}
            style={({ pressed }) => [
              styles.doneButton,
              (pages.length === 0 || loading) && styles.disabled,
              { opacity: pressed && pages.length > 0 ? 0.85 : 1 },
            ]}
            testID="done-scan-button"
          >
            <LinearGradient
              colors={["#f43f5e", "#fb7185"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.doneButtonInner}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.doneButtonText}>
                    Done · Combine into PDF
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>

      {resultPath && (
        <PreviewModal
          visible={previewVisible}
          onClose={() => setPreviewVisible(false)}
          filePath={resultPath}
          outputExtension="pdf"
          fileName="PDFShuffl-scan.pdf"
        />
      )}
    </View>
  );
}
