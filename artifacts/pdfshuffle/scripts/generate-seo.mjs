#!/usr/bin/env node
// SEO / GEO generator for PDFShuffl.
//
// Produces:
//   - public/sitemap-1.xml ... sitemap-6.xml   (PDF keyword pages, from pdf-keywords.json)
//   - public/sitemap-7.xml ... sitemap-11.xml  (geo keyword pages, from geo-config.js)
//   - public/sitemap-index.xml                 (index of landing + all sitemaps)
//   - public/llms.txt                          (LLM-readable site summary)
//   - public/robots.txt                        (AI-crawler-friendly robots)
//   - public/api/tools.json                    (machine-readable tool registry)
//
// Run with: pnpm --filter @workspace/pdfshuffle run generate:seo
//        or: node scripts/generate-seo.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  SITE_URL,
  geoTools,
  iterateGeoEntries,
  GEO_MAX,
  GEO_SITEMAP_START,
  URLS_PER_SITEMAP,
} from "../src/data/geo-config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC = resolve(ROOT, "public");
const DATA = resolve(ROOT, "src/data");

mkdirSync(resolve(PUBLIC, "api"), { recursive: true });

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlBlock(loc, { changefreq = "monthly", priority = "0.7" } = {}) {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function writeUrlset(filePath, blocks) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n${blocks.join("\n")}\n\n</urlset>\n`;
  writeFileSync(filePath, xml);
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

const sitemapFiles = [];

// ---------------------------------------------------------------------------
// 1. PDF keyword sitemaps (sitemap-1 .. sitemap-6)
// ---------------------------------------------------------------------------
const pdfKeywords = JSON.parse(
  readFileSync(resolve(DATA, "pdf-keywords.json"), "utf8")
);
console.log(`Loaded ${pdfKeywords.length.toLocaleString()} PDF keywords.`);

const pdfChunks = chunk(pdfKeywords, URLS_PER_SITEMAP);
pdfChunks.forEach((entries, i) => {
  const index = i + 1;
  const file = `sitemap-${index}.xml`;
  const blocks = entries.map((k) =>
    urlBlock(`${SITE_URL}/pdf/${k.slug}`, { changefreq: "monthly", priority: "0.7" })
  );
  writeUrlset(resolve(PUBLIC, file), blocks);
  sitemapFiles.push(file);
  console.log(`Wrote ${file} (${entries.length.toLocaleString()} URLs)`);
});

// ---------------------------------------------------------------------------
// 2. Geo keyword sitemaps (sitemap-7 .. sitemap-11)
// ---------------------------------------------------------------------------
const geoSlugs = [];
for (const entry of iterateGeoEntries(GEO_MAX)) geoSlugs.push(entry.slug);
const uniqueGeoSlugs = [...new Set(geoSlugs)];
console.log(`Generated ${uniqueGeoSlugs.length.toLocaleString()} unique geo slugs.`);

// Derive the geo sitemap start from the PDF chunk count so the two sets can
// never silently collide or leave a gap if pdf-keywords.json size changes.
const geoStart = pdfChunks.length + 1;
if (geoStart !== GEO_SITEMAP_START) {
  console.warn(
    `Note: geo sitemaps now start at ${geoStart} (PDF produced ${pdfChunks.length} sitemaps; GEO_SITEMAP_START expected ${GEO_SITEMAP_START}).`
  );
}

const geoChunks = chunk(uniqueGeoSlugs, URLS_PER_SITEMAP);
geoChunks.forEach((slugs, i) => {
  const index = geoStart + i;
  const file = `sitemap-${index}.xml`;
  const blocks = slugs.map((slug) =>
    urlBlock(`${SITE_URL}/geo/${slug}`, { changefreq: "weekly", priority: "0.6" })
  );
  writeUrlset(resolve(PUBLIC, file), blocks);
  sitemapFiles.push(file);
  console.log(`Wrote ${file} (${slugs.length.toLocaleString()} URLs)`);
});

// ---------------------------------------------------------------------------
// 3. Sitemap index (landing sitemap + all keyword sitemaps)
// ---------------------------------------------------------------------------
const indexEntries = ["sitemap.xml", ...sitemapFiles]
  .map((file) => `  <sitemap>\n    <loc>${SITE_URL}/${file}</loc>\n  </sitemap>`)
  .join("\n");
const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n${indexEntries}\n\n</sitemapindex>\n`;
writeFileSync(resolve(PUBLIC, "sitemap-index.xml"), indexXml);

const totalIndexed = pdfKeywords.length + uniqueGeoSlugs.length;
console.log(`Wrote sitemap-index.xml (${sitemapFiles.length + 1} sitemaps).`);

// ---------------------------------------------------------------------------
// 4. robots.txt — AI-crawler friendly
// ---------------------------------------------------------------------------
const aiBots = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Googlebot",
  "Bingbot",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
  "cohere-ai",
  "Amazonbot",
  "Meta-ExternalAgent",
  "DuckAssistBot",
  "YouBot",
];

