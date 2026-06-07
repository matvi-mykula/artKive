import { useEffect, useRef, useState } from "react";

function getWrappedIndex(index, offset, length) {
  if (!length) {
    return 0;
  }

  return (index + offset + length) % length;
}

export function useAudioPlayer(tracks) {
  const audioRef = useRef(null);
  const errorSkipCountRef = useRef(0);
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

  async function togglePlayback() {
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

  function skipTrack(offset) {
    if (!currentTrack) {
      setStatus("error");
      return;
    }

    setCurrentIndex((index) => getWrappedIndex(index, offset, tracks.length));
  }

  async function selectTrack(index) {
    shouldKeepPlayingRef.current = true;

    if (index === currentIndex) {
      await startPlayback();
      return;
    }

    setStatus("loading");
    setCurrentIndex(index);
  }

  return {
    currentIndex,
    currentTrack,
    isError: status === "error",
    isPlaying: status === "playing",
    selectTrack,
    skipTrack,
    status,
    togglePlayback,
  };
}
