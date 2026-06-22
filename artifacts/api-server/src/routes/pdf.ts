import { Router, type IRouter } from "express";
import multer from "multer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Strip XML tags and decode the common entities so OpenDocument text content
// renders as plain readable text.
function decodeXmlText(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

// Escape text for safe inclusion in generated XML.
function escapeXmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;");
}

// pdf-lib's standard fonts only support WinAnsi encoding, so replace anything
// outside that range to avoid runtime encode errors.
function sanitizeForPdf(s: string): string {
  return s.replace(/[\u0000-\u001F]/g, " ").replace(/[^\x20-\xFF]/g, "?");
}

// Word-aware line wrapping with a hard fallback for very long tokens.
function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const words = rawLine.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      if (word.length > maxChars) {
        if (current) { lines.push(current); current = ""; }
        const chunks = word.match(new RegExp(`.{1,${maxChars}}`, "g")) || [word];
        chunks.forEach((c) => lines.push(c));
        continue;
      }
      if (current.length + word.length + (current ? 1 : 0) > maxChars) {
        lines.push(current);
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

router.post("/txt-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");
    const text = req.file.buffer.toString("utf8");
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const lines = text.match(/.{1,85}/g) || [""];
    let y = 790;
    for (const line of lines) {
      if (y < 50) { page = pdfDoc.addPage([595, 842]); y = 790; }
      page.drawText(line, { x: 50, y, size: 11, font, color: rgb(0, 0, 0) });
      y -= 18;
    }
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-converted.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("PDF conversion failed");
  }
});

router.post("/jpg-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No image uploaded");
    const pdfDoc = await PDFDocument.create();
    let image;
    if (req.file.mimetype === "image/png") {
      image = await pdfDoc.embedPng(new Uint8Array(req.file.buffer));
    } else {
      image = await pdfDoc.embedJpg(new Uint8Array(req.file.buffer));
    }
    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-image.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("Image conversion failed");
  }
});

router.post("/word-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");
    // @ts-ignore
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const text = result.value || "Empty document";
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(text.substring(0, 4000), { x: 50, y: 780, size: 12, font, color: rgb(0, 0, 0), maxWidth: 500, lineHeight: 18 });
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-word.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("Word to PDF conversion failed.");
  }
});

router.post("/csv-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No CSV file uploaded");
    const csvText = req.file.buffer.toString("utf8");
    const rows = csvText.split(/\r?\n/).filter(r => r.trim() !== "").map(r => r.split(","));
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([842, 595]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let y = 540;
    const startX = 40, colWidth = 120, rowHeight = 22;
    rows.forEach(row => {
      if (y < 50) { page = pdfDoc.addPage([842, 595]); y = 540; }
      row.slice(0, 6).forEach((cell, i) => {
        page.drawText(String(cell).slice(0, 20), { x: startX + i * colWidth, y, size: 9, font });
      });
      y -= rowHeight;
    });
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-csv.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("CSV to PDF conversion failed");
  }
});

router.post("/pdf-to-txt", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No PDF file uploaded");
    // @ts-ignore
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text || "No readable text found in this PDF.";
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-extracted-text.txt");
    res.send(extractedText);
  } catch (err) {
    logger.error(err);
    res.status(500).send("PDF to TXT conversion failed");
  }
});

router.post("/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No PDF file uploaded");
    // @ts-ignore
    const pdfParse = (await import("pdf-parse")).default;
    const { Document, Packer, Paragraph, TextRun } = await import("docx");
    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text || "No readable text found in this PDF.";
    const paragraphs = extractedText.split(/\n+/).filter((l: string) => l.trim() !== "").map(
      (line: string) => new Paragraph({ children: [new TextRun({ text: line.trim(), size: 22 })], spacing: { after: 160 } })
    );
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const buffer = await Packer.toBuffer(doc);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-converted-word.docx");
    res.send(buffer);
  } catch (err) {
    logger.error(err);
    res.status(500).send("PDF to Word conversion failed");
  }
});

router.post("/sign-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No PDF file uploaded");
    const signerName = (req.body as Record<string, string>).signerName || "PDFShuffl Signature";
    const pdfDoc = await PDFDocument.load(req.file.buffer);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    lastPage.drawText(`Signed by: ${signerName}`, { x: 50, y: 60, size: 16, font, color: rgb(0.88, 0.08, 0.24) });
    lastPage.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 38, size: 10, color: rgb(0.25, 0.25, 0.25) });
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-signed.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("Sign PDF failed");
  }
});

