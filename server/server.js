const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

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
app.listen(5000, () => {
  console.log("PDFShuffl backend running on http://localhost:5000");
});