import { useEffect, useRef, useState } from "react";
import { navigate } from "../lib/router";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function TransportIcon({ type }) {
  if (type === "previous") {
    return (
      <svg className="audio-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 5v14" />
        <path d="m19 6-10 6 10 6V6Z" />
      </svg>
    );
  }

  if (type === "pause") {
    return (
      <svg className="audio-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9 5v14" />
        <path d="M15 5v14" />
      </svg>
    );
  }

  if (type === "next") {
    return (
      <svg className="audio-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m5 6 10 6-10 6V6Z" />
        <path d="M18 5v14" />
      </svg>
    );
  }

  return (
    <svg className="audio-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m8 5 11 7-11 7V5Z" />
    </svg>
  );
}

function VignetteIcon() {
  return (
    <span className="audio-vignette-icon" aria-hidden="true">
      <span>▶</span>
    </span>
  );
}

export function AudioPlayer({ currentPath, player, tracks }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const {
    currentIndex,
    currentTrack,
    isError,
    isPlaying,
    selectTrack,
    skipTrack,
    togglePlayback,
  } = player;

  useEffect(() => {
    if (!isChooserOpen) {
      return undefined;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsChooserOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = [
        ...(modalRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []),
      ];
      if (!focusableElements.length) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      openerRef.current?.focus();
    };
  }, [isChooserOpen]);

  async function handleTrackSelect(index) {
    setIsChooserOpen(false);
    await selectTrack(index);
    if (currentPath.startsWith("/songs/")) {
      navigate("/");
    }
  }

  function handleSkip(offset) {
    skipTrack(offset);
    if (currentPath.startsWith("/songs/")) {
      navigate("/");
    }
  }

  function handleVignetteSelect(index) {
    const track = tracks[index];
    if (!track?.vignette) {
      return;
    }

    setIsChooserOpen(false);
    void selectTrack(index);
    navigate(`/songs/${track.id}`);
  }

  return (
    <div className={`audio-player${isPlaying ? " is-playing" : ""}${isError ? " is-error" : ""}`}>
      <button
        className="audio-title"
        type="button"
        ref={openerRef}
        onClick={() => setIsChooserOpen(true)}
        disabled={!currentTrack}
        aria-haspopup="dialog"
        aria-expanded={isChooserOpen}
      >
        {currentTrack ? currentTrack.title : "Audio unavailable"}
      </button>
      <div className="audio-controls" role="group" aria-label="Audio controls">
        <button
          className="audio-skip"
          type="button"
          onClick={() => handleSkip(-1)}
          aria-label="Previous song"
          disabled={!currentTrack}
        >
          <TransportIcon type="previous" />
        </button>
        <button
          className="audio-toggle"
          type="button"
          onClick={togglePlayback}
          aria-label={
            currentTrack
              ? isPlaying
                ? `Pause ${currentTrack.title}`
                : `Play ${currentTrack.title}`
              : "Audio unavailable"
          }
          disabled={!currentTrack}
        >
          <TransportIcon type={isPlaying ? "pause" : "play"} />
        </button>
        <button
          className="audio-skip"
          type="button"
          onClick={() => handleSkip(1)}
          aria-label="Next song"
          disabled={!currentTrack}
        >
          <TransportIcon type="next" />
        </button>
      </div>

      {isChooserOpen ? (
        <div
          className="audio-modal-backdrop"
          role="presentation"
          onClick={() => setIsChooserOpen(false)}
        >
          <section
            className="audio-modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Choose song"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="audio-modal-header">
              <h2>Choose Song</h2>
              <button
                className="audio-modal-close"
                type="button"
                ref={closeButtonRef}
                onClick={() => setIsChooserOpen(false)}
                aria-label="Close song chooser"
              >
                Close
              </button>
            </div>
            <div className="audio-track-list">
              {tracks.map((track, index) => {
                const isCurrent = index === currentIndex;
                const isCurrentPlaying = isCurrent && isPlaying;

                return (
                  <div
                    className="audio-track-row"
                    key={track.id}
                  >
                    <button
                      className={`audio-track-option${isCurrent ? " is-current" : ""}${isCurrentPlaying ? " is-playing" : ""}`}
                      type="button"
                      onClick={() => handleTrackSelect(index)}
                    >
                      <span>{track.title}</span>
                      {isCurrentPlaying ? <span>Playing</span> : null}
                    </button>
                    {track.vignette ? (
                      <button
                        className="audio-track-vignette"
                        type="button"
                        onClick={() => handleVignetteSelect(index)}
                        aria-label={`Open ${track.title} video page`}
                        title={`Open ${track.title} video page`}
                      >
                        <VignetteIcon />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
