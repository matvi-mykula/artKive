# ArtDisplay Notes

Use the `artdisplay-image-workflow` skill when:

- integrating new artwork images
- renaming image files into the site convention
- optimizing images with `sharp`
- adding or updating `blurb.txt` or `description.txt`
- updating work metadata in `public/images/**/work.json`
- updating typed tags in `src/tags.js`

The canonical copy of this skill lives in this repo at
`docs/skills/artdisplay-image-workflow/SKILL.md`. If the named skill is not
installed in the local Codex environment, read and follow that repo copy before
doing image-workflow tasks.

## Windows / sandbox command notes

- Use `npm.cmd` instead of `npm` from PowerShell; `npm.ps1` may be blocked by
  the system execution policy.
- Vite/esbuild commands can fail inside the managed sandbox with errors like
  `Cannot read directory "../../..": Access is denied` or inability to resolve
  `vite.config.js`. If an important `npm.cmd run build` or dev-server command
  fails this way, rerun it with escalation.
- `Start-Process` can fail in this environment with duplicate `Path` / `PATH`
  environment-key errors. Prefer a simpler launcher or request escalation when a
  persistent dev server is needed.

For other development work in this repo, there are no additional project-specific agent instructions here.
