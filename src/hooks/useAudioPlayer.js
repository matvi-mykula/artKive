import { useEffect, useRef, useState } from "react";

const AUDIO_VOLUME_KEY = "art-display-audio-volume-v2";
const DEFAULT_VOLUME = 0.75;

function getWrappedIndex(index, offset, length) {
  if (!length) {
    return 0;
  }

  return (index + offset + length) % length;
}

function readStoredVolume() {
  try {
    const storedValue = window.localStorage.getItem(AUDIO_VOLUME_KEY);
    if (storedValue === null) {
      return DEFAULT_VOLUME;
    }

    const storedVolume = Number(storedValue);
    if (
      Number.isFinite(storedVolume) &&
      storedVolume >= 0 &&
      storedVolume <= 1
    ) {
      return storedVolume;
    }
  } catch {
    return DEFAULT_VOLUME;
  }

  return DEFAULT_VOLUME;
}

function writeStoredVolume(volume) {
  try {
    window.localStorage.setItem(AUDIO_VOLUME_KEY, String(volume));
  } catch {
    // Volume still works for the current session when storage is unavailable.
  }
}

function clampVolume(volume) {
  if (!Number.isFinite(volume)) {
    return DEFAULT_VOLUME;
  }

  return Math.min(1, Math.max(0, volume));
}

export function useAudioPlayer(tracks) {
  const audioRef = useRef(null);
  const errorSkipCountRef = useRef(0);
  const shouldKeepPlayingRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState(tracks.length ? "idle" : "error");
  const [volume, setVolumeState] = useState(readStoredVolume);

  const currentTrack = tracks[currentIndex] ?? null;

  useEffect(() => {
    if (!tracks.length) {
      setStatus("error");
      return undefined;
    }

    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volume;
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
    if (audio) {
      audio.volume = volume;
    }

    writeStoredVolume(volume);
  }, [volume]);

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

  function setVolume(volumeValue) {
    setVolumeState(clampVolume(volumeValue));
  }

  return {
    currentIndex,
    currentTrack,
    isError: status === "error",
    isPlaying: status === "playing",
    selectTrack,
    setVolume,
    skipTrack,
    status,
    togglePlayback,
    volume,
  };
}