router.post("/crop-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No PDF file uploaded");
    const pdfDoc = await PDFDocument.load(req.file.buffer);
    const pages = pdfDoc.getPages();
    pages.forEach(page => {
      const { width, height } = page.getSize();
      const margin = 30;
      page.setCropBox(margin, margin, width - margin * 2, height - margin * 2);
    });
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-cropped.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("Crop PDF failed");
  }
});

router.post("/create-pdf", async (req, res) => {
  try {
    const text = (req.body as Record<string, string>).text || "Created with PDFShuffl.";
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText("PDFShuffl Created Document", { x: 50, y: 790, size: 22, font: titleFont, color: rgb(0.88, 0.08, 0.24) });
    const lines = text.match(/.{1,85}/g) || [""];
    let y = 740;
    for (const line of lines) {
      if (y < 60) { page = pdfDoc.addPage([595, 842]); y = 790; }
      page.drawText(line, { x: 50, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
      y -= 18;
    }
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-created.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("Create PDF failed");
  }
});

router.post("/request-signing", upload.single("file"), async (req, res) => {
  try {
    const body = req.body as Record<string, string>;
    const requesterName = body.requesterName || "Requester";
    const signerName = body.signerName || "Signer";
    const instructions = body.instructions || "Please sign this document.";
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText("Document Signing Request", { x: 50, y: 780, size: 22, font: titleFont, color: rgb(0.88, 0.08, 0.24) });
    page.drawText(`Requested by: ${requesterName}`, { x: 50, y: 740, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`Signer: ${signerName}`, { x: 50, y: 715, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 690, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText("Instructions:", { x: 50, y: 650, size: 14, font: titleFont, color: rgb(0.05, 0.05, 0.05) });
    const cleanInstructions = String(instructions).slice(0, 1200);
    const lines = cleanInstructions.match(/.{1,85}/g) || ["No instructions provided"];
    let y = 620;
    lines.forEach(line => {
      if (y > 80) { page.drawText(line, { x: 50, y, size: 11, font, color: rgb(0.2, 0.2, 0.2) }); y -= 18; }
    });
    page.drawText("Generated by PDFShuffl.", { x: 50, y: 50, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-signing-request.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("Request signing failed");
  }
});

router.post("/ppt-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");
    // @ts-ignore
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(req.file.buffer);
    const slideFiles = Object.keys(zip.files)
      .filter((f) => f.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0");
        const nb = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0");
        return na - nb;
      });
    const pdfDoc = await PDFDocument.create();
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    if (slideFiles.length === 0) {
      const page = pdfDoc.addPage([842, 595]);
      page.drawText("No slides found in this presentation.", { x: 50, y: 300, size: 14, font, color: rgb(0.3, 0.3, 0.3) });
    }
    for (let si = 0; si < slideFiles.length; si++) {
      const xmlStr = await zip.files[slideFiles[si]].async("string");
      const texts: string[] = [];
      const tagRe = /<a:t[^>]*>([^<]*)<\/a:t>/g;
      let m;
      while ((m = tagRe.exec(xmlStr)) !== null) {
        const t = m[1].trim();
        if (t) texts.push(t);
      }
      const page = pdfDoc.addPage([842, 595]);
      page.drawText(`Slide ${si + 1}`, { x: 40, y: 560, size: 14, font: titleFont, color: rgb(0.88, 0.08, 0.24) });
      let y = 530;
      for (const line of texts) {
        const wrapped = line.match(/.{1,100}/g) || [line];
        for (const chunk of wrapped) {
          if (y < 40) break;
          page.drawText(chunk, { x: 50, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
          y -= 18;
        }
        if (y < 40) break;
      }
    }
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-presentation.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("PPT to PDF conversion failed");
  }
});

router.post("/excel-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");
    // @ts-ignore
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const pdfDoc = await PDFDocument.create();
    const headerFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as string[][];
      if (rows.length === 0) continue;
      let page = pdfDoc.addPage([842, 595]);
      page.drawText(sheetName, { x: 40, y: 560, size: 14, font: headerFont, color: rgb(0.88, 0.08, 0.24) });
      let y = 530;
      const colCount = Math.max(...rows.map((r) => r.length));
      const colWidth = Math.min(130, Math.floor(760 / Math.max(colCount, 1)));
      const startX = 40;
      for (let ri = 0; ri < rows.length; ri++) {
        if (y < 40) { page = pdfDoc.addPage([842, 595]); y = 560; }
        const rowFont = ri === 0 ? headerFont : font;
        const color = ri === 0 ? rgb(0.1, 0.1, 0.5) : rgb(0.1, 0.1, 0.1);
        rows[ri].slice(0, Math.floor(760 / colWidth)).forEach((cell, ci) => {
          const text = String(cell ?? "").slice(0, 18);
          page.drawText(text, { x: startX + ci * colWidth, y, size: 9, font: rowFont, color });
        });
        y -= 18;
      }
    }
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-excel.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("Excel to PDF conversion failed");
  }
});

router.post("/compress-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No PDF file uploaded");
    const pdfDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("PDFShuffl");
    pdfDoc.setCreator("PDFShuffl");
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
    const originalSize = req.file.buffer.length;
    const compressedSize = pdfBytes.length;
    const savings = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-compressed.pdf");
    res.setHeader("X-Original-Size", String(originalSize));
    res.setHeader("X-Compressed-Size", String(compressedSize));
    res.setHeader("X-Size-Savings-Percent", String(savings));
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("Compress PDF failed");
  }
});

