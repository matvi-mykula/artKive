---
name: artdisplay-image-workflow
description: Use this skill when creating or updating ArtDisplay works, including image ingest, copy changes, sharp optimization, validation, and work/tag metadata updates.
metadata:
  short-description: Integrate ArtDisplay images
---

# ArtDisplay Image Workflow

Use this skill when artwork records need to be created, updated, or validated in the ArtDisplay site.

## When to use

Use this workflow for any of the following:

- a new work folder has been added under `public/images`
- a new work needs to be created from source images
- an existing work needs updated copy, dimensions, cover, tags, or metadata
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

## Decide the workflow first

Before editing files, determine whether the requested work already exists in `src/data.js`.

- If the work does not exist, use the create flow with `npm run ingest:work`.
- If the work already exists, use the update flow with `npm run update:work`.
- If the request cannot be expressed with a script option, make the smallest manual patch and still run validation afterward.
- Do not split this into separate skills. Creation and updates share the same archive rules, validation rules, tag syntax, and metadata conventions.

## Create flow

Use the ingest script for new works whenever possible:

```bash
npm run ingest:work -- --slug <slug> --title <Title> --year <year> --tags tag-a,tag-b --dimension "<dimensions>" --images <path-a>,<path-b> --cover-index 0 --blurb "<text>" --description "<text>"
```

Important options:

- `--slug`: folder and route slug, for example `light-steppe`
- `--title`: display title, for example `LightSteppe`
- `--year`: archive year
- `--tags`: comma-separated tag ids; missing tags are added to `src/tags.js`
- `--dimension`: optional dimensions string
- `--images`: comma-separated source image paths
- `--cover-index`: zero-based index into `--images`; defaults to `0`
- `--asset-path`: optional nested image path when the folder should not match the slug
- `--cover-position`: optional CSS object-position for archive cover framing
- `--blurb`: archive-card copy
- `--description`: work-page copy

The ingest script creates the work folder, optimizes images to the house naming pattern, writes text files, updates metadata, adds missing tags, and runs archive validation.

## Update flow

Use the update script for existing works whenever possible:

```bash
npm run update:work -- --slug <slug> --tags tag-a,tag-b --dimension "<dimensions>" --blurb "<text>" --description "<text>"
```

Useful options:

- `--slug`: required existing work slug
- `--title`: update display title
- `--year`: update year
- `--tags`: replace the metadata tag list; missing tags are added to `src/tags.js`
- `--dimension`: update dimensions
- `--cover`: update cover filename
- `--cover-position`: update archive cover framing
- `--asset-path`: update nested image path
- `--blurb`: replace `blurb.txt`
- `--description`: replace `description.txt`

The update script updates metadata and copy, adds missing tags, and runs archive validation.

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

Use the standalone optimization helper when adding or replacing individual images outside the ingest script:

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

1. Determine whether this is a create flow or update flow.
2. Use `npm run ingest:work` for new works when possible.
3. Use `npm run update:work` for existing works when possible.
4. Only patch files manually when the scripts cannot express the requested edit.
5. Run `npm run validate:archive`.
6. Run `npm run build`.
7. Verify the work appears in the archive and on its work page.

## Important behavior

- All image files in a work folder are discovered automatically.
- The file named by `cover` in `src/data.js` is used as the archive cover and first detail image.
- `blurb` and `description` can be set to `null` in `src/data.js` if intentionally omitted.
