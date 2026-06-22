import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from "pdf-lib";

// English Metric Units: 914400 EMU = 1 inch = 72 PDF points, so 12700 EMU = 1 point.
const EMU_PER_PT = 12700;
const emuToPt = (emu: number) => emu / EMU_PER_PT;

// Default slide size (4:3, 10in x 7.5in) used when presentation.xml omits sldSz.
const DEFAULT_SLIDE_CX = 9144000;
const DEFAULT_SLIDE_CY = 6858000;

type RGB = { r: number; g: number; b: number };

type Transform = {
  // Map a child-space EMU coordinate to root slide-space EMU.
  tx: (x: number) => number;
  ty: (y: number) => number;
  // Scale factors applied to child-space sizes.
  sx: number;
  sy: number;
};

const IDENTITY: Transform = { tx: (x) => x, ty: (y) => y, sx: 1, sy: 1 };

function decodeXmlText(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x?[0-9a-fA-F]+;/g, (m) => {
      const hex = /&#x/i.test(m);
      const code = parseInt(m.replace(/&#x?|;/gi, ""), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&amp;/g, "&");
}

// pdf-lib's standard fonts only support WinAnsi, so replace anything outside it.
function sanitizeForPdf(s: string): string {
  return s.replace(/[\u0000-\u001F]/g, " ").replace(/[^\x20-\xFF]/g, "?");
}

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  if (clean.length < 6) return null;
  const n = parseInt(clean.slice(0, 6), 16);
  if (!Number.isFinite(n)) return null;
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

// A generic walker that returns the direct child elements of an XML fragment,
// respecting nesting (regex alone cannot match balanced tags).
type XmlEl = { tag: string; attrs: string; inner: string; full: string };
function childElements(inner: string): XmlEl[] {
  const out: XmlEl[] = [];
  const tagRe = /<([\w:.-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|<\/([\w:.-]+)>/g;
  let depth = 0;
  let startIdx = -1;
  let startTag = "";
  let startAttrs = "";
  let startContentIdx = -1;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(inner)) !== null) {
    const isClose = m[4] !== undefined;
    const selfClosing = m[3] === "/";
    if (isClose) {
      if (depth === 1 && m[4] === startTag) {
        out.push({
          tag: startTag,
          attrs: startAttrs,
          inner: inner.slice(startContentIdx, m.index),
          full: inner.slice(startIdx, tagRe.lastIndex),
        });
      }
      depth = Math.max(0, depth - 1);
    } else {
      if (selfClosing) {
        if (depth === 0) {
          out.push({ tag: m[1], attrs: m[2] || "", inner: "", full: m[0] });
        }
      } else {
        if (depth === 0) {
          startIdx = m.index;
          startTag = m[1];
          startAttrs = m[2] || "";
          startContentIdx = tagRe.lastIndex;
        }
        depth++;
      }
    }
  }
  return out;
}

function attr(attrs: string, name: string): string | undefined {
  const m = attrs.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : undefined;
}

function firstTag(xml: string, tag: string): XmlEl | null {
  const re = new RegExp(`<${tag}\\b((?:[^>"']|"[^"]*"|'[^']*')*?)(\\/?)>`);
  const m = xml.match(re);
  if (!m) return null;
  const startAttrs = m[1] || "";
  if (m[2] === "/") return { tag, attrs: startAttrs, inner: "", full: m[0] };
  const startIdx = (m.index ?? 0) + m[0].length;
  // Find the matching close, accounting for nesting of the same tag.
  const scanRe = new RegExp(`<${tag}\\b[^>]*?(\\/?)>|<\\/${tag}>`, "g");
  scanRe.lastIndex = startIdx;
  let depth = 1;
  let sm: RegExpExecArray | null;
  while ((sm = scanRe.exec(xml)) !== null) {
    if (sm[0].startsWith(`</`)) {
      depth--;
      if (depth === 0) {
        return { tag, attrs: startAttrs, inner: xml.slice(startIdx, sm.index), full: xml.slice(m.index ?? 0, scanRe.lastIndex) };
      }
    } else if (sm[1] !== "/") {
      depth++;
    }
  }
  return { tag, attrs: startAttrs, inner: xml.slice(startIdx), full: xml.slice(m.index ?? 0) };
}

// Parse a theme's colour scheme into a name->hex map for resolving schemeClr.
function parseTheme(themeXml: string): Record<string, string> {
  const map: Record<string, string> = {};
  const scheme = firstTag(themeXml, "a:clrScheme");
  if (!scheme) return map;
  for (const el of childElements(scheme.inner)) {
    const name = el.tag.replace(/^a:/, "");
    const srgb = el.inner.match(/<a:srgbClr val="([0-9a-fA-F]{6})"/);
    const sys = el.inner.match(/<a:sysClr [^>]*lastClr="([0-9a-fA-F]{6})"/);
    if (srgb) map[name] = srgb[1];
    else if (sys) map[name] = sys[1];
  }
  return map;
}

// Default slide-master colour map (clrMap) aliases. bg1/tx1/bg2/tx2 -> scheme slots.
const SCHEME_ALIAS: Record<string, string> = {
  bg1: "lt1",
  tx1: "dk1",
  bg2: "lt2",
  tx2: "dk2",
};

// Resolve the first colour found inside a fragment (srgbClr or schemeClr).
function resolveColor(fragment: string, theme: Record<string, string>): RGB | null {
  const srgb = fragment.match(/<a:srgbClr val="([0-9a-fA-F]{6})"/);
  if (srgb) return hexToRgb(srgb[1]);
  const scheme = fragment.match(/<a:schemeClr val="([\w]+)"/);
  if (scheme) {
    const key = SCHEME_ALIAS[scheme[1]] ?? scheme[1];
    const hex = theme[key] ?? theme[scheme[1]];
    if (hex) return hexToRgb(hex);
  }
  return null;
}

// Resolve a solid/gradient background fill from a <p:bg> container.
function resolveBackground(xml: string, theme: Record<string, string>): RGB | null {
  const bg = firstTag(xml, "p:bg");
  if (!bg) return null;
  const solid = firstTag(bg.inner, "a:solidFill");
  if (solid) {
    const c = resolveColor(solid.inner, theme);
    if (c) return c;
  }
  const grad = firstTag(bg.inner, "a:gradFill");
  if (grad) {
    const c = resolveColor(grad.inner, theme);
    if (c) return c;
  }
  const bgRef = firstTag(bg.inner, "p:bgRef");
  if (bgRef) {
    const c = resolveColor(bgRef.inner, theme);
    if (c) return c;
  }
  return null;
}

type Rels = Record<string, string>;
function parseRels(relsXml: string): Rels {
  const rels: Rels = {};
  const re = /<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*?\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(relsXml)) !== null) rels[m[1]] = m[2];
  // Attribute order is not guaranteed; handle Target-before-Id too.
  const re2 = /<Relationship\b[^>]*Target="([^"]+)"[^>]*Id="([^"]+)"[^>]*?\/>/g;
  while ((m = re2.exec(relsXml)) !== null) rels[m[2]] = m[1];
  return rels;
}

// Normalise a relationship target (e.g. "../media/img1.png") against a base dir.
function resolveTarget(base: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const baseParts = base.split("/").filter(Boolean);
  baseParts.pop(); // drop the file name, keep the dir
  for (const part of target.split("/")) {
    if (part === "..") baseParts.pop();
    else if (part !== ".") baseParts.push(part);
  }
  return baseParts.join("/");
}

type Geom = { x: number; y: number; cx: number; cy: number } | null;
function readXfrm(spPrXml: string): Geom {
  const off = spPrXml.match(/<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"/);
  const ext = spPrXml.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
  if (!off || !ext) return null;
  return { x: parseInt(off[1], 10), y: parseInt(off[2], 10), cx: parseInt(ext[1], 10), cy: parseInt(ext[2], 10) };
}

type RunStyle = { text: string; size: number; bold: boolean; color: RGB };
type Para = { runs: RunStyle[]; align: string };

function parseTextBody(txBodyXml: string, theme: Record<string, string>, defaultSize: number, defaultColor: RGB): Para[] {
  const paras: Para[] = [];
  const body = firstTag(txBodyXml, "p:txBody") ?? { inner: txBodyXml } as XmlEl;
  for (const p of childElements(body.inner)) {
    if (p.tag !== "a:p") continue;
    const pPr = firstTag(p.inner, "a:pPr");
    const align = (pPr && attr(pPr.attrs, "algn")) || "l";
    const runs: RunStyle[] = [];
    for (const r of childElements(p.inner)) {
      if (r.tag !== "a:r") continue;
      const tMatch = r.inner.match(/<a:t>([\s\S]*?)<\/a:t>/);
      if (!tMatch) continue;
      const text = decodeXmlText(tMatch[1]);
      if (!text) continue;
      const rPr = firstTag(r.inner, "a:rPr");
      let size = defaultSize;
      let bold = false;
      let color = defaultColor;
      if (rPr) {
        const sz = attr(rPr.attrs, "sz");
        if (sz) size = Math.max(6, Math.min(96, parseInt(sz, 10) / 100));
        bold = attr(rPr.attrs, "b") === "1";
        const fill = firstTag(rPr.inner, "a:solidFill");
        if (fill) {
          const c = resolveColor(fill.inner, theme);
          if (c) color = c;
        }
      }
      runs.push({ text, size, bold, color });
    }
    paras.push({ runs, align });
  }
  return paras;
}

function wrapByWidth(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const words = rawLine.split(/(\s+)/);
    let current = "";
    for (const token of words) {
      const candidate = current + token;
      if (font.widthOfTextAtSize(sanitizeForPdf(candidate), size) > maxWidth && current.trim()) {
        out.push(current.replace(/\s+$/, ""));
        current = token.replace(/^\s+/, "");
      } else {
        current = candidate;
      }
    }
    out.push(current.replace(/\s+$/, ""));
  }
  return out.length ? out : [""];
}

// Convert any raster the standard fonts/pdf-lib cannot embed natively into PNG.
async function embedImage(pdfDoc: PDFDocument, data: Uint8Array, ext: string): Promise<PDFImage | null> {
  const lower = ext.toLowerCase();
  try {
    if (lower === "png") return await pdfDoc.embedPng(data);
    if (lower === "jpg" || lower === "jpeg") return await pdfDoc.embedJpg(data);
    if (lower === "emf" || lower === "wmf" || lower === "svg") return null; // vector — unsupported
    // gif, bmp, tiff, webp -> transcode to PNG via jimp.
    // @ts-ignore - jimp-compact has no bundled types
    const Jimp = (await import("jimp-compact")).default;
    const img = await Jimp.read(Buffer.from(data));
    const png: Buffer = await img.getBufferAsync("image/png");
    return await pdfDoc.embedPng(png);
  } catch {
    return null;
  }
}

type ShapeKind = "title" | "body" | "other";
function placeholderKind(spXml: string): ShapeKind {
  const ph = spXml.match(/<p:ph\b([^>]*)\/?>/);
  if (!ph) return "other";
  const type = attr(ph[1], "type");
  if (type === "title" || type === "ctrTitle") return "title";
  if (type === "subTitle" || type === "body" || !type) return "body";
  return "other";
}

// ---- Charts --------------------------------------------------------------
type ChartType = "col" | "bar" | "line" | "area" | "pie" | "doughnut";
type ChartSeries = { name: string; values: number[]; color: RGB | null };
type ChartData = { type: ChartType; categories: string[]; series: ChartSeries[]; title?: string };

// Theme accent colours form the default series palette.
function themePalette(theme: Record<string, string>): RGB[] {
  const out: RGB[] = [];
  for (let i = 1; i <= 6; i++) {
    const hex = theme[`accent${i}`];
    const c = hex ? hexToRgb(hex) : null;
    if (c) out.push(c);
  }
  if (out.length) return out;
  return ["4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5", "70AD47"].map((h) => hexToRgb(h)!);
}

function parseChartPts(xml: string, numeric: boolean): (number | string)[] {
  const arr: (number | string)[] = [];
  const re = /<c:pt\b([^>]*)>([\s\S]*?)<\/c:pt>/g;
  let m: RegExpExecArray | null;
  let max = -1;
  while ((m = re.exec(xml)) !== null) {
    const idx = parseInt(attr(m[1], "idx") || "0", 10) || 0;
    const vm = m[2].match(/<c:v>([\s\S]*?)<\/c:v>/);
    if (numeric) {
      const v = vm ? parseFloat(vm[1]) : NaN;
      arr[idx] = Number.isFinite(v) ? v : 0;
    } else {
      arr[idx] = vm ? decodeXmlText(vm[1]) : "";
    }
    if (idx > max) max = idx;
  }
  for (let i = 0; i <= max; i++) if (arr[i] === undefined) arr[i] = numeric ? 0 : "";
  return arr;
}

// Parse a chart part (ppt/charts/chartN.xml) into plottable data.
function parseChart(xml: string, theme: Record<string, string>): ChartData | null {
  const plot = firstTag(xml, "c:plotArea");
  if (!plot) return null;
  let typeEl: XmlEl | null = null;
  for (const child of childElements(plot.inner)) {
    if (/Chart$/.test(child.tag)) {
      typeEl = child;
      break;
    }
  }
  if (!typeEl) return null;
  const tag = typeEl.tag;
  let type: ChartType = "col";
  if (tag.includes("pie")) type = "pie";
  else if (tag.includes("doughnut")) type = "doughnut";
  else if (tag.includes("line")) type = "line";
  else if (tag.includes("area")) type = "area";
  else if (tag.includes("bar")) {
    const dir = typeEl.inner.match(/<c:barDir val="(\w+)"/);
    type = dir && dir[1] === "bar" ? "bar" : "col";
  }

  const sers = childElements(typeEl.inner).filter((c) => c.tag === "c:ser");
  const series: ChartSeries[] = [];
  let categories: string[] = [];
  sers.forEach((ser, si) => {
    let name = `Series ${si + 1}`;
    const tx = firstTag(ser.inner, "c:tx");
    if (tx) {
      const vm = tx.inner.match(/<c:v>([\s\S]*?)<\/c:v>/);
      if (vm) name = decodeXmlText(vm[1]);
    }
    let color: RGB | null = null;
    const sp = firstTag(ser.inner, "c:spPr");
    if (sp) color = resolveColor(sp.inner, theme);
    const valEl = firstTag(ser.inner, "c:val");
    const values = valEl ? (parseChartPts(valEl.inner, true) as number[]) : [];
    if (si === 0) {
      const catEl = firstTag(ser.inner, "c:cat");
      if (catEl) categories = parseChartPts(catEl.inner, false) as string[];
    }
    series.push({ name, values, color });
  });
  if (series.length === 0) return null;

  let title: string | undefined;
  const tEl = firstTag(xml, "c:title");
  if (tEl) {
    const parts = [...tEl.inner.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((mm) => decodeXmlText(mm[1]));
    if (parts.length) title = parts.join("");
  }
  return { type, categories, series, title };
}

// pdf-lib's drawSvgPath uses SVG (y-down) coords anchored at the given origin;
// anchoring at (0, pageHpt) lets us pass plain PDF coordinates for each vertex.
function drawFilledPolygon(page: any, pts: { x: number; y: number }[], color: RGB, pageHpt: number, opacity = 1): void {
  if (pts.length < 3) return;
  const d = "M " + pts.map((p, i) => `${i ? "L " : ""}${p.x.toFixed(2)} ${(pageHpt - p.y).toFixed(2)}`).join(" ") + " Z";
  page.drawSvgPath(d, { x: 0, y: pageHpt, color: rgb(color.r, color.g, color.b), opacity, borderWidth: 0 });
}

function drawLegend(page: any, labels: string[], palette: RGB[], rightX: number, topY: number, font: PDFFont, pageHpt: number): void {
  let ly = topY;
  labels.slice(0, 6).forEach((lab, i) => {
    const text = sanitizeForPdf(String(lab)).slice(0, 16) || `#${i + 1}`;
    const tw = font.widthOfTextAtSize(text, 7);
    const sw = 7;
    const startX = rightX - tw - sw - 4;
    const c = palette[i % palette.length];
    page.drawRectangle({ x: startX, y: ly - 6, width: sw, height: sw, color: rgb(c.r, c.g, c.b) });
    page.drawText(text, { x: startX + sw + 2, y: ly - 6, size: 7, font, color: rgb(0.2, 0.2, 0.2) });
    ly -= 11;
    void pageHpt;
  });
}

// Draw a chart inside region {x, y(top), w, h} in PDF points.
function drawChart(
  page: any,
  region: { x: number; y: number; w: number; h: number },
  data: ChartData,
  opts: { font: PDFFont; boldFont: PDFFont; pageHpt: number; palette: RGB[] },
): void {
  const { font, boldFont, pageHpt, palette } = opts;
  const { x, y, w, h } = region;
  // White card so the chart reads on any slide background.
  page.drawRectangle({ x, y: y - h, width: w, height: h, color: rgb(1, 1, 1), borderColor: rgb(0.82, 0.82, 0.82), borderWidth: 0.5 });

  const mT = data.title ? 22 : 10;
  const mB = 22;
  const mL = 8;
  const mR = 8;
  const plotX = x + mL;
  const plotW = Math.max(10, w - mL - mR);
  const plotTop = y - mT;
  const plotBottom = y - h + mB;
  const plotH = Math.max(10, plotTop - plotBottom);
  const colorFor = (i: number) => palette[i % palette.length];

  if (data.title) {
    const t = sanitizeForPdf(data.title).slice(0, 60);
    page.drawText(t, { x: x + (w - boldFont.widthOfTextAtSize(t, 11)) / 2, y: y - 15, size: 11, font: boldFont, color: rgb(0.12, 0.12, 0.12) });
  }

  if (data.type === "pie" || data.type === "doughnut") {
    const vals = data.series[0]?.values ?? [];
    const total = vals.reduce((a, b) => a + (b > 0 ? b : 0), 0);
    if (total <= 0) return;
    const cx = plotX + plotW / 2;
    const cy = plotBottom + plotH / 2;
    const r = Math.max(4, Math.min(plotW, plotH) / 2 - 4);
    let ang = -Math.PI / 2;
    vals.forEach((v, i) => {
      if (v <= 0) return;
      const slice = (v / total) * Math.PI * 2;
      const pts = [{ x: cx, y: cy }];
      const steps = Math.max(2, Math.ceil(slice / 0.2));
      for (let s = 0; s <= steps; s++) {
        const a = ang + slice * (s / steps);
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
      drawFilledPolygon(page, pts, colorFor(i), pageHpt);
      ang += slice;
    });
    if (data.type === "doughnut") {
      page.drawCircle({ x: cx, y: cy, size: r * 0.5, color: rgb(1, 1, 1) });
    }
    const legendLabels = data.categories.length ? data.categories : vals.map((_, i) => `Item ${i + 1}`);
    drawLegend(page, legendLabels, palette, x + w - 4, plotTop, font, pageHpt);
    return;
  }

  // bar / col / line / area
  const allVals = data.series.flatMap((s) => s.values);
  const maxVal = Math.max(1, ...allVals.map((v) => (v > 0 ? v : 0)));
  const minVal = Math.min(0, ...allVals);
  const range = maxVal - minVal || 1;
  const C = Math.max(1, data.categories.length || Math.max(1, ...data.series.map((s) => s.values.length)));
  const S = Math.max(1, data.series.length);
  const zeroY = plotBottom + ((0 - minVal) / range) * plotH;
  page.drawLine({ start: { x: plotX, y: zeroY }, end: { x: plotX + plotW, y: zeroY }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  const groupW = plotW / C;

  if (data.type === "bar" || data.type === "col") {
    const barW = (groupW * 0.8) / S;
    for (let ci = 0; ci < C; ci++) {
      for (let si = 0; si < S; si++) {
        const v = data.series[si].values[ci] ?? 0;
        const bx = plotX + ci * groupW + groupW * 0.1 + si * barW;
        const bh = (Math.abs(v) / range) * plotH;
        const by = v >= 0 ? zeroY : zeroY - bh;
        const c = colorFor(si);
        page.drawRectangle({ x: bx, y: by, width: Math.max(1, barW * 0.9), height: Math.max(0.5, bh), color: rgb(c.r, c.g, c.b) });
      }
    }
  } else {
    for (let si = 0; si < S; si++) {
      const c = colorFor(si);
      const pts: { x: number; y: number }[] = [];
      for (let ci = 0; ci < C; ci++) {
        const v = data.series[si].values[ci] ?? 0;
        const px = plotX + groupW * (ci + 0.5);
        const py = plotBottom + ((v - minVal) / range) * plotH;
        pts.push({ x: px, y: py });
      }
      if (pts.length === 0) continue;
      if (data.type === "area") {
        const poly = [{ x: pts[0].x, y: zeroY }, ...pts, { x: pts[pts.length - 1].x, y: zeroY }];
        drawFilledPolygon(page, poly, c, pageHpt, 0.4);
      }
      for (let k = 0; k < pts.length - 1; k++) {
        page.drawLine({ start: pts[k], end: pts[k + 1], thickness: 1.5, color: rgb(c.r, c.g, c.b) });
      }
    }
  }

  for (let ci = 0; ci < C; ci++) {
    const label = sanitizeForPdf(String(data.categories[ci] ?? "")).slice(0, 10);
    if (!label) continue;
    const lx = plotX + groupW * (ci + 0.5) - Math.min(groupW * 0.45, font.widthOfTextAtSize(label, 6) / 2);
    page.drawText(label, { x: lx, y: plotBottom - 10, size: 6, font, color: rgb(0.3, 0.3, 0.3) });
  }
  if (S > 1) drawLegend(page, data.series.map((s, i) => s.name || `Series ${i + 1}`), palette, x + w - 4, plotTop, font, pageHpt);
}

export async function renderPptxToPdf(buffer: Buffer): Promise<Uint8Array> {
  // @ts-ignore - jszip default export
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);

  const readStr = async (path: string): Promise<string | null> => {
    const f = zip.file(path);
    return f ? await f.async("string") : null;
  };
  const readBin = async (path: string): Promise<Uint8Array | null> => {
    const f = zip.file(path);
    return f ? await f.async("uint8array") : null;
  };

  // Slide dimensions.
  let slideCx = DEFAULT_SLIDE_CX;
  let slideCy = DEFAULT_SLIDE_CY;
  const presXml = await readStr("ppt/presentation.xml");
  if (presXml) {
    const sz = presXml.match(/<p:sldSz\s+cx="(\d+)"\s+cy="(\d+)"/);
    if (sz) {
      slideCx = parseInt(sz[1], 10);
      slideCy = parseInt(sz[2], 10);
    }
  }
  const pageWpt = emuToPt(slideCx);
  const pageHpt = emuToPt(slideCy);

  const slidePaths = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => (parseInt(a.match(/slide(\d+)/)?.[1] ?? "0", 10)) - (parseInt(b.match(/slide(\d+)/)?.[1] ?? "0", 10)));

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Cache resolved themes/backgrounds keyed by part path.
  const themeCache: Record<string, Record<string, string>> = {};

  if (slidePaths.length === 0) {
    const page = pdfDoc.addPage([pageWpt, pageHpt]);
    page.drawText("No slides found in this presentation.", { x: 50, y: pageHpt / 2, size: 14, font, color: rgb(0.3, 0.3, 0.3) });
    return await pdfDoc.save();
  }

  for (const slidePath of slidePaths) {
    const slideXml = (await readStr(slidePath)) ?? "";
    const slideName = slidePath.split("/").pop() ?? "";
    const slideRelsXml = (await readStr(`ppt/slides/_rels/${slideName}.rels`)) ?? "";
    const slideRels = parseRels(slideRelsXml);

    // Resolve layout -> master -> theme chain for background + scheme colours.
    let layoutPath: string | null = null;
    let masterPath: string | null = null;
    let theme: Record<string, string> = {};
    for (const [id, target] of Object.entries(slideRels)) {
      void id;
      if (target.includes("slideLayout")) layoutPath = resolveTarget(slidePath, target);
    }
    let layoutXml = "";
    let masterXml = "";
    if (layoutPath) {
      layoutXml = (await readStr(layoutPath)) ?? "";
      const layoutName = layoutPath.split("/").pop() ?? "";
      const layoutRels = parseRels((await readStr(`ppt/slideLayouts/_rels/${layoutName}.rels`)) ?? "");
      for (const target of Object.values(layoutRels)) {
        if (target.includes("slideMaster")) masterPath = resolveTarget(layoutPath, target);
      }
    }
    if (masterPath) {
      masterXml = (await readStr(masterPath)) ?? "";
      const masterName = masterPath.split("/").pop() ?? "";
      const masterRels = parseRels((await readStr(`ppt/slideMasters/_rels/${masterName}.rels`)) ?? "");
      for (const target of Object.values(masterRels)) {
        if (target.includes("theme")) {
          const themePath = resolveTarget(masterPath, target);
          if (themeCache[themePath]) theme = themeCache[themePath];
          else {
            const themeXml = (await readStr(themePath)) ?? "";
            theme = parseTheme(themeXml);
            themeCache[themePath] = theme;
          }
        }
      }
    }

    const page = pdfDoc.addPage([pageWpt, pageHpt]);

    // Background: slide overrides layout overrides master, else white.
    const bg = resolveBackground(slideXml, theme) ?? resolveBackground(layoutXml, theme) ?? resolveBackground(masterXml, theme) ?? { r: 1, g: 1, b: 1 };
    page.drawRectangle({ x: 0, y: 0, width: pageWpt, height: pageHpt, color: rgb(bg.r, bg.g, bg.b) });

    const spTree = firstTag(slideXml, "p:spTree");
    if (!spTree) continue;

    // Draw a shape-tree element, recursing into groups with coordinate transforms.
    const drawNode = async (el: XmlEl, t: Transform): Promise<void> => {
      if (el.tag === "p:grpSp") {
        const grpSpPr = firstTag(el.inner, "p:grpSpPr");
        if (!grpSpPr) return;
        const off = grpSpPr.inner.match(/<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"/);
        const ext = grpSpPr.inner.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
        const chOff = grpSpPr.inner.match(/<a:chOff\s+x="(-?\d+)"\s+y="(-?\d+)"/);
        const chExt = grpSpPr.inner.match(/<a:chExt\s+cx="(\d+)"\s+cy="(\d+)"/);
        let child = t;
        if (off && ext && chOff && chExt) {
          const gx = parseInt(off[1], 10), gy = parseInt(off[2], 10);
          const gcx = parseInt(ext[1], 10), gcy = parseInt(ext[2], 10);
          const cox = parseInt(chOff[1], 10), coy = parseInt(chOff[2], 10);
          const ccx = parseInt(chExt[1], 10) || gcx, ccy = parseInt(chExt[2], 10) || gcy;
          const sx = gcx / ccx, sy = gcy / ccy;
          child = {
            tx: (x) => t.tx(gx + (x - cox) * sx),
            ty: (y) => t.ty(gy + (y - coy) * sy),
            sx: t.sx * sx,
            sy: t.sy * sy,
          };
        }
        for (const c of childElements(el.inner)) {
          if (["p:sp", "p:pic", "p:grpSp", "p:graphicFrame"].includes(c.tag)) await drawNode(c, child);
        }
        return;
      }

      if (el.tag === "p:pic") {
        const spPr = firstTag(el.inner, "p:spPr");
        const geom = spPr ? readXfrm(spPr.inner) : null;
        if (!geom) return;
        const blip = el.inner.match(/<a:blip\b[^>]*r:embed="([^"]+)"/);
        if (!blip) return;
        const target = slideRels[blip[1]];
        if (!target) return;
        const mediaPath = resolveTarget(slidePath, target);
        const data = await readBin(mediaPath);
        if (!data) return;
        const ext = mediaPath.split(".").pop() ?? "";
        const img = await embedImage(pdfDoc, data, ext);
        if (!img) return;
        const x = emuToPt(t.tx(geom.x));
        const w = emuToPt(geom.cx * t.sx);
        const h = emuToPt(geom.cy * t.sy);
        const y = pageHpt - emuToPt(t.ty(geom.y)) - h;
        page.drawImage(img, { x, y, width: w, height: h });
        return;
      }

      if (el.tag === "p:sp") {
        const spPr = firstTag(el.inner, "p:spPr");
        const geom = spPr ? readXfrm(spPr.inner) : null;
        const kind = placeholderKind(el.inner);

        // Shape fill rectangle (skip placeholders without explicit geometry).
        if (geom && spPr) {
          const solid = firstTag(spPr.inner, "a:solidFill");
          if (solid) {
            const c = resolveColor(solid.inner, theme);
            if (c) {
              const x = emuToPt(t.tx(geom.x));
              const w = emuToPt(geom.cx * t.sx);
              const h = emuToPt(geom.cy * t.sy);
              const y = pageHpt - emuToPt(t.ty(geom.y)) - h;
              page.drawRectangle({ x, y, width: w, height: h, color: rgb(c.r, c.g, c.b) });
            }
          }
        }

        const txBody = firstTag(el.inner, "p:txBody");
        if (!txBody) return;
        const defaultSize = kind === "title" ? 32 : 18;
        const defaultColor: RGB =
          bg.r + bg.g + bg.b < 1.2 ? { r: 0.95, g: 0.95, b: 0.95 } : { r: 0.1, g: 0.1, b: 0.1 };
        const paras = parseTextBody(txBody.inner, theme, defaultSize, defaultColor);

        // Text region: shape geometry if present, else a sensible default block.
        const region = geom
          ? {
              x: emuToPt(t.tx(geom.x)),
              y: pageHpt - emuToPt(t.ty(geom.y)),
              w: emuToPt(geom.cx * t.sx),
              h: emuToPt(geom.cy * t.sy),
            }
          : { x: pageWpt * 0.06, y: pageHpt * 0.9, w: pageWpt * 0.88, h: pageHpt * 0.8 };

        const padX = 4;
        let cursorY = region.y - 6;
        const minY = region.y - region.h;
        for (const para of paras) {
          if (para.runs.length === 0) {
            cursorY -= 10;
            continue;
          }
          const size = para.runs[0].size || defaultSize;
          const useFont = para.runs.some((r) => r.bold) || kind === "title" ? boldFont : font;
          const color = para.runs[0].color;
          const fullText = para.runs.map((r) => r.text).join("");
          const maxWidth = Math.max(20, region.w - padX * 2);
          const lines = wrapByWidth(fullText, useFont, size, maxWidth);
          const lineHeight = size * 1.25;
          for (const line of lines) {
            cursorY -= lineHeight;
            if (cursorY < minY - lineHeight) break;
            const safe = sanitizeForPdf(line);
            let drawX = region.x + padX;
            if (para.align === "ctr") {
              drawX = region.x + (region.w - useFont.widthOfTextAtSize(safe, size)) / 2;
            } else if (para.align === "r") {
              drawX = region.x + region.w - padX - useFont.widthOfTextAtSize(safe, size);
            }
            page.drawText(safe, { x: drawX, y: cursorY, size, font: useFont, color: rgb(color.r, color.g, color.b) });
          }
        }
        return;
      }

      // graphicFrame: charts and embedded images.
      if (el.tag === "p:graphicFrame") {
        const xfrm = firstTag(el.inner, "p:xfrm");
        const geom = xfrm ? readXfrm(xfrm.inner) : null;

        // Native charts: resolve the chart part and plot it from cached data.
        const chartRef = el.inner.match(/<c:chart\b[^>]*r:id="([^"]+)"/);
        if (chartRef && geom) {
          const target = slideRels[chartRef[1]];
          if (target) {
            const chartXml = await readStr(resolveTarget(slidePath, target));
            if (chartXml) {
              const data = parseChart(chartXml, theme);
              if (data) {
                const x = emuToPt(t.tx(geom.x));
                const w = emuToPt(geom.cx * t.sx);
                const h = emuToPt(geom.cy * t.sy);
                const yTop = pageHpt - emuToPt(t.ty(geom.y));
                drawChart(page, { x, y: yTop, w, h }, data, { font, boldFont, pageHpt, palette: themePalette(theme) });
                return;
              }
            }
          }
        }

        // Embedded image inside a graphic frame.
        const blip = el.inner.match(/<a:blip\b[^>]*r:embed="([^"]+)"/);
        if (blip && geom) {
          const target = slideRels[blip[1]];
          if (target) {
            const data = await readBin(resolveTarget(slidePath, target));
            if (data) {
              const img = await embedImage(pdfDoc, data, target.split(".").pop() ?? "");
              if (img) {
                const x = emuToPt(t.tx(geom.x));
                const w = emuToPt(geom.cx * t.sx);
                const h = emuToPt(geom.cy * t.sy);
                const y = pageHpt - emuToPt(t.ty(geom.y)) - h;
                page.drawImage(img, { x, y, width: w, height: h });
              }
            }
          }
        }
        return;
      }
    };

    for (const el of childElements(spTree.inner)) {
      if (["p:sp", "p:pic", "p:grpSp", "p:graphicFrame"].includes(el.tag)) {
        await drawNode(el, IDENTITY);
      }
    }
  }

  return await pdfDoc.save();
}
