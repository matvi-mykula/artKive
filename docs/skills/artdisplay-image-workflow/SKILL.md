---
name: artdisplay-image-workflow
description: Use this skill when creating or updating ArtDisplay works, including image ingest, copy changes, sharp optimization, validation, work manifests, and typed tag metadata.
metadata:
  short-description: Integrate ArtDisplay images
---

# ArtDisplay Image Workflow

Use this workflow for any of the following:

- a new work folder has been added under `public/images`
- a new work needs to be created from source images
- an existing work needs updated copy, dimensions, cover, tags, or metadata
- new photos were added to an existing work folder
- a work needs `blurb.txt` or `description.txt`
- images need to be renamed into the house style
- images need to be optimized with `sharp`
- tags or work metadata need to be updated

## Source of truth

- Work metadata lives in `public/images/**/work.json`
- Images live beside the manifest in the same work folder
- Tags and tag types live in `src/tags.js`
- `src/data.js` assembles runtime work data from manifests and image folders
- Card text lives in `blurb.txt`
- Work-page text lives in `description.txt`

## Decide the workflow first

Before editing files, determine whether the requested work already has a
`work.json` manifest.

- If the work does not exist, use the create flow with `npm run ingest:work`.
- If the work already exists, use the update flow with `npm run update:work`.
- If the request cannot be expressed with a script option, make the smallest manual patch and still run validation afterward.
- Do not split this into separate skills. Creation and updates share the same archive rules, validation rules, tag syntax, and metadata conventions.

## Loose intake flow

When the user provides a loose intake bundle, such as a few image paths, a name,
and blurb or description copy, turn that into a complete work record before
running validation.

1. Inspect the supplied images when useful for material, form, process, quality,
   motif, context, or location tags.
2. Read the title, blurb, and description for existing vocabulary matches.
3. Prefer existing tags from `src/tags.js`.
4. Add new tags only when the work needs a meaningful archive term that does not
   already exist.
5. Give every new tag a real `types` array when confidence is high. The ingest
   script can add missing tags as `types: ["uncategorized"]`, but that is a
   temporary fallback, not the preferred final state.
6. Add inline text links where they clarify the archive language:
   - `[[tag-id]]`
   - `[[tag-id|visible phrase]]`
7. Do not write editorial `related` relationships during ordinary ingest unless
   the relation is durable beyond one work. Co-occurrence is computed by the app.

The ingest script can infer existing tags from title, blurb, description, and
inline tag syntax. It cannot semantically infer tags from images by itself; image
interpretation is the agent's responsibility before invoking the script.

## Create flow

Use the ingest script for new works whenever possible:

```bash
npm run ingest:work -- --slug <slug> --title <Title> --year <year> --images <path-a>,<path-b> --cover-index 0 --tags tag-a,tag-b --blurb "<text>" --description "<text>"
```

Important options:

- `--slug`: route slug, for example `light-steppe`
- `--title`: display title, for example `LightSteppe`
- `--year`: archive year
- `--tags`: optional comma-separated tag ids; missing tags are added to `src/tags.js` with `types: ["uncategorized"]`
- `--auto-tags`: merge text-inferred existing tags even when `--tags` is provided
- `--auto-link-text`: wrap matching plain-text terms in `[[tag-id|visible phrase]]`
- `--dimension`: optional dimensions string
- `--order`: optional numeric archive sort order
- `--images`: comma-separated source image paths
- `--cover-index`: zero-based index into `--images`; defaults to `0`
- `--asset-path`: optional nested image path when the folder should not match the slug
- `--cover-position`: optional CSS object-position for archive cover framing
- `--blurb`: archive-card copy
- `--description`: work-page copy

The ingest script creates the work folder, optimizes images to the house naming
pattern, writes text files, writes `work.json`, adds missing tags, and runs
archive validation.

If `--tags` is omitted, the script tries to infer existing tags from `--title`,
`--blurb`, `--description`, and any inline tags already present in the copy. If
no tags can be inferred, provide `--tags` explicitly.

## Update flow

Use the update script for existing works whenever possible:

```bash
npm run update:work -- --slug <slug> --tags tag-a,tag-b --dimension "<dimensions>" --blurb "<text>" --description "<text>"
```

Useful options:

- `--slug`: required existing work slug
- `--title`: update display title
- `--year`: update year
- `--order`: update archive sort order
- `--tags`: replace the metadata tag list; missing tags are added to `src/tags.js` with `types: ["uncategorized"]`
- `--dimension`: update dimensions
- `--cover`: update cover filename
- `--cover-position`: update archive cover framing
- `--blurb`: replace `blurb.txt`
- `--description`: replace `description.txt`

The work folder path is the asset path. To change it, move the folder and then
validate the archive.

## Manifest rules

One work gets one folder and one manifest:

```txt
public/images/night-window/work.json
public/images/night-window/cover.jpg
public/images/night-window/01.jpg
public/images/night-window/blurb.txt
public/images/night-window/description.txt
```

Nested category folders are allowed, for example:

```txt
public/images/grown-tapestry/root-nightlight/work.json
```

Example manifest:

```json
{
  "slug": "night-window",
  "title": "NightWindow",
  "year": "2026",
  "order": 90,
  "dimension": "10 x 10 x 10 cm",
  "cover": "cover.jpg",
  "coverPosition": "center center",
  "tags": ["lamp", "wood", "glow"]
}
```

Required fields:

- `slug`
- `title`
- `year`
- `tags`

Optional fields:

- `order`
- `dimension`
- `cover`
- `coverPosition`
- `blurb`
- `description`

## Tag rules

Tags are rich records in `src/tags.js`.

Required tag fields:

- `id`
- `label`
- `types`

`types` is always an array, even when a tag only has one type.

Optional tag fields:

- `description`
- `aliases`
- `related`

Every type in `types` must exist in `tagTypes`. Every tag id used by work
metadata or text must exist in `tags`.

## Text rules

- `blurb.txt` is short archive-card text
- `description.txt` is longer work-page text
- Tagged text syntax:
  - `[[tag-id]]`
  - `[[tag-id|visible phrase]]`
- Every tag id used in text must exist in `src/tags.js`

## Image optimization workflow

Do not use `sips` on live repo assets.

Use the standalone optimization helper when adding or replacing individual
images outside the ingest script:

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
- The file named by `cover` in `work.json` is used as the archive cover and first detail image.
- `blurb` and `description` can be set to `null` in `work.json` if intentionally omitted.
