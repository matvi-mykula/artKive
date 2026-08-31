import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { siteAudioTracks } from "../audio.js";
import { useAudioPlayer } from "../hooks/useAudioPlayer.js";
import { AudioPlayer } from "./AudioPlayer.jsx";
import { SongVignette } from "./SongVignette.jsx";

const THEME_PREFERENCE_KEY = "art-display-theme-preference";
const AUTO_THEME = "auto";

function getTimeBasedTheme(date = new Date()) {
  const hour = date.getHours();
  return hour >= 7 && hour < 19 ? "light" : "dark";
}

function getInitialThemePreference() {
  if (typeof window === "undefined") {
    return AUTO_THEME;
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_PREFERENCE_KEY);
    return storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : AUTO_THEME;
  } catch {
    return AUTO_THEME;
  }
}

function getSongId(currentPath) {
  const match = /^\/songs\/([^/]+)\/?$/.exec(currentPath);
  return match?.[1] ?? null;
}

export default function SiteChrome({ currentPath }) {
  const player = useAudioPlayer(siteAudioTracks);
  const [themePreference, setThemePreference] = useState(
    getInitialThemePreference,
  );
  const [portalTarget, setPortalTarget] = useState(null);
  const theme =
    themePreference === AUTO_THEME ? getTimeBasedTheme() : themePreference;
  const songId = getSongId(currentPath);
  const selectedSong = useMemo(() => {
    const index = siteAudioTracks.findIndex((track) => track.id === songId);
    return index < 0 ? null : { index, track: siteAudioTracks[index] };
  }, [songId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      if (themePreference === AUTO_THEME) {
        window.localStorage.removeItem(THEME_PREFERENCE_KEY);
      } else {
        window.localStorage.setItem(THEME_PREFERENCE_KEY, themePreference);
      }
    } catch {
      // Theme preference remains available for the current page.
    }
  }, [theme, themePreference]);

  useEffect(() => {
    const updatePortalTarget = () =>
      setPortalTarget(document.getElementById("song-vignette-root"));

    updatePortalTarget();
    document.addEventListener("astro:page-load", updatePortalTarget);
    return () =>
      document.removeEventListener("astro:page-load", updatePortalTarget);
  }, [currentPath]);

  useEffect(() => {
    if (selectedSong && player.currentTrack?.id !== selectedSong.track.id) {
      player.loadTrack(selectedSong.index);
    }
  }, [player.currentTrack?.id, player.loadTrack, selectedSong]);

  const isTagPage = currentPath.startsWith("/tags/");
  const isSongPage = Boolean(selectedSong);
  const themeLabel =
    themePreference === AUTO_THEME ? `Auto: ${theme}` : `Theme: ${theme}`;

  return (
    <>
      <header className={`site-header${isSongPage ? " is-song-page" : ""}`}>
        <a className="brand" href="/">Matvi ArtKive</a>
        <div className="header-meta">
          {isTagPage ? <span className="status">Tag Library</span> : null}
          <AudioPlayer
            currentPath={currentPath}
            player={player}
            tracks={siteAudioTracks}
          />
          <button
            className="theme-toggle"
            type="button"
            onClick={() =>
              setThemePreference(theme === "dark" ? "light" : "dark")
            }
          >
            {themeLabel}
          </button>
        </div>
      </header>
      {portalTarget && selectedSong?.track.vignette
        ? createPortal(
            <SongVignette player={player} track={selectedSong.track} />,
            portalTarget,
          )
        : null}
    </>
  );
}
