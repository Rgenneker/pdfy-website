const fs = require("fs");
const path = require("path");

const SITE_URL = "https://pdfshuffl.com";
const MAX_PAGES = 300000;
const MAX_URLS_PER_SITEMAP = 50000;

const baseKeywords = [
  "pdf converter", "convert pdf", "pdf conversion tool", "online pdf converter",
  "free pdf converter", "pdf file converter", "document converter", "pdf editor",
  "pdf tools", "pdf software", "pdf utility", "pdf online", "pdf management",
  "pdf processor", "pdf toolkit", "pdf to word", "convert pdf to word",
  "pdf to docx", "pdf to doc", "editable pdf to word", "pdf to microsoft word",
  "pdf word converter", "free pdf to word", "best pdf to word converter",
  "pdf document to word", "word to pdf", "convert word to pdf", "docx to pdf",
  "doc to pdf", "microsoft word to pdf", "free word to pdf converter",
  "online word to pdf", "save word as pdf", "word document to pdf",
  "pdf to excel", "excel to pdf", "xlsx to pdf", "pdf spreadsheet converter",
  "convert pdf to spreadsheet", "pdf table extractor", "pdf to csv", "csv to pdf",
  "spreadsheet converter", "data extraction from pdf", "pdf to powerpoint",
  "powerpoint to pdf", "ppt to pdf", "pptx to pdf", "pdf presentation converter",
  "pdf slides converter", "convert pdf to ppt", "pdf to jpg", "pdf to png",
  "jpg to pdf", "png to pdf", "image to pdf", "pdf image converter",
  "convert photos to pdf", "pdf to image", "image extraction from pdf",
  "edit pdf online", "modify pdf", "add text to pdf", "pdf annotation",
  "pdf markup", "pdf signer", "fill pdf forms", "pdf form editor",
  "pdf text editor", "password protect pdf", "unlock pdf", "remove pdf password",
  "pdf encryption", "pdf decryption", "secure pdf", "pdf permissions remover",
  "pdf security tools", "compress pdf", "reduce pdf size", "pdf optimizer",
  "shrink pdf file", "pdf file compressor", "smaller pdf files",
  "pdf size reducer", "optimize pdf online", "merge pdf", "combine pdf files",
  "pdf merger", "join pdf documents", "merge multiple pdfs", "pdf combine tool",
  "online pdf merger", "split pdf", "pdf splitter", "extract pdf pages",
  "separate pdf pages", "divide pdf document", "split large pdf", "pdf ocr",
  "ocr pdf", "scan pdf to text", "pdf text recognition", "image to text pdf",
  "searchable pdf", "ocr converter", "scanned pdf converter"
];

const modifiers = [
  "free", "online", "best", "fast", "secure", "easy", "simple", "instant",
  "professional", "high quality", "no signup", "without registration",
  "without watermark", "for students", "for business", "for work",
  "for school", "for office", "mobile friendly", "browser based",
  "quick", "reliable", "safe", "private", "advanced", "simple online",
"free online", "best online", "easy online", "fast online",
"no email required", "no account needed", "drag and drop",
"browser only", "cloud based", "desktop free", "mobile online",
];

const questionPrefixes = [
  "how to", "how do i", "best way to", "easy way to", "quick way to",
  "where to", "why use", "when to use"
];

const suffixes = [
  "online", "free", "fast", "securely", "without losing quality",
  "without software", "without registration", "on mobile", "on windows",
  "on mac", "for email", "for printing", "for upload", "for business",
  "for students", "step by step", "guide", "tutorial", "tool",
  "for beginners",
"for advanced users",
"for small business",
"for large files",
"for scanned files",
"for documents",
"for forms",
"for images",
"for invoices",
"for contracts",
"with no watermark",
"with no signup",
"with no email",
"with drag and drop",
"using browser",
"using mobile",
"using laptop",
"using phone",
"using windows",
"using mac",
"without app",
"without download",
"without login",
"without account",
"without email",
"without limits",
];

const locations = [
  "usa", "uk", "canada", "australia", "south africa", "india", "europe",
  "germany", "france", "dubai", "singapore", "new zealand",
  "philippines", "nigeria", "kenya", "ghana", "pakistan", "malaysia",
"ireland", "netherlands", "spain", "italy", "saudi arabia", "qatar",
"uae",
"japan",
"south korea",
"brazil",
"mexico",
"argentina",
"egypt",
"turkey",
];

const useCases = [
  "school", "university", "business", "legal documents", "invoices",
  "contracts", "reports", "forms", "scanned documents", "presentations",
  "spreadsheets", "images", "receipts", "bank statements", "tax documents",
  "job applications", "cv files", "resume files", "ebooks", "manuals",
"certificates", "school projects", "college assignments", "business proposals",
"quotes", "statements", "letters", "policy documents", "training documents"
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function addKeyword(set, keyword) {
  const clean = keyword.toLowerCase().replace(/\s+/g, " ").trim();
  if (!clean) return;
  set.add(clean);
}

const generated = new Set();

for (const base of baseKeywords) {
  addKeyword(generated, base);

  for (const modifier of modifiers) {
    addKeyword(generated, `${modifier} ${base}`);
    addKeyword(generated, `${base} ${modifier}`);
  }

  for (const question of questionPrefixes) {
    addKeyword(generated, `${question} ${base}`);
  }

  for (const suffix of suffixes) {
    addKeyword(generated, `${base} ${suffix}`);
  }

  for (const useCase of useCases) {
    addKeyword(generated, `${base} for ${useCase}`);
  }

  for (const location of locations) {
    addKeyword(generated, `${base} in ${location}`);
  }

  for (const modifier of modifiers) {
    for (const suffix of suffixes) {
      addKeyword(generated, `${modifier} ${base} ${suffix}`);
    }
  }

  for (const question of questionPrefixes) {
    for (const suffix of suffixes) {
      addKeyword(generated, `${question} ${base} ${suffix}`);
    }
  }

  for (const modifier of modifiers) {
    for (const useCase of useCases) {
      addKeyword(generated, `${modifier} ${base} for ${useCase}`);
    }
  }
}

const pages = Array.from(generated)
  .slice(0, MAX_PAGES)
  .map((keyword) => ({
    keyword,
    slug: slugify(keyword),
  }))
  .filter((item) => item.slug);

fs.mkdirSync(path.join(__dirname, "../src/data"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "../public"), { recursive: true });

fs.writeFileSync(
  path.join(__dirname, "../src/data/pdf-keywords.json"),
  JSON.stringify(pages, null, 2)
);

for (let i = 0; i < Math.ceil(pages.length / MAX_URLS_PER_SITEMAP); i++) {
  const chunk = pages.slice(
    i * MAX_URLS_PER_SITEMAP,
    (i + 1) * MAX_URLS_PER_SITEMAP
  );

  const urls = chunk
    .map(
      (page) => `
  <url>
    <loc>${SITE_URL}/pdf/${page.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("");

  fs.writeFileSync(
    path.join(__dirname, `../public/sitemap-${i + 1}.xml`),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
  );
}

const sitemapCount = Math.ceil(pages.length / MAX_URLS_PER_SITEMAP);

const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: sitemapCount })
  .map(
    (_, i) => `
  <sitemap>
    <loc>${SITE_URL}/sitemap-${i + 1}.xml</loc>
  </sitemap>`
  )
  .join("")}
</sitemapindex>`;

fs.writeFileSync(
  path.join(__dirname, "../public/sitemap-index.xml"),
  sitemapIndex
);

console.log(`Generated ${pages.length} PDF keyword pages`);
console.log(`Generated ${sitemapCount} sitemap files`);