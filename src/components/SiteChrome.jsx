import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { siteAudioTracks } from "../audio.js";
import { useAudioPlayer } from "../hooks/useAudioPlayer.js";
import { AudioPlayer } from "./AudioPlayer.jsx";
import { SongVignette } from "./SongVignette.jsx";

function getTimeBasedTheme(date = new Date()) {
  const hour = date.getHours();
  return hour >= 7 && hour < 19 ? "light" : "dark";
}

function getSongId(currentPath) {
  const match = /^\/songs\/([^/]+)\/?$/.exec(currentPath);
  return match?.[1] ?? null;
}

export default function SiteChrome({ currentPath }) {
  const player = useAudioPlayer(siteAudioTracks);
  const [portalTarget, setPortalTarget] = useState(null);
  const songId = getSongId(currentPath);
  const selectedSong = useMemo(() => {
    const index = siteAudioTracks.findIndex((track) => track.id === songId);
    return index < 0 ? null : { index, track: siteAudioTracks[index] };
  }, [songId]);

  useEffect(() => {
    const updateTheme = () => {
      document.documentElement.dataset.theme = getTimeBasedTheme();
    };

    updateTheme();
    const intervalId = window.setInterval(updateTheme, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

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

  return (
    <>
      <header className={`site-header${isSongPage ? " is-song-page" : ""}`}>
        <a className="brand" href="/">Matvi Mykula</a>
        <div className="header-meta">
          {isTagPage ? <span className="status">Tag Library</span> : null}
          <AudioPlayer
            currentPath={currentPath}
            player={player}
            tracks={siteAudioTracks}
          />
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
