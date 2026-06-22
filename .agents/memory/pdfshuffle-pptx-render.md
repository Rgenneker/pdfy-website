---
name: PDFShuffl PPTX-to-PDF faithful renderer
description: Why PPT-to-PDF renders OOXML natively (no LibreOffice/CloudConvert) and the constraints that shaped it.
---

# PPTX to PDF: native OOXML rendering

The api-server PPT-to-PDF converter renders PowerPoint OOXML directly into a PDF
(backgrounds, image positions, shape fills, title-vs-body text) instead of just
dumping slide text. Lives in `artifacts/api-server/src/lib/pptx.ts`.

## Why not LibreOffice / CloudConvert
- No `soffice`/`libreoffice`/`unoconv` binary exists in the Replit container, and
  LibreOffice-WASM is too heavy to bundle.
- CloudConvert (or similar) needs a paid API key the project doesn't have.
**Why it matters:** any future "improve fidelity" work must stay self-contained
(parse the zip + DrawingML ourselves) unless a real conversion engine becomes
available. Don't reach for a system binary that isn't there.

## Key constraints baked into the renderer
- EMU -> points: divide by 12700 (914400 EMU = 1 inch = 72 pt). Slide size comes
  from `p:sldSz` in `ppt/presentation.xml`; PDF page = cx/12700 x cy/12700.
- PowerPoint origin is top-left (y down); PDF is bottom-left (y up) -> flip y when
  drawing.
- pdf-lib only embeds PNG and JPG. Other rasters (gif/bmp/tiff/webp) are transcoded
  to PNG via **jimp-compact** (added as a direct api-server dep so esbuild resolves
  it). Vector media (emf/wmf/svg) is skipped — pdf-lib can't embed them.
- Colours: `srgbClr` direct; `schemeClr` resolved through the master's theme1.xml
  clrScheme using the default clrMap aliases (bg1->lt1, tx1->dk1, bg2->lt2, tx2->dk2).
- Background resolution chain: slide `p:bg` -> layout -> master -> white fallback.

## Charts
Charts ARE rendered natively from the cached series data in the chart part
(`c:numCache`/`c:strCache`), not from a chart engine: column/bar, line, area, pie,
doughnut, each with axis baseline, theme-coloured series, title, and legend.
**Why it matters:** the data is read from the *cache* embedded in the chart XML, so
charts whose authoring app omitted the cache will have no values to plot. Tables in
graphicFrames are still not drawn (the next fidelity step).

## Testing tip
Build a minimal PPTX with JSZip in a script placed *inside* `artifacts/api-server`
(Node resolves deps relative to the script file, not cwd), esbuild-bundle pptx.ts
to a temp .mjs, render, then `pdftoppm -png` the output to eyeball it. poppler
(`pdftoppm`) IS available in the container.
