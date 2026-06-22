---
name: PDFShuffl article library
description: Conventions and gotchas for the hand-authored flagship article library in artifacts/pdfshuffle.
---

# PDFShuffl flagship article library

The library lives in `artifacts/pdfshuffle/src/data/articles/`. Each of the 3 tool-group
categories has a base file plus an overflow `*-2.js` file (e.g. `office-to-pdf.js` +
`office-to-pdf-2.js`); all are imported and concatenated in `index.js`. Add new overflow
files (`*-3.js`, etc.) and wire them into `index.js` as the library scales toward ~150.

## Word-count requirement (non-obvious)
**Always measure article length with the `articleWordCount(article)` helper from `index.js`,
never with a `JSON.stringify(sections)`-based proxy.** A JSON-string word split badly
undercounts (it scored genuine ~1500-word articles at ~850), which can fool you into thinking
articles are far shorter than they are.
**Why:** the user's explicit bar is 1500–2500 words per article; an inaccurate measure led to
mis-judging the floor.
**How to apply:** the flagship floor is 1500 words. Verify with `articleWordCount` before
considering authoring done.

## Subagent authoring batches (non-obvious)
Spawning a subagent to author ~9–10 full long-form articles in one file can hit a Temporal
`StartToClose` child-workflow timeout — but the file writes usually complete anyway, so the
"failed/timeout" status is misleading. Always verify the actual files on disk rather than
trusting the timeout status. Expansion tasks (adding sections to existing articles) are lighter
and tend to finish cleanly. Prefer one subagent per file to avoid write conflicts.

## relatedTools must be real tools
`relatedTools` strings in each article must exactly match a tool `name` in `allTools`/`toolGroups`
in `App.jsx` (drives `/tools/:slug` links). "Create PDF" and "Format PDF" are NOT in `allTools`
(they're knowledge-page titles, not tools) — do not use them as relatedTools.
