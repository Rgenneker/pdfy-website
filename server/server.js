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

app.listen(5000, () => {
  console.log("PDFShuffl backend running on http://localhost:5000");
});