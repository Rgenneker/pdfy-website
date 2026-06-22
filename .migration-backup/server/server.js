const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const app = express();
const upload = multer({
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

app.use(cors());

app.post("/txt-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const text = req.file.buffer.toString("utf8");

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const lines = text.match(/.{1,85}/g) || [""];

    let y = 790;
    for (const line of lines) {
      if (y < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = 790;
      }

      page.drawText(line, {
        x: 50,
        y,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 18;
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=PDFShuffl-converted.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).send("PDF conversion failed");
  }
});

app.post("/jpg-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No image uploaded");
    }

    const pdfDoc = await PDFDocument.create();

    let image;

    if (req.file.mimetype === "image/png") {
      image = await pdfDoc.embedPng(new Uint8Array(req.file.buffer));
    } else {
      image = await pdfDoc.embedJpg(new Uint8Array(req.file.buffer));
    }

    const { width, height } = image.scale(1);

    const page = pdfDoc.addPage([width, height]);

    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-image.pdf"
    );

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).send("Image conversion failed");
  }
});

app.post("/word-to-pdf", upload.single("file"), async (req, res) => {
  try {
    const mammoth = require("mammoth");

    const result = await mammoth.extractRawText({
      buffer: req.file.buffer,
    });

    const text = result.value || "Empty document";

    const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([595, 842]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(text.substring(0, 4000), {
      x: 50,
      y: 780,
      size: 12,
      font,
      color: rgb(0, 0, 0),
      maxWidth: 500,
      lineHeight: 18,
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-word.pdf"
    );

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).send("Word to PDF conversion failed.");
  }
});
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

app.post("/ppt-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No PPT file uploaded");
    }

    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const inputPath = path.join(tempDir, req.file.originalname);
    fs.writeFileSync(inputPath, req.file.buffer);

    execFile(
      "soffice",
      [
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        tempDir,
        inputPath,
      ],
      (error) => {
        if (error) {
          console.error(error);
          return res.status(500).send("PPT to PDF conversion failed");
        }

        const outputFileName =
          path.basename(req.file.originalname, path.extname(req.file.originalname)) + ".pdf";

        const outputPath = path.join(tempDir, outputFileName);

        if (!fs.existsSync(outputPath)) {
          return res.status(500).send("Converted PDF not found");
        }

        res.download(outputPath, "PDFShuffl-presentation.pdf", () => {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("PPT to PDF conversion failed");
  }
});
app.post("/libre-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No LibreOffice file uploaded");
    }

    const fs = require("fs");
    const path = require("path");
    const { execFile } = require("child_process");

    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const inputPath = path.join(tempDir, req.file.originalname);
    fs.writeFileSync(inputPath, req.file.buffer);

    execFile(
      "soffice",
      ["--headless", "--convert-to", "pdf", "--outdir", tempDir, inputPath],
      (error) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Libre to PDF conversion failed");
        }

        const outputFileName =
          path.basename(req.file.originalname, path.extname(req.file.originalname)) + ".pdf";

        const outputPath = path.join(tempDir, outputFileName);

        if (!fs.existsSync(outputPath)) {
          return res.status(500).send("Converted PDF not found");
        }

        res.download(outputPath, "PDFShuffl-libre.pdf", () => {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Libre to PDF conversion failed");
  }
});
app.post("/csv-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No CSV file uploaded");
    }

    const csvText = req.file.buffer.toString("utf8");

    const rows = csvText
      .split(/\r?\n/)
      .filter((row) => row.trim() !== "")
      .map((row) => row.split(","));

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([842, 595]); // landscape
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 540;
    const startX = 40;
    const colWidth = 120;
    const rowHeight = 22;

    rows.forEach((row) => {
      if (y < 50) {
        page = pdfDoc.addPage([842, 595]);
        y = 540;
      }

      row.slice(0, 6).forEach((cell, index) => {
        page.drawText(String(cell).slice(0, 20), {
          x: startX + index * colWidth,
          y,
          size: 9,
          font,
        });
      });

      y -= rowHeight;
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-csv.pdf"
    );

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).send("CSV to PDF conversion failed");
  }
});
app.post("/excel-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No Excel file uploaded");
    }

    const fs = require("fs");
    const path = require("path");
    const { execFile } = require("child_process");

    const tempDir = path.join(__dirname, "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const inputPath = path.join(tempDir, req.file.originalname);

    fs.writeFileSync(inputPath, req.file.buffer);

    execFile(
      "soffice",
      [
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        tempDir,
        inputPath,
      ],
      (error) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Excel to PDF conversion failed");
        }

        const outputFileName =
          path.basename(
            req.file.originalname,
            path.extname(req.file.originalname)
          ) + ".pdf";

        const outputPath = path.join(tempDir, outputFileName);

        if (!fs.existsSync(outputPath)) {
          return res.status(500).send("Converted PDF not found");
        }

        res.download(outputPath, "PDFShuffl-excel.pdf", () => {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Excel to PDF conversion failed");
  }
});
app.post("/pdf-to-txt", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No PDF file uploaded");
    }

    const pdfParse = require("pdf-parse");
    const data = await pdfParse(req.file.buffer);

    const extractedText = data.text || "No readable text found in this PDF.";

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-extracted-text.txt"
    );

    res.send(extractedText);
  } catch (error) {
    console.error(error);
    res.status(500).send("PDF to TXT conversion failed");
  }
});
app.post("/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No PDF file uploaded");
    }

    const pdfParse = require("pdf-parse");
    const { Document, Packer, Paragraph, TextRun } = require("docx");

    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text || "No readable text found in this PDF.";

    const paragraphs = extractedText
      .split(/\n+/)
      .filter((line) => line.trim() !== "")
      .map(
        (line) =>
          new Paragraph({
            children: [
              new TextRun({
                text: line.trim(),
                size: 22,
              }),
            ],
            spacing: {
              after: 160,
            },
          })
      );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-converted-word.docx"
    );

    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("PDF to Word conversion failed");
  }
});
app.post("/pdf-to-libre", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No PDF file uploaded");
    }

    const fs = require("fs");
    const path = require("path");
    const { execFile } = require("child_process");
    const pdfParse = require("pdf-parse");
    const { Document, Packer, Paragraph, TextRun } = require("docx");

    const tempDir = path.join(__dirname, "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text || "No readable text found in this PDF.";

    const paragraphs = extractedText
      .split(/\n+/)
      .filter((line) => line.trim() !== "")
      .map(
        (line) =>
          new Paragraph({
            children: [new TextRun(line.trim())],
          })
      );

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const docxBuffer = await Packer.toBuffer(doc);

    const docxPath = path.join(tempDir, "PDFShuffl-converted-libre.docx");
    const odtPath = path.join(tempDir, "PDFShuffl-converted-libre.odt");

    fs.writeFileSync(docxPath, docxBuffer);

    execFile(
      "soffice",
      [
        "--headless",
        "--convert-to",
        "odt",
        "--outdir",
        tempDir,
        docxPath,
      ],
      (error) => {
        if (error) {
          console.error(error);
          return res.status(500).send("PDF to Libre conversion failed");
        }

        if (!fs.existsSync(odtPath)) {
          return res.status(500).send("Converted Libre file not found");
        }

        res.download(odtPath, "PDFShuffl-converted-libre.odt", () => {
          if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
          if (fs.existsSync(odtPath)) fs.unlinkSync(odtPath);
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("PDF to Libre conversion failed");
  }
});
app.post("/sign-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No PDF file uploaded");
    }

    const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

    const signerName = req.body.signerName || "PDFShuffl Signature";

    const pdfDoc = await PDFDocument.load(req.file.buffer);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    lastPage.drawText(`Signed by: ${signerName}`, {
      x: 50,
      y: 60,
      size: 16,
      font,
      color: rgb(0.88, 0.08, 0.24),
    });

    lastPage.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: 38,
      size: 10,
      color: rgb(0.25, 0.25, 0.25),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-signed.pdf"
    );

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).send("Sign PDF failed");
  }
});
app.post("/html-to-pdf", upload.single("file"), async (req, res) => {
  let browser;

  try {
    if (!req.file) {
      return res.status(400).send("No HTML file uploaded");
    }

    const puppeteer = require("puppeteer");

    const htmlContent = req.file.buffer.toString("utf8");

    browser = await puppeteer.launch({
      headless: "new",
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-html.pdf"
    );

    res.send(pdfBuffer);
  } catch (error) {
    if (browser) {
      await browser.close();
    }

    console.error(error);
    res.status(500).send("HTML to PDF conversion failed");
  }
});
app.post("/pdf-to-html", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No PDF file uploaded");
    }

    const pdfParse = require("pdf-parse");

    const data = await pdfParse(req.file.buffer);

    const extractedText =
      data.text || "No readable text found in this PDF.";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>PDFShuffl HTML Export</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      line-height: 1.7;
      color: #111827;
    }

    h1 {
      color: #e11d48;
    }

    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <h1>PDFShuffl HTML Export</h1>
  <pre>${extractedText}</pre>
