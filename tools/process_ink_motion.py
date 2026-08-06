from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np


def fit_portrait(frame: np.ndarray, width: int) -> np.ndarray:
    h, w = frame.shape[:2]
    if w > h:
        frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        h, w = frame.shape[:2]
    height = int(round(h * (width / w)))
    return cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)


def grade(frame: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 0.78, 0, 255)
    hsv[..., 2] = np.clip((hsv[..., 2] - 14) * 0.96, 0, 255)
    muted = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    cool_overlay = np.full_like(muted, (28, 24, 16))
    return cv2.addWeighted(muted, 0.88, cool_overlay, 0.12, 0)


def render(input_path: Path, output_path: Path, seconds: float, width: int) -> None:
    cap = cv2.VideoCapture(str(input_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open input video: {input_path}")

    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30
    fps = min(30.0, src_fps)
    max_frames = int(seconds * src_fps)

    ok, first = cap.read()
    if not ok:
        raise RuntimeError("Input video has no readable frames")

    first = fit_portrait(first, width)
    h, w = first.shape[:2]
    writer = cv2.VideoWriter(
        str(output_path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (w, h),
    )
    if not writer.isOpened():
        raise RuntimeError(f"Could not open output video: {output_path}")

    prev_gray: np.ndarray | None = None
    trail: np.ndarray | None = None
    frame_index = 0
    sample_every = max(1, round(src_fps / fps))
    current = first

    while frame_index < max_frames:
        if frame_index % sample_every == 0:
            frame = fit_portrait(current, width)
            base = grade(frame)
            gray = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY)
            smooth = cv2.GaussianBlur(gray, (5, 5), 0)

            edges = cv2.Canny(smooth, 70, 155)
            edges = cv2.dilate(edges, np.ones((2, 2), np.uint8), iterations=1)
            edge_alpha = (edges.astype(np.float32) / 255.0) * 0.38
            ink = np.zeros_like(base)
            composited = (base * (1.0 - edge_alpha[..., None]) + ink * edge_alpha[..., None])

            if prev_gray is not None:
                diff = cv2.absdiff(gray, prev_gray)
                diff = cv2.GaussianBlur(diff, (0, 0), 2.0)
                bright = cv2.threshold(gray, 178, 255, cv2.THRESH_BINARY)[1]
                motion = cv2.bitwise_and(diff, bright)
                motion = cv2.GaussianBlur(motion, (0, 0), 1.1)
                motion = cv2.normalize(motion, None, 0, 255, cv2.NORM_MINMAX)
                if trail is None:
                    trail = motion.astype(np.float32)
                else:
                    trail = np.maximum(trail * 0.975, motion.astype(np.float32))

                glow = cv2.GaussianBlur(trail, (0, 0), 8.0)
                trail_mask = np.clip((trail * 3.25 + glow * 2.1), 0, 255).astype(np.uint8)
                motion_color = np.zeros_like(base)
                motion_color[..., 0] = np.clip(trail_mask * 0.22, 0, 255)
                motion_color[..., 1] = np.clip(trail_mask * 0.92, 0, 255)
                motion_color[..., 2] = trail_mask
                motion_alpha = np.clip((trail_mask.astype(np.float32) / 255.0) * 0.92, 0, 0.92)
                composited = (
                    composited * (1.0 - motion_alpha[..., None])
                    + motion_color * motion_alpha[..., None]
                )

            prev_gray = gray
            writer.write(np.clip(composited, 0, 255).astype(np.uint8))

        ok, current = cap.read()
        if not ok:
            break
        frame_index += 1

    cap.release()
    writer.release()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--seconds", type=float, default=8.0)
    parser.add_argument("--width", type=int, default=720)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    render(args.input, args.output, args.seconds, args.width)


if __name__ == "__main__":
    main()
