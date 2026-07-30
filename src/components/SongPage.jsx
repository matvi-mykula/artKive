import { useEffect, useRef, useState } from "react";
import { navigate } from "../lib/router";

const MAX_SYNC_DRIFT_SECONDS = 0.45;

function getWrappedDifference(currentTime, targetTime, duration) {
  const directDifference = Math.abs(currentTime - targetTime);
  return Math.min(directDifference, duration - directDifference);
}

export function SongPage({ player, track }) {
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      const fullscreenElement =
        document.fullscreenElement ?? document.webkitFullscreenElement;
      setIsFullscreen(fullscreenElement === stageRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    function synchronizeVideo() {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      const targetTime = player.getPlaybackPosition() % video.duration;
      const drift = getWrappedDifference(
        video.currentTime,
        targetTime,
        video.duration,
      );

      if (drift > MAX_SYNC_DRIFT_SECONDS) {
        video.currentTime = targetTime;
      }

      if (player.isPlaying && player.currentTrack?.id === track.id) {
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

    const syncInterval =
      player.isPlaying && player.currentTrack?.id === track.id
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
  }, [
    player.currentTrack?.id,
    player.getPlaybackPosition,
    player.isPlaying,
    track.id,
  ]);

  async function handleFullscreenToggle() {
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!stage || !video) {
      return;
    }

    const fullscreenElement =
      document.fullscreenElement ?? document.webkitFullscreenElement;

    try {
      if (fullscreenElement) {
        const exitFullscreen =
          document.exitFullscreen ?? document.webkitExitFullscreen;
        await exitFullscreen?.call(document);
        return;
      }

      const requestFullscreen =
        stage.requestFullscreen ?? stage.webkitRequestFullscreen;
      if (requestFullscreen) {
        await requestFullscreen.call(stage);
        return;
      }

      video.webkitEnterFullscreen?.();
    } catch {
      // The page presentation remains available when fullscreen is denied.
    }
  }

  return (
    <main className="page-shell song-page">
      <section className="detail-header">
        <button
          className="back-link"
          type="button"
          onClick={() => navigate("/")}
        >
          Back to archive
        </button>
        <p className="eyebrow">Song vignette</p>
        <h1>{track.title}</h1>
      </section>

      <section
        className="song-vignette-stage"
        ref={stageRef}
        aria-label={`${track.title} video`}
      >
        <video
          className="song-vignette-video"
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
          <p className="song-vignette-status">Video unavailable</p>
        ) : null}
        <button
          className={`song-vignette-fullscreen${isFullscreen ? " is-active" : ""}`}
          type="button"
          onClick={handleFullscreenToggle}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <span aria-hidden="true">×</span>
          ) : (
            "Full screen"
          )}
        </button>
      </section>
    </main>
  );
}
