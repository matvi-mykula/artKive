import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MAX_SYNC_DRIFT_SECONDS = 0.45;

function getWrappedDifference(currentTime, targetTime, duration) {
  const directDifference = Math.abs(currentTime - targetTime);
  return Math.min(directDifference, duration - directDifference);
}

export function VignetteViewer({
  getPlaybackPosition,
  isPlaying,
  onClose,
  track,
}) {
  const viewerRef = useRef(null);
  const videoRef = useRef(null);
  const closeButtonRef = useRef(null);
  const wasFullscreenRef = useRef(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    wasFullscreenRef.current = Boolean(document.fullscreenElement);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const controls = [
        ...(viewerRef.current?.querySelectorAll("button:not([disabled])") ?? []),
      ];
      if (!controls.length) {
        event.preventDefault();
        return;
      }

      const firstControl = controls[0];
      const lastControl = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    };
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        wasFullscreenRef.current = true;
      } else if (wasFullscreenRef.current) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [onClose]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    function synchronizeVideo() {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      const targetTime = getPlaybackPosition() % video.duration;
      const drift = getWrappedDifference(
        video.currentTime,
        targetTime,
        video.duration,
      );

      if (drift > MAX_SYNC_DRIFT_SECONDS) {
        video.currentTime = targetTime;
      }

      if (isPlaying) {
        video.play().catch(() => setHasVideoError(true));
      } else {
        video.pause();
      }
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        synchronizeVideo();
      }
    }

    video.addEventListener("loadedmetadata", synchronizeVideo);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    synchronizeVideo();

    const syncInterval = isPlaying
      ? window.setInterval(synchronizeVideo, 2000)
      : null;

    return () => {
      video.pause();
      video.removeEventListener("loadedmetadata", synchronizeVideo);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (syncInterval !== null) {
        window.clearInterval(syncInterval);
      }
    };
  }, [getPlaybackPosition, isPlaying, track.id]);

  function handleClose() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }

  return createPortal(
    <section
      className="vignette-viewer"
      ref={viewerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${track.title} video`}
    >
      <video
        className="vignette-viewer-video"
        ref={videoRef}
        src={track.vignette.src}
        style={{ objectFit: track.vignette.fit }}
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setHasVideoError(true)}
      />
      {hasVideoError ? (
        <p className="vignette-viewer-status">Video unavailable</p>
      ) : null}
      <button
        className="vignette-viewer-close"
        type="button"
        ref={closeButtonRef}
        onClick={handleClose}
        aria-label="Close video"
        title="Close video"
      >
        <span aria-hidden="true">×</span>
      </button>
    </section>,
    document.body,
  );
}
