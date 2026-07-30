import { useEffect, useRef, useState } from "react";
import { navigate } from "../lib/router";

const MAX_SYNC_DRIFT_SECONDS = 0.45;
const VIEW_INLINE = "inline";
const VIEW_FULLSCREEN = "fullscreen";
const VIEW_IMMERSIVE = "immersive";

function getWrappedDifference(currentTime, targetTime, duration) {
  const directDifference = Math.abs(currentTime - targetTime);
  return Math.min(directDifference, duration - directDifference);
}

function formatTime(time) {
  if (!Number.isFinite(time) || time < 0) {
    return "0:00";
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SongPage({ player, track }) {
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_INLINE);
  const isExpanded = viewMode !== VIEW_INLINE;
  const showPlayButton =
    !isExpanded &&
    !player.isPlaying &&
    player.currentTrack?.id === track.id;

  useEffect(() => {
    function handleFullscreenChange() {
      const fullscreenElement =
        document.fullscreenElement ?? document.webkitFullscreenElement;
      setViewMode((currentMode) => {
        if (fullscreenElement === stageRef.current) {
          return VIEW_FULLSCREEN;
        }

        return currentMode === VIEW_FULLSCREEN ? VIEW_INLINE : currentMode;
      });
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
    if (viewMode !== VIEW_IMMERSIVE) {
      return undefined;
    }

    const stage = stageRef.current;
    const viewport = window.visualViewport;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function updateImmersiveHeight() {
      const height = viewport?.height ?? window.innerHeight;
      stage?.style.setProperty("--song-immersive-height", `${height}px`);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setViewMode(VIEW_INLINE);
      }
    }

    updateImmersiveHeight();
    viewport?.addEventListener("resize", updateImmersiveHeight);
    window.addEventListener("resize", updateImmersiveHeight);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      stage?.style.removeProperty("--song-immersive-height");
      viewport?.removeEventListener("resize", updateImmersiveHeight);
      window.removeEventListener("resize", updateImmersiveHeight);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewMode]);

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
    if (!stage) {
      return;
    }

    if (viewMode === VIEW_IMMERSIVE) {
      setViewMode(VIEW_INLINE);
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
        setViewMode(VIEW_FULLSCREEN);
        return;
      }

      setViewMode(VIEW_IMMERSIVE);
    } catch {
      setViewMode(VIEW_IMMERSIVE);
    }
  }

  function handleSeek(event) {
    const targetTime = Number(event.target.value);
    player.seekTo(targetTime);

    const video = videoRef.current;
    if (
      video &&
      Number.isFinite(video.duration) &&
      video.duration > 0
    ) {
      video.currentTime = targetTime % video.duration;
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
        className={`song-vignette-stage${viewMode === VIEW_IMMERSIVE ? " is-immersive" : ""}`}
        ref={stageRef}
        aria-label={`${track.title} video`}
      >
        <div className="song-vignette-media">
          <video
            className="song-vignette-video"
            ref={videoRef}
            src={track.vignette.src}
            style={{
              objectFit:
                viewMode === VIEW_IMMERSIVE ? "cover" : track.vignette.fit,
            }}
            muted
            loop
            playsInline
            preload="auto"
            onClick={() => void player.togglePlayback()}
            onError={() => setHasVideoError(true)}
          />
          {hasVideoError ? (
            <p className="song-vignette-status">Video unavailable</p>
          ) : null}
          {showPlayButton ? (
            <button
              className="song-vignette-play"
              type="button"
              onClick={() => void player.togglePlayback()}
              aria-label={`Play ${track.title}`}
              title={`Play ${track.title}`}
            >
              <span aria-hidden="true">▶</span>
            </button>
          ) : null}
        </div>
        {isExpanded ? (
          <button
            className="song-vignette-fullscreen is-active"
            type="button"
            onClick={handleFullscreenToggle}
            aria-label="Exit fullscreen"
            title="Exit fullscreen"
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : (
          <div
            className="song-vignette-controls"
            role="group"
            aria-label="Song controls"
          >
            <button
              className="song-vignette-control-toggle"
              type="button"
              onClick={() => void player.togglePlayback()}
              aria-label={
                player.isPlaying
                  ? `Pause ${track.title}`
                  : `Play ${track.title}`
              }
              title={player.isPlaying ? "Pause" : "Play"}
            >
              <span
                className={`song-vignette-control-icon ${player.isPlaying ? "is-pause" : "is-play"}`}
                aria-hidden="true"
              />
            </button>
            <span className="song-vignette-time">
              {formatTime(player.playback.position)}
            </span>
            <input
              className="song-vignette-progress"
              type="range"
              min="0"
              max={player.playback.duration || 0}
              step="0.05"
              value={Math.min(
                player.playback.position,
                player.playback.duration || 0,
              )}
              onChange={handleSeek}
              disabled={!player.playback.duration}
              aria-label={`${track.title} playback position`}
            />
            <span className="song-vignette-time">
              {formatTime(player.playback.duration)}
            </span>
            <button
              className="song-vignette-fullscreen"
              type="button"
              onClick={handleFullscreenToggle}
              aria-label="Enter fullscreen"
              title="Enter fullscreen"
            >
              <span
                className="song-vignette-fullscreen-icon"
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
