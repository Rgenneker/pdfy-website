// Flagship article library for PDFShuffl.
// Articles are hand-authored long-form pieces (1,500-2,500 words) credited to
// the "Lexigenz Authors" editorial desk, organised into the three PDF tool
// categories. Each category lives in its own file so the library can scale.

import officeToPdf from "./office-to-pdf.js";
import officeToPdf2 from "./office-to-pdf-2.js";
import pdfToEditable from "./pdf-to-editable.js";
import pdfToEditable2 from "./pdf-to-editable-2.js";
import webImageSecure from "./web-image-secure.js";
import webImageSecure2 from "./web-image-secure-2.js";

export const ARTICLE_AUTHOR = "Lexigenz Authors";

export const articleCategories = [
  {
    id: "office-to-pdf",
    title: "Office to PDF",
    slug: "office-to-pdf",
    tagline: "Turn working documents into polished, portable PDFs.",
    description:
      "Convert Word, LibreOffice, PowerPoint, Excel, CSV and plain-text files into clean, consistent PDFs that look the same on every screen and printer.",
    tools: [
      "Word to PDF",
      "Libre to PDF",
      "PPT to PDF",
      "CSV to PDF",
      "Excel to PDF",
      "TXT to PDF",
    ],
  },
  {
    id: "pdf-to-editable",
    title: "PDF to Editable Formats",
    slug: "pdf-to-editable-formats",
    tagline: "Unlock the content trapped inside finished PDFs.",
    description:
      "Reopen and reuse PDF content by converting it back into editable Word, LibreOffice, HTML, CSV and text formats, without retyping a single line.",
    tools: [
      "PDF to Word",
      "PDF to Libre",
      "PDF to Editable PDF",
      "PDF to HTML",
      "PDF to CSV",
      "PDF to TXT",
    ],
  },
  {
    id: "web-image-secure",
    title: "Web, Image & Secure Workflows",
    slug: "web-image-and-secure-workflows",
    tagline: "Capture, compress, sign and protect documents end to end.",
    description:
      "Bring photos and web pages into PDF, then crop, compress, sign and secure them for sharing, archiving and approval workflows.",
    tools: [
      "JPG to PDF",
      "HTML to PDF",
      "Sign PDF",
      "Sign a Locked PDF",
      "Request Signing",
      "Crop PDF",
      "Compress PDF",
    ],
  },
];

export const articles = [
  ...officeToPdf,
  ...officeToPdf2,
  ...pdfToEditable,
  ...pdfToEditable2,
  ...webImageSecure,
  ...webImageSecure2,
];

export function slugifyArticle(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ensure every article has a stable slug derived from its title.
for (const article of articles) {
  if (!article.slug) article.slug = slugifyArticle(article.title);
}

export function articleWordCount(article) {
  let words = 0;
  for (const section of article.sections || []) {
    if (section.h) words += section.h.trim().split(/\s+/).length;
    for (const p of section.p || []) words += p.trim().split(/\s+/).length;
    for (const li of section.ul || []) words += li.trim().split(/\s+/).length;
    for (const item of section.faq || [])
      words +=
        (item.q || "").trim().split(/\s+/).length +
        (item.a || "").trim().split(/\s+/).length;
  }
  return words;
}

export function readTimeMinutes(article) {
  return Math.max(1, Math.round(articleWordCount(article) / 220));
}

export function getCategory(id) {
  return articleCategories.find((c) => c.id === id) || null;
}

export function getArticleBySlug(slug) {
  return articles.find((a) => a.slug === slug) || null;
}

export function getArticlesByCategory(id) {
  return articles.filter((a) => a.categoryId === id);
}

// Related articles: prefer same category, then top up from other categories.
export function getRelatedArticles(article, limit = 4) {
  if (!article) return [];
  const sameCategory = articles.filter(
    (a) => a.categoryId === article.categoryId && a.slug !== article.slug
  );
  const others = articles.filter(
    (a) => a.categoryId !== article.categoryId && a.slug !== article.slug
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export function getCategoryForTool(toolName) {
  return (
    articleCategories.find((c) => c.tools.includes(toolName)) || null
  );
}

export function getArticlesForTool(toolName, limit = 4) {
  // Prefer articles that explicitly reference this tool, then top up with
  // others from the same category so tool pages always have related reading.
  const direct = articles.filter((a) => (a.relatedTools || []).includes(toolName));
  const category = getCategoryForTool(toolName);
  const categoryArticles = category ? getArticlesByCategory(category.id) : [];
  const seen = new Set();
  const ordered = [];
  for (const a of [...direct, ...categoryArticles]) {
    if (seen.has(a.slug)) continue;
    seen.add(a.slug);
    ordered.push(a);
  }
  return ordered.slice(0, limit);
}
