---
name: artdisplay-image-workflow
description: Use this skill when integrating new artwork images into the ArtDisplay site, including file placement, naming, optimization with sharp, and updating work/tag metadata.
metadata:
  short-description: Integrate ArtDisplay images
---

# ArtDisplay Image Workflow

Use this skill when new artwork images need to be integrated into the ArtDisplay site.

## When to use

Use this workflow for any of the following:

- a new work folder has been added under `public/images`
- new photos were added to an existing work folder
- a work needs `blurb.txt` or `description.txt`
- images need to be renamed into the house style
- images need to be optimized with `sharp`
- tags or work metadata need to be updated in `src/data.js` or `src/tags.js`

## Source of truth

- Images live under `public/images/...`
- Works are defined in `src/data.js`
- Tags are defined in `src/tags.js`
- Card text lives in `blurb.txt`
- Work-page text lives in `description.txt`

## Folder and naming rules

- One work gets one folder
- Nested category folders are allowed, for example `public/images/grown-tapestry/root-nightlight`
- In `src/data.js`, set:
  - `slug`
  - `title`
  - `tags`
  - `assetPath` when nested
  - `cover`
- Preferred filenames:
  - `cover.jpg` or `cover.png`
  - `01.jpg`, `02.jpg`, `03.jpg`

## Text rules

- `blurb.txt` is short archive-card text
- `description.txt` is longer work-page text
- Tagged text syntax:
  - `[[tag-id]]`
  - `[[tag-id|visible phrase]]`
- Every tag id used in text must exist in `src/tags.js`

## Image optimization workflow

Do not use `sips` on live repo assets.

Use the repo helper:

```bash
npm run optimize:image -- --input public/images/<work>/cover.jpg --output /tmp/<work>-cover-preview.jpg
```

Process:

1. Put images in the correct folder.
2. Normalize filenames.
3. Create a preview output in `/tmp` with the helper script.
4. Visually verify the preview before replacing the live file.
5. Back up the original outside the repo, typically under `/tmp/<work>-originals`.
6. Replace the live file only after approval.

Default optimization settings:

- max dimension: `2200`
- quality: `80`

## Integration checklist

1. Place images in the correct folder.
2. Rename files into the expected cover/numbered scheme.
3. Optimize images with `sharp`.
4. Add or update `blurb.txt`.
5. Add or update `description.txt`.
6. Add or update the work entry in `src/data.js`.
7. Add new tags to `src/tags.js` if needed.
8. Verify the work appears in the archive and on its work page.

## Important behavior

- All image files in a work folder are discovered automatically.
- The file named by `cover` in `src/data.js` is used as the archive cover and first detail image.
- `blurb` and `description` can be set to `null` in `src/data.js` if intentionally omitted.