// LibreOffice / OpenDocument formats (.odt, .ods, .odp) are ZIP archives that
// contain a content.xml — so we can read them directly with JSZip, no system
// LibreOffice binary required.
router.post("/libre-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");
    // @ts-ignore
    const JSZip = (await import("jszip")).default;
    let zip;
    try {
      zip = await JSZip.loadAsync(req.file.buffer);
    } catch {
      return res.status(400).send("Not a valid OpenDocument file (.odt, .ods, .odp).");
    }
    const contentFile = zip.file("content.xml");
    if (!contentFile) return res.status(400).send("Not a valid OpenDocument file (.odt, .ods, .odp).");
    const xml: string = await contentFile.async("string");
    const mimeFile = zip.file("mimetype");
    const mimetype: string = mimeFile ? (await mimeFile.async("string")).trim() : "";

    const pdfDoc = await PDFDocument.create();
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    if (mimetype.includes("spreadsheet")) {
      // ODS — render each table as a grid, mirroring the Excel handler.
      const tableRe = /<table:table\b[^>]*>([\s\S]*?)<\/table:table>/g;
      let tableMatch: RegExpExecArray | null;
      let any = false;
      while ((tableMatch = tableRe.exec(xml)) !== null) {
        const tableXml = tableMatch[1];
        const rows: string[][] = [];
        const rowRe = /<table:table-row\b[^>]*>([\s\S]*?)<\/table:table-row>/g;
        let rowMatch: RegExpExecArray | null;
        while ((rowMatch = rowRe.exec(tableXml)) !== null) {
          const rowXml = rowMatch[1];
          const cells: string[] = [];
          const cellRe = /<table:(?:table-cell|covered-table-cell)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/table:(?:table-cell|covered-table-cell)>)/g;
          let cellMatch: RegExpExecArray | null;
          while ((cellMatch = cellRe.exec(rowXml)) !== null) {
            const attrs = cellMatch[1] || "";
            const inner = cellMatch[2] || "";
            const text = decodeXmlText(inner).trim();
            let repeat = 1;
            const repAttr = attrs.match(/table:number-columns-repeated="(\d+)"/);
            if (repAttr) repeat = Math.min(parseInt(repAttr[1], 10) || 1, text ? 20 : 5);
            for (let r = 0; r < repeat && cells.length < 50; r++) cells.push(text);
          }
          while (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
          rows.push(cells);
        }
        while (rows.length > 0 && rows[rows.length - 1].length === 0) rows.pop();
        if (rows.length === 0) continue;
        any = true;
        let page = pdfDoc.addPage([842, 595]);
        let y = 530;
        const colCount = Math.max(...rows.map((r) => r.length), 1);
        const colWidth = Math.min(130, Math.floor(760 / colCount));
        const startX = 40;
        for (let ri = 0; ri < rows.length; ri++) {
          if (y < 40) { page = pdfDoc.addPage([842, 595]); y = 560; }
          const rowFont = ri === 0 ? titleFont : font;
          const color = ri === 0 ? rgb(0.1, 0.1, 0.5) : rgb(0.1, 0.1, 0.1);
          rows[ri].slice(0, Math.floor(760 / colWidth)).forEach((cell, ci) => {
            page.drawText(sanitizeForPdf(String(cell)).slice(0, 18), { x: startX + ci * colWidth, y, size: 9, font: rowFont, color });
          });
          y -= 18;
        }
      }
      if (!any) {
        const page = pdfDoc.addPage([842, 595]);
        page.drawText("No spreadsheet data found.", { x: 50, y: 300, size: 14, font, color: rgb(0.3, 0.3, 0.3) });
      }
    } else if (mimetype.includes("presentation")) {
      // ODP — one PDF page per slide.
      const pageRe = /<draw:page\b[^>]*>([\s\S]*?)<\/draw:page>/g;
      let pageMatch: RegExpExecArray | null;
      let slideNum = 0;
      while ((pageMatch = pageRe.exec(xml)) !== null) {
        slideNum++;
        const slideXml = pageMatch[1];
        const texts: string[] = [];
        const textRe = /<text:(?:p|h)\b[^>]*>([\s\S]*?)<\/text:(?:p|h)>/g;
        let tm: RegExpExecArray | null;
        while ((tm = textRe.exec(slideXml)) !== null) {
          const t = decodeXmlText(tm[1]).trim();
          if (t) texts.push(t);
        }
        const page = pdfDoc.addPage([842, 595]);
        page.drawText(`Slide ${slideNum}`, { x: 40, y: 560, size: 14, font: titleFont, color: rgb(0.88, 0.08, 0.24) });
        let y = 530;
        for (const line of texts) {
          for (const chunk of wrapText(line, 100)) {
            if (y < 40) break;
            page.drawText(sanitizeForPdf(chunk), { x: 50, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
            y -= 18;
          }
          if (y < 40) break;
        }
      }
      if (slideNum === 0) {
        const page = pdfDoc.addPage([842, 595]);
        page.drawText("No slides found in this presentation.", { x: 50, y: 300, size: 14, font, color: rgb(0.3, 0.3, 0.3) });
      }
    } else {
      // ODT (text document) and anything else — flow paragraphs and headings.
      const blockRe = /<text:(h|p)\b[^>]*>([\s\S]*?)<\/text:(?:h|p)>/g;
      let page = pdfDoc.addPage([595, 842]);
      let y = 790;
      let bm: RegExpExecArray | null;
      let drewAnything = false;
      while ((bm = blockRe.exec(xml)) !== null) {
        const isHeading = bm[1] === "h";
        const text = decodeXmlText(bm[2]).trim();
        if (!text) { y -= 10; continue; }
        drewAnything = true;
        const size = isHeading ? 15 : 11;
        const useFont = isHeading ? titleFont : font;
        const lines = wrapText(text, isHeading ? 70 : 90);
        if (isHeading) y -= 6;
        for (const line of lines) {
          if (y < 50) { page = pdfDoc.addPage([595, 842]); y = 790; }
          page.drawText(sanitizeForPdf(line), { x: 50, y, size, font: useFont, color: isHeading ? rgb(0.1, 0.1, 0.1) : rgb(0.15, 0.15, 0.15) });
          y -= isHeading ? 22 : 16;
        }
      }
      if (!drewAnything) {
        page.drawText("No readable text found in this document.", { x: 50, y: 760, size: 12, font, color: rgb(0.3, 0.3, 0.3) });
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-libre.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error(err);
    res.status(500).send("Libre to PDF conversion failed");
  }
});

// Build a real, editable OpenDocument Text (.odt) file from a PDF's text.
// .odt is a ZIP — the "mimetype" entry must be first and stored uncompressed.
router.post("/pdf-to-libre", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No PDF file uploaded");
    // @ts-ignore
    const { PDFParse } = await import("pdf-parse");
    // @ts-ignore
    const JSZip = (await import("jszip")).default;
    const parser = new PDFParse({ data: new Uint8Array(req.file.buffer) });
    const parsed = await parser.getText();
    const text: string = parsed.text || "No readable text found in this PDF.";

    const paragraphs = text
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        return trimmed
          ? `<text:p text:style-name="Standard">${escapeXmlText(trimmed)}</text:p>`
          : `<text:p text:style-name="Standard"/>`;
      })
      .join("");

    const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2">
 <office:body><office:text>${paragraphs}</office:text></office:body>
</office:document-content>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" office:version="1.2"><office:styles/></office:document-styles>`;

    const metaXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" office:version="1.2"><office:meta><meta:generator>PDFShuffl</meta:generator></office:meta></office:document-meta>`;

    const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
 <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
 <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

    const zip = new JSZip();
    zip.file("mimetype", "application/vnd.oasis.opendocument.text", { compression: "STORE" });
    zip.file("META-INF/manifest.xml", manifestXml);
    zip.file("content.xml", contentXml);
    zip.file("styles.xml", stylesXml);
    zip.file("meta.xml", metaXml);
    const odtBuffer: Buffer = await zip.generateAsync({ type: "nodebuffer" });

    res.setHeader("Content-Type", "application/vnd.oasis.opendocument.text");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-converted-libre.odt");
    res.send(odtBuffer);
  } catch (err) {
    logger.error(err);
    res.status(500).send("PDF to Libre conversion failed");
  }
});

router.post("/html-to-pdf", upload.single("file"), (_req, res) => {
  res.status(501).send("HTML to PDF requires Puppeteer — not available in this environment.");
});
router.post("/pdf-to-html", upload.single("file"), (_req, res) => {
  res.status(501).send("PDF to HTML conversion not available in this environment.");
});

export default router;
