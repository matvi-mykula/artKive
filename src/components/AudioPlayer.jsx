import { useEffect, useRef, useState } from "react";

export function AudioPlayer({ tracks }) {
  const audioRef = useRef(null);
  const shouldKeepPlayingRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);
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

    const handleLoadStart = () => setStatus((current) => (current === "playing" ? current : "loading"));
    const handlePlay = () => setStatus("playing");
    const handlePause = () => {
      if (!shouldKeepPlayingRef.current) {
        setStatus("paused");
      }
    };
    const handleError = () => {
      if (shouldKeepPlayingRef.current && tracks.length > 1) {
        setCurrentIndex((index) => (index + 1) % tracks.length);
        return;
      }

      shouldKeepPlayingRef.current = false;
      setStatus("error");
    };
    const handleEnded = () => {
      if (!shouldKeepPlayingRef.current) {
        setStatus("paused");
        return;
      }

      setCurrentIndex((index) => (index + 1) % tracks.length);
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
      setStatus((current) => (current === "error" ? current : "idle"));
      return;
    }

    setStatus("loading");
    audio.play().catch(() => {
      shouldKeepPlayingRef.current = false;
      setStatus("error");
    });
  }, [currentTrack]);

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

    shouldKeepPlayingRef.current = true;
    setStatus("loading");

    try {
      await audio.play();
    } catch {
      shouldKeepPlayingRef.current = false;
      setStatus("error");
    }
  }

  const isPlaying = status === "playing";
  const isError = status === "error";

  return (
    <div className={`audio-player${isPlaying ? " is-playing" : ""}${isError ? " is-error" : ""}`}>
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
        {isPlaying ? "Pause" : "Play"}
      </button>
      <span className="audio-title">
        {currentTrack ? currentTrack.title : "Audio unavailable"}
      </span>
    </div>
  );
}
