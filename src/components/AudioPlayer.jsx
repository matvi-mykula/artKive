import { useEffect, useRef, useState } from "react";

function getWrappedIndex(index, offset, length) {
  if (!length) {
    return 0;
  }

  return (index + offset + length) % length;
}

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

export function AudioPlayer({ tracks }) {
  const audioRef = useRef(null);
  const errorSkipCountRef = useRef(0);
  const shouldKeepPlayingRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [status, setStatus] = useState(tracks.length ? "idle" : "error");

  const currentTrack = tracks[currentIndex] ?? null;

  useEffect(() => {
    if (!tracks.length) {
      setStatus("error");
      return undefined;
    }

    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const handleLoadStart = () =>
      setStatus((current) => (current === "playing" ? current : "loading"));
    const handlePlay = () => {
      errorSkipCountRef.current = 0;
      setStatus("playing");
    };
    const handlePause = () => {
      if (!shouldKeepPlayingRef.current) {
        setStatus("paused");
      }
    };
    const handleError = () => {
      if (
        shouldKeepPlayingRef.current &&
        tracks.length > 1 &&
        errorSkipCountRef.current < tracks.length - 1
      ) {
        errorSkipCountRef.current += 1;
        setCurrentIndex((index) => getWrappedIndex(index, 1, tracks.length));
        return;
      }

      errorSkipCountRef.current = 0;
      shouldKeepPlayingRef.current = false;
      setStatus("error");
    };
    const handleEnded = () => {
      if (!shouldKeepPlayingRef.current) {
        setStatus("paused");
        return;
      }

      if (tracks.length === 1) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          shouldKeepPlayingRef.current = false;
          setStatus("error");
        });
        return;
      }

      setCurrentIndex((index) => getWrappedIndex(index, 1, tracks.length));
    };

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, [tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) {
      return;
    }

    audio.src = currentTrack.src;
    audio.load();

    if (!shouldKeepPlayingRef.current) {
      errorSkipCountRef.current = 0;
      setStatus((current) => (current === "error" ? current : "idle"));
      return;
    }

    setStatus("loading");
    audio.play().catch(() => {
      shouldKeepPlayingRef.current = false;
      setStatus("error");
    });
  }, [currentTrack]);

  useEffect(() => {
    if (!isChooserOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsChooserOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChooserOpen]);

  async function startPlayback() {
    const audio = audioRef.current;
    if (!audio || !currentTrack) {
      setStatus("error");
      return;
    }

    shouldKeepPlayingRef.current = true;
    setStatus("loading");

    try {
      await audio.play();
    } catch {
      shouldKeepPlayingRef.current = false;
      setStatus("error");
    }
  }

  async function handleToggle() {
    const audio = audioRef.current;
    if (!audio || !currentTrack) {
      setStatus("error");
      return;
    }

    if (!audio.paused) {
      shouldKeepPlayingRef.current = false;
      audio.pause();
      return;
    }

    await startPlayback();
  }

  function handleSkip(offset) {
    if (!currentTrack) {
      setStatus("error");
      return;
    }

    setCurrentIndex((index) => getWrappedIndex(index, offset, tracks.length));
  }

  async function handleTrackSelect(index) {
    setIsChooserOpen(false);
    shouldKeepPlayingRef.current = true;

    if (index === currentIndex) {
      await startPlayback();
      return;
    }

    setStatus("loading");
    setCurrentIndex(index);
  }

  const isPlaying = status === "playing";
  const isError = status === "error";

  return (
    <div className={`audio-player${isPlaying ? " is-playing" : ""}${isError ? " is-error" : ""}`}>
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
        onClick={handleToggle}
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
        className="audio-title"
        type="button"
        onClick={() => setIsChooserOpen(true)}
        disabled={!currentTrack}
        aria-haspopup="dialog"
        aria-expanded={isChooserOpen}
      >
        {currentTrack ? currentTrack.title : "Audio unavailable"}
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

      {isChooserOpen ? (
        <div
          className="audio-modal-backdrop"
          role="presentation"
          onClick={() => setIsChooserOpen(false)}
        >
          <section
            className="audio-modal"
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
                  <button
                    className={`audio-track-option${isCurrent ? " is-current" : ""}${isCurrentPlaying ? " is-playing" : ""}`}
                    type="button"
                    key={track.id}
                    onClick={() => handleTrackSelect(index)}
                  >
                    <span>{track.title}</span>
                    {isCurrentPlaying ? <span>Playing</span> : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
