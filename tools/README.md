# Video processing tool

`process_ink_motion.py` creates a portrait-format, ink-like video with muted
color, dark edge outlines, and persistent yellow motion trails around bright
moving areas. It requires Python, OpenCV (`cv2`), and NumPy.

This is the script used to create the visual source for the
`CCCallandresponse` vignette. On July 30, 2026, it processed the stabilized
`IMG_0932` clip at 720 pixels wide with the heavier trail settings preserved in
this copy:

```powershell
python tools/process_ink_motion.py `
  "C:\path\to\IMG_0932-stabilized.mp4" `
  "C:\path\to\output-raw.mp4" `
  --seconds 999 `
  --width 720
```

The script writes an `mp4v` intermediate. The selected render was subsequently
encoded to H.264 with FFmpeg, optimized for the web, and added to ArtKive as
`public/vignettes/cc-call-and-response-vignette.mp4`.
