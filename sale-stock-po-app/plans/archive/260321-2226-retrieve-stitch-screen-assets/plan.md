---
title: "Retrieve Stitch screen assets"
description: "Pull hosted image assets and exported code for one Stitch screen into repo-local artifact paths."
status: pending
priority: P2
effort: 30m
branch: master
tags: [planning, stitch, assets]
created: 2026-03-21
---

# Stitch Screen Retrieval Plan

Target: Stitch project `9285941881376712224`, screen `6e0957d35ef14cc5a81f635b0f35a416`

## Scope
- Retrieval only. No application code edits.
- Save raw outputs in repo-local artifact paths first, then review before promotion into runtime paths.

## Likely Output Paths
- `plans/260321-2226-retrieve-stitch-screen-assets/artifacts/stitch-screen-6e0957d35ef14cc5a81f635b0f35a416/screen.tsx`
- `plans/260321-2226-retrieve-stitch-screen-assets/artifacts/stitch-screen-6e0957d35ef14cc5a81f635b0f35a416/images/*`
- `plans/260321-2226-retrieve-stitch-screen-assets/artifacts/stitch-screen-6e0957d35ef14cc5a81f635b0f35a416/metadata.json`
- Optional later promotion after review: `public/stitch/...` and `components/stitch/...`

## TODO
- [ ] Use Stitch screen retrieval tooling for project `9285941881376712224` / screen `6e0957d35ef14cc5a81f635b0f35a416`
- [ ] Export or capture the screen code into `screen.tsx`
- [ ] Download all hosted image assets referenced by the screen into `images/`
- [ ] Record source URLs, file names, and any missing assets in `metadata.json`
- [ ] Check whether exported code contains remote URLs that must be localized before app integration

## Verification
- Confirm `screen.tsx` exists and is non-empty
- Confirm every referenced hosted image was downloaded or explicitly listed as missing
- Confirm saved file names are stable and readable
- Confirm no files outside `plans/.../artifacts/` were modified during retrieval