</body>
</html>
`;

    res.setHeader("Content-Type", "text/html");

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-export.html"
    );

    res.send(htmlContent);
  } catch (error) {
    console.error(error);
    res.status(500).send("PDF to HTML conversion failed");
  }
});
app.post("/sign-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No PDF file uploaded");
    }

    const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

    const signerName = req.body.signerName || "PDFShuffl Signature";

    const pdfDoc = await PDFDocument.load(req.file.buffer);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    lastPage.drawText(`Signed by: ${signerName}`, {
      x: 50,
      y: 60,
      size: 16,
      font,
      color: rgb(0.88, 0.08, 0.24),
    });

    lastPage.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: 38,
      size: 10,
      color: rgb(0.25, 0.25, 0.25),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-signed.pdf"
    );

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).send("Sign PDF failed");
  }
});
app.post("/request-signing", upload.single("file"), async (req, res) => {
  try {
    const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

    const recipientEmail = req.body.recipientEmail || "Not provided";
    const instructions = req.body.instructions || "No instructions provided";
    const originalFile = req.file?.originalname || "No file uploaded";

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText("PDFShuffl Signing Request", {
      x: 50,
      y: 780,
      size: 24,
      font: titleFont,
      color: rgb(0.88, 0.08, 0.24),
    });

    page.drawText("A document has been prepared for signing.", {
      x: 50,
      y: 740,
      size: 12,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Document: ${originalFile}`, {
      x: 50,
      y: 700,
      size: 12,
      font,
    });

    page.drawText(`Recipient Email: ${recipientEmail}`, {
      x: 50,
      y: 670,
      size: 12,
      font,
    });

    page.drawText(`Requested Date: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: 640,
      size: 12,
      font,
    });

    page.drawText("Instructions:", {
      x: 50,
      y: 600,
      size: 14,
      font: titleFont,
      color: rgb(0.05, 0.05, 0.05),
    });

    const cleanInstructions = String(instructions).slice(0, 1200);
    const lines = cleanInstructions.match(/.{1,85}/g) || ["No instructions provided"];

    let y = 570;

    lines.forEach((line) => {
      if (y > 80) {
        page.drawText(line, {
          x: 50,
          y,
          size: 11,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });

        y -= 18;
      }
    });

    page.drawText("Generated by PDFShuffl. This file records the signing request workflow.", {
      x: 50,
      y: 50,
      size: 9,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-signing-request.pdf"
    );

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).send("Request signing failed");
  }
});
app.post("/crop-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No PDF file uploaded");
    }

    const { PDFDocument } = require("pdf-lib");

    const pdfDoc = await PDFDocument.load(req.file.buffer);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();

      const margin = 30;

      page.setCropBox(
        margin,
        margin,
        width - margin * 2,
        height - margin * 2
      );
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-cropped.pdf"
    );

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).send("Crop PDF failed");
  }
});
app.post("/compress-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No PDF file uploaded");
    }

    const fs = require("fs");
    const path = require("path");
    const { execFile } = require("child_process");

    const tempDir = path.join(__dirname, "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const inputPath = path.join(tempDir, "input.pdf");
    const outputPath = path.join(tempDir, "compressed.pdf");

    fs.writeFileSync(inputPath, req.file.buffer);

    execFile(
      "gswin64c",
      [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/ebook",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        `-sOutputFile=${outputPath}`,
        inputPath,
      ],
      (error) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Compress PDF failed");
        }

        res.download(outputPath, "PDFShuffl-compressed.pdf", () => {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Compress PDF failed");
  }
});
app.post("/create-pdf", express.json(), async (req, res) => {
  try {
    const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

    const text = req.body.text || "Created with PDFShuffl.";

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);

    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText("PDFShuffl Created Document", {
      x: 50,
      y: 790,
      size: 22,
      font: titleFont,
      color: rgb(0.88, 0.08, 0.24),
    });

    const lines = text.match(/.{1,85}/g) || [""];

    let y = 740;

    for (const line of lines) {
      if (y < 60) {
        page = pdfDoc.addPage([595, 842]);
        y = 790;
      }

      page.drawText(line, {
        x: 50,
        y,
        size: 11,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });

      y -= 18;
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PDFShuffl-created.pdf"
    );

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).send("Create PDF failed");
  }
});
app.listen(5000, () => {
  console.log("PDFShuffl backend running on http://localhost:5000");
});