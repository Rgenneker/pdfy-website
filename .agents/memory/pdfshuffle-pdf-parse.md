---
name: PDFShuffl pdf-parse v2 + esbuild bundling
description: Two gotchas for PDF parsing in the api-server — the pdf-parse v2 API and why it must be externalized from the esbuild bundle.
---

# pdf-parse v2 API + esbuild externalization

The api-server (`artifacts/api-server`) depends on **pdf-parse v2**, whose API differs from v1.

## v2 has no default export
`pdf-parse` v2 exports a `PDFParse` **class**, not a default callable. The correct usage is:
```ts
const { PDFParse } = await import("pdf-parse");
const parser = new PDFParse({ data: new Uint8Array(buffer) });
const { text } = await parser.getText(); // also .pages, .total
```
**Why:** several older routes still use `(await import("pdf-parse")).default` — `default` is `undefined`
in v2, so those handlers 500 at runtime ("pdfParse is not a function"). This is a pre-existing bug in
the pdf-to-txt / pdf-to-word routes, independent of any single task.

## pdf-parse must be externalized from the esbuild bundle
Add `pdf-parse` (and `pdfjs-dist`) to the `external` array in `artifacts/api-server/build.mjs`.
**Why:** pdf-parse is built on pdfjs-dist, which loads workers/fonts dynamically and breaks when bundled
by esbuild — the route 500s even with the correct v2 API. Externalizing makes it load from node_modules
at runtime, where it works.
**How to apply:** any route that imports pdf-parse needs both the v2 API *and* the externalization, or it
will fail at runtime (the dev workflow rebuilds via esbuild on every restart).

## Debugging note
The server's pino logger output does NOT appear in the captured workflow log files (only build output
shows). To see real runtime errors, replicate the route logic in a standalone `.mjs` run from inside
`artifacts/api-server` (so node_modules resolves), rather than relying on log capture.
