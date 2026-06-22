import { Ionicons } from "@expo/vector-icons";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import mammoth from "mammoth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { useColors } from "@/hooks/useColors";

interface PreviewModalProps {
  visible: boolean;
  onClose: () => void;
  filePath: string;
  outputExtension: string;
  fileName?: string;
}

type FileType = "pdf" | "txt" | "docx" | "other";

function getFileType(ext: string): FileType {
  if (ext === "pdf") return "pdf";
  if (ext === "txt") return "txt";
  if (ext === "docx") return "docx";
  return "other";
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Builds a self-contained PDF.js viewer HTML page.
 * PDF.js is loaded from the official CDN; the PDF data is embedded as base64.
 * This renders reliably on both iOS (fallback) and Android WebView.
 */
function buildPdfJsHtml(base64: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #525659;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px 80px;
    gap: 8px;
    min-height: 100vh;
  }
  canvas {
    max-width: 100%;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    background: #fff;
    display: block;
  }
  #loading {
    color: #fff;
    font-family: -apple-system, sans-serif;
    font-size: 15px;
    padding: 40px 20px;
    text-align: center;
  }
  #error-msg {
    color: #ff8a8a;
    font-family: -apple-system, sans-serif;
    font-size: 14px;
    padding: 20px;
    text-align: center;
  }
  #nav {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.75);
    color: #fff;
    padding: 8px 20px;
    border-radius: 24px;
    font-family: -apple-system, sans-serif;
    font-size: 14px;
    display: none;
    gap: 20px;
    align-items: center;
    white-space: nowrap;
  }
  #nav button {
    background: none;
    border: none;
    color: #fff;
    font-size: 22px;
    cursor: pointer;
    line-height: 1;
    padding: 0;
  }
</style>
</head>
<body>
<div id="loading">Rendering PDF…</div>
<div id="error-msg" style="display:none"></div>
<div id="nav">
  <button id="prev">‹</button>
  <span id="page-info"></span>
  <button id="next">›</button>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
