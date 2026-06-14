Image workflow for this project:

Prefer the repo scripts for repeatable updates:

- `npm run ingest:work` creates a new work folder, optimizes images, writes copy, writes `work.json`, adds missing typed tags, and validates the archive.
- `npm run update:work` updates an existing work manifest and copy, adds missing typed tags, and validates the archive.
- `npm run validate:archive` checks the archive without changing files.

For loose intake, provide images plus a title/name and copy. `ingest:work` can
infer existing tags from `--title`, `--blurb`, `--description`, and inline tag
syntax when `--tags` is omitted. Use `--auto-tags` to merge inferred text tags
with explicit tags, and `--auto-link-text` to wrap matching plain-text terms as
inline tag links. Image-derived tags still need to be chosen by the person or
agent reviewing the photos.

Manual workflow:

1. Create one folder per work inside `public/images/`.
2. Use the work slug as the folder name unless a nested grouping is useful.
3. Add a `work.json` manifest in the work folder.
4. Put a cover image and any additional images in that folder.
5. Add `blurb.txt` for archive-card text and `description.txt` for the work page text.

Recommended structure:

```txt
public/images/night-window/work.json
public/images/night-window/cover.jpg
public/images/night-window/01.jpg
public/images/night-window/02.jpg
public/images/field-notes/work.json
public/images/field-notes/cover.jpg
```

Manifest example:

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

Required manifest fields:

- `slug`
- `title`
- `year`
- `tags`

Optional manifest fields:

- `order`
- `dimension`
- `cover`
- `coverPosition`
- `blurb`
- `description`

Text files:

- store them beside the images as `blurb.txt` and `description.txt`
- use `[[tag]]` for a linked tag word
- use `[[tag|visible phrase]]` when the linked phrase should differ from the tag slug

Example:

```txt
This [[lamp]] is built from cut [[stone]].
```

Image discovery:

- `src/data.js` assembles work data from `work.json` files and image folders.
- all image files in a work folder are included automatically on the work page.
- the file named by `cover` in `work.json` is used as the card cover and shown first in the image sequence.
- additional images are sorted automatically by filename.
- `blurb` and `description` can be set to `null` in `work.json` when a work should appear without one or both text files.

Tag rules:

- tags are rich records in `src/tags.js`
- each tag must have `id`, `label`, and `types`
- `types` is always an array, even when a tag only has one type
- missing tags added by scripts use `types: ["uncategorized"]` until classified
- optional tag fields are `description`, `aliases`, and `related`

Optimization workflow:

- create a backup outside the repo before replacing a live asset
- use the repo helper script for non-destructive previews first:
  - `npm run optimize:image -- --input public/images/<work>/cover.jpg --output /tmp/<work>-cover-preview.jpg`
- if the preview looks good, move it into place manually
- avoid using `sips` quality conversion on live repo assets for this project

Recommended filename rules:

- lowercase only
- no spaces
- use jpg for photos unless png is necessary
- keep the longest edge around 1600-2200px
