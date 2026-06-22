---
name: PDFShuffl navigation model and SEO source-of-truth
description: How to add a top-level page in the hybrid nav, and which public SEO files are generated vs hand-edited.
---

# Hybrid navigation in artifacts/pdfshuffle/src/App.jsx
The app uses BOTH a legacy state-based nav (`activePage`) AND react-router at the same time.
Adding a new top-level page requires edits in FOUR places, or it will break in at least one entry path:
1. The `pages` array (top nav + footer both map over it).
2. The `paths` map inside the nav button click handler (maps page label to URL).
3. A branch in the `page` useMemo: `if (activePage === "X") return <XPage/>;` (covers footer clicks and the `*` catch-all route).
4. An explicit `<Route path="/x" element={<XPage/>}/>` inside `<Routes>` (covers direct URL load / refresh).

**Why:** footer buttons only call `setActivePage` (no navigate), while the top nav navigates by URL. On an explicit route the URL wins regardless of `activePage`. Missing any of the four causes a dead link or blank page from one path.

# SEO files: generated vs hand-edited
`scripts/generate-seo.mjs` (run via `pnpm --filter @workspace/pdfshuffle run generate:seo`) is the source of truth for:
`public/robots.txt`, `public/llms.txt`, `public/api/tools.json`, `public/sitemap-*.xml`, `public/sitemap-index.xml`.
Do NOT hand-edit those, they get overwritten. Edit the generator instead.
`public/sitemap.xml` (the small landing sitemap) is the ONE hand-maintained sitemap, not generated.
Total indexed pages = 300k PDF keyword pages + 250k geo pages = 550k (geo capped by GEO_MAX in src/data/geo-config.js).