const robots = [
  "# PDFShuffl — open to search engines and AI assistants.",
  "User-agent: *",
  "Allow: /",
  "",
  ...aiBots.flatMap((bot) => [`User-agent: ${bot}`, "Allow: /", ""]),
  `Sitemap: ${SITE_URL}/sitemap-index.xml`,
  "",
  `# LLM-readable summary: ${SITE_URL}/llms.txt`,
  `Host: ${SITE_URL.replace(/^https?:\/\//, "")}`,
  "",
].join("\n");
writeFileSync(resolve(PUBLIC, "robots.txt"), robots);
console.log("Wrote robots.txt");

// ---------------------------------------------------------------------------
// 5. api/tools.json — machine-readable tool registry
// ---------------------------------------------------------------------------
const toolsRegistry = {
  name: "PDFShuffl",
  description:
    "Free, fast, browser-based PDF tools to convert, edit, compress, merge, split and sign PDF files online.",
  url: SITE_URL,
  llms_txt: `${SITE_URL}/llms.txt`,
  sitemap: `${SITE_URL}/sitemap-index.xml`,
  generated_at: new Date().toISOString(),
  tools: geoTools.map((name) => ({
    name,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    description: `${name} online with PDFShuffl — free, secure and browser-based, no installation required.`,
  })),
};
writeFileSync(
  resolve(PUBLIC, "api", "tools.json"),
  JSON.stringify(toolsRegistry, null, 2) + "\n"
);
console.log(`Wrote api/tools.json (${toolsRegistry.tools.length} tools)`);

// ---------------------------------------------------------------------------
// 6. llms.txt — LLM-readable site summary (https://llmstxt.org)
// ---------------------------------------------------------------------------
const featuredTools = geoTools.slice(0, 20);
const llms = [
  "# PDFShuffl",
  "",
  "> PDFShuffl is a free, fast, privacy-friendly suite of browser-based PDF tools. Convert, edit, compress, merge, split, sign and organise PDF files online from any device — no installation or signup required.",
  "",
  "PDFShuffl runs entirely in the browser. Files are processed securely and are not shared. The service is available worldwide, including geo-targeted landing pages for major countries and cities.",
  "",
  "## Core tools",
  "",
  ...featuredTools.map(
    (name) =>
      `- [${name}](${SITE_URL}/tools): ${name} online — free, secure, no signup.`
  ),
  "",
  "## Key pages",
  "",
  `- [Home](${SITE_URL}/): Full PDF toolkit and uploader.`,
  `- [All tools](${SITE_URL}/tools): Browse every PDF conversion and editing tool.`,
  `- [Articles](${SITE_URL}/articles): Guides and how-tos for working with PDFs.`,
  `- [About](${SITE_URL}/about): What PDFShuffl is and how it works.`,
  `- [Contact](${SITE_URL}/contact): Get in touch with the PDFShuffl team.`,
  "",
  "## Machine-readable data",
  "",
  `- [Tool registry (JSON)](${SITE_URL}/api/tools.json): Machine-readable list of all PDFShuffl tools.`,
  `- [Sitemap index](${SITE_URL}/sitemap-index.xml): All indexed pages.`,
  "",
  `_Indexed pages: ${totalIndexed.toLocaleString()} (PDF keyword pages + geo-targeted pages)._`,
  "",
].join("\n");
writeFileSync(resolve(PUBLIC, "llms.txt"), llms);
console.log("Wrote llms.txt");

// ---------------------------------------------------------------------------
console.log("");
console.log("SEO/GEO generation complete.");
console.log(`  PDF pages:   ${pdfKeywords.length.toLocaleString()}`);
console.log(`  Geo pages:   ${uniqueGeoSlugs.length.toLocaleString()}`);
console.log(`  Total URLs:  ${totalIndexed.toLocaleString()}`);
console.log(`  Sitemaps:    ${sitemapFiles.length} (+ landing sitemap.xml)`);