(function() {
  var WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  var BASE64 = '${base64}';

  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;

  function b64ToBytes(b64) {
    var bin = atob(b64);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  var pdfDoc = null;
  var currentPage = 1;
  var rendering = false;

  function updateNav() {
    var nav = document.getElementById('nav');
    var info = document.getElementById('page-info');
    if (pdfDoc && pdfDoc.numPages > 1) {
      nav.style.display = 'flex';
      info.textContent = currentPage + ' / ' + pdfDoc.numPages;
    }
    document.getElementById('prev').disabled = currentPage <= 1;
    document.getElementById('next').disabled = currentPage >= (pdfDoc ? pdfDoc.numPages : 1);
  }

  function renderPage(num) {
    if (rendering) return;
    rendering = true;
    pdfDoc.getPage(num).then(function(page) {
      var scale = window.devicePixelRatio * 1.5;
      var vp = page.getViewport({ scale: scale });
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      canvas.width = vp.width;
      canvas.height = vp.height;
      canvas.style.width = Math.floor(vp.width / window.devicePixelRatio) + 'px';
      canvas.style.height = Math.floor(vp.height / window.devicePixelRatio) + 'px';
      var body = document.body;
      var old = body.querySelector('canvas');
      if (old) body.removeChild(old);
      body.insertBefore(canvas, document.getElementById('nav'));
      page.render({ canvasContext: ctx, viewport: vp }).promise.then(function() {
        rendering = false;
      }).catch(function() { rendering = false; });
    }).catch(function(err) {
      rendering = false;
      showError('Page render failed: ' + err.message);
    });
  }

  function showError(msg) {
    document.getElementById('loading').style.display = 'none';
    var el = document.getElementById('error-msg');
    el.style.display = 'block';
    el.textContent = msg;
  }

  pdfjsLib.getDocument({ data: b64ToBytes(BASE64) }).promise.then(function(pdf) {
    pdfDoc = pdf;
    document.getElementById('loading').style.display = 'none';
    updateNav();
    renderPage(currentPage);
  }).catch(function(err) {
    showError('Could not load PDF: ' + err.message);
  });

  document.getElementById('prev').addEventListener('click', function() {
    if (currentPage > 1 && !rendering) {
      currentPage--;
      updateNav();
      renderPage(currentPage);
    }
  });
  document.getElementById('next').addEventListener('click', function() {
    if (pdfDoc && currentPage < pdfDoc.numPages && !rendering) {
      currentPage++;
      updateNav();
      renderPage(currentPage);
    }
  });
})();
</script>
</body>
</html>`;
}

function buildDocxHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: #1a1a1a;
    background: #ffffff;
  }
  h1, h2, h3, h4, h5, h6 {
    margin: 1.2em 0 0.5em;
    font-weight: 700;
    line-height: 1.3;
  }
  h1 { font-size: 1.6em; }
  h2 { font-size: 1.35em; }
  h3 { font-size: 1.15em; }
  p { margin: 0 0 0.8em; }
  ul, ol { margin: 0 0 0.8em 1.5em; }
  li { margin-bottom: 0.2em; }
  strong, b { font-weight: 700; }
  em, i { font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
  td, th { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
  th { background: #f3f4f6; font-weight: 600; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

export default function PreviewModal({
  visible,
  onClose,
  filePath,
  outputExtension,
  fileName,
}: PreviewModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const fileType = getFileType(outputExtension);

  const [textContent, setTextContent] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setTextContent(null);
      setHtmlContent(null);
      setPdfHtml(null);
      setLoadError(null);
      setLoading(true);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        if (fileType === "txt") {
          const content = await readAsStringAsync(filePath, {
            encoding: EncodingType.UTF8,
          });
          if (!cancelled) setTextContent(content);
        } else if (fileType === "pdf") {
          if (Platform.OS === "ios") {
            // iOS WebView natively renders local PDFs via file:// URI
            if (!cancelled) setPdfHtml("ios-native");
          } else {
            // Android: use PDF.js canvas renderer for reliable cross-device support
            const base64 = await readAsStringAsync(filePath, {
              encoding: EncodingType.Base64,
            });
            if (!cancelled) setPdfHtml(buildPdfJsHtml(base64));
          }
        } else if (fileType === "docx") {
          const base64 = await readAsStringAsync(filePath, {
            encoding: EncodingType.Base64,
          });
          const arrayBuffer = base64ToArrayBuffer(base64);
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (!cancelled) setHtmlContent(buildDocxHtml(result.value));
        }
      } catch (e: any) {
        if (!cancelled)
          setLoadError(e?.message ?? "Could not load file preview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [visible, filePath, fileType]);

  const renderContent = () => {
    if (loading) {
      return (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={colors.primary} size="large" />
          <Text
            style={{
              marginTop: 12,
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 14,
            }}
          >
            Loading preview…
          </Text>
        </View>
      );
    }

    if (loadError) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Ionicons
            name="alert-circle-outline"
            size={56}
            color={colors.mutedForeground}
          />
          <Text
            style={{
              marginTop: 14,
              fontSize: 14,
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            {loadError}
          </Text>
        </View>
      );
    }

    if (fileType === "txt" && textContent !== null) {
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              lineHeight: 22,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            }}
            selectable
          >
            {textContent}
          </Text>
        </ScrollView>
      );
    }

    if (fileType === "pdf" && pdfHtml) {
      if (Platform.OS === "ios") {
        return (
          <WebView
            source={{ uri: filePath }}
            style={{ flex: 1 }}
            originWhitelist={["file://*"]}
            allowFileAccess
          />
        );
      }
      return (
        <WebView
          source={{ html: pdfHtml }}
          style={{ flex: 1 }}
          originWhitelist={["*"]}
          javaScriptEnabled
        />
      );
    }

    if (fileType === "docx" && htmlContent) {
      return (
        <WebView
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
          originWhitelist={["about:blank"]}
          javaScriptEnabled={false}
        />
      );
    }

    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <Ionicons
          name="document-outline"
          size={64}
          color={colors.mutedForeground}
        />
        <Text
          style={{
            marginTop: 16,
            fontSize: 17,
            fontWeight: "600",
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            textAlign: "center",
          }}
        >
          Preview not available
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 13,
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            textAlign: "center",
            lineHeight: 19,
          }}
        >
          .{outputExtension} files can't be previewed in-app.{"\n"}
          Tap Share to open in another app.
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 12,
          }}
        >
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="close" size={20} color={colors.foreground} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              fontSize: 17,
              fontWeight: "700",
              color: colors.foreground,
              fontFamily: "Inter_700Bold",
            }}
            numberOfLines={1}
          >
            {fileName ?? `Preview .${outputExtension.toUpperCase()}`}
          </Text>
        </View>

        {renderContent()}
      </View>
    </Modal>
  );
}
