import { useEffect, useMemo, useRef, useState } from "react";
import { works } from "./data";
import { ArchiveCard } from "./components/ArchiveCard";
import { Header } from "./components/Header";
import { SongPage } from "./components/SongPage";
import { TagPage } from "./components/TagPage";
import { WorkPage } from "./components/WorkPage";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { navigate, parseRoute } from "./lib/router";
import { getTag, getTagLabel } from "./tags";
import { siteAudioTracks } from "./audio";

const THEME_PREFERENCE_KEY = "art-display-theme-preference";
const LEGACY_THEME_KEY = "art-display-theme";
const AUTO_THEME = "auto";

function getTimeBasedTheme(date = new Date()) {
  const hour = date.getHours();
  return hour >= 7 && hour < 19 ? "light" : "dark";
}

function getInitialThemePreference() {
  const storedTheme = window.localStorage.getItem(THEME_PREFERENCE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  window.localStorage.removeItem(LEGACY_THEME_KEY);
  return AUTO_THEME;
}

function getRoute() {
  return window.location.pathname;
}

function HomePage({ items }) {
  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Works</h1>
      </section>

      <section className="archive-grid" aria-label="Artwork archive">
        {items.map((work) => (
          <ArchiveCard key={work.slug} work={work} />
        ))}
      </section>
    </main>
  );
}

function NotFoundPage({ title, label }) {
  return (
    <main className="page-shell">
      <section className="detail-header">
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
        <button
          className="back-link"
          type="button"
          onClick={() => navigate("/")}
        >
          Back to archive
        </button>
      </section>
    </main>
  );
}

function ContactPage() {
  return (
    <main className="page-shell">
      <section className="detail-header">
        <p className="eyebrow">Contact</p>
        <p className="detail-description">
          <a className="footer-link" href="mailto:matt.pronchick@gmail.com">
            matt.pronchick@gmail.com
          </a>
        </p>
      </section>
    </main>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <button
        className="footer-link"
        type="button"
        onClick={() => navigate("/contact")}
      >
        Contact
      </button>
    </footer>
  );
}

export default function App() {
  const audioPlayer = useAudioPlayer(siteAudioTracks);
  const activeSongRouteRef = useRef(null);
  const pendingSongTrackRef = useRef(null);
  const [themePreference, setThemePreference] = useState(
    getInitialThemePreference,
  );
  const [route, setRoute] = useState(getRoute);
  const theme =
    themePreference === AUTO_THEME ? getTimeBasedTheme() : themePreference;

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (themePreference === AUTO_THEME) {
      window.localStorage.removeItem(THEME_PREFERENCE_KEY);
      return;
    }

    window.localStorage.setItem(THEME_PREFERENCE_KEY, themePreference);
  }, [themePreference]);

  const routeState = useMemo(() => parseRoute(route), [route]);

  const selectedWork = useMemo(() => {
    if (routeState.type !== "work") {
      return null;
    }

    return works.find((work) => work.slug === routeState.slug) ?? null;
  }, [routeState]);

  const selectedTag = useMemo(() => {
    if (routeState.type !== "tag") {
      return null;
    }

    const tag = getTag(routeState.slug);
    if (!tag) {
      return null;
    }

    return {
      slug: routeState.slug,
      label: getTagLabel(routeState.slug),
      works: works.filter((work) => work.tags.includes(routeState.slug)),
    };
  }, [routeState]);

  const selectedSong = useMemo(() => {
    if (routeState.type !== "song") {
      return null;
    }

    const index = siteAudioTracks.findIndex(
      (track) => track.id === routeState.slug,
    );
    if (index < 0) {
      return null;
    }

    return {
      index,
      track: siteAudioTracks[index],
    };
  }, [routeState]);

  useEffect(() => {
    const routedTrackId = selectedSong?.track.id ?? null;

    if (!routedTrackId) {
      activeSongRouteRef.current = null;
      pendingSongTrackRef.current = null;
      return;
    }

    if (activeSongRouteRef.current !== routedTrackId) {
      activeSongRouteRef.current = routedTrackId;
      if (audioPlayer.currentTrack?.id !== routedTrackId) {
        pendingSongTrackRef.current = routedTrackId;
        audioPlayer.loadTrack(selectedSong.index);
      } else {
        pendingSongTrackRef.current = null;
      }
      return;
    }

    if (audioPlayer.currentTrack?.id === routedTrackId) {
      pendingSongTrackRef.current = null;
      return;
    }

    if (pendingSongTrackRef.current === routedTrackId) {
      return;
    }

    if (audioPlayer.currentTrack?.id !== routedTrackId) {
      navigate("/");
    }
  }, [
    audioPlayer.currentTrack?.id,
    audioPlayer.loadTrack,
    selectedSong,
  ]);

  useEffect(() => {
    document.title = selectedSong
      ? `${selectedSong.track.title} — Matvi ArtKive`
      : "Matvi ArtKive";
  }, [selectedSong]);

  let content = (
    <NotFoundPage label="Missing page" title="This page does not exist." />
  );

  if (routeState.type === "home") {
    content = <HomePage items={works} />;
  } else if (routeState.type === "contact") {
    content = <ContactPage />;
  } else if (routeState.type === "work") {
    content = selectedWork ? (
      <WorkPage key={selectedWork.slug} work={selectedWork} />
    ) : (
      <NotFoundPage label="Missing work" title="This record does not exist." />
    );
  } else if (routeState.type === "tag") {
    content = selectedTag ? (
      <TagPage tag={selectedTag} />
    ) : (
      <NotFoundPage label="Missing tag" title="This tag does not exist." />
    );
  } else if (routeState.type === "song") {
    content =
      selectedSong?.track.vignette ? (
        <SongPage
          key={selectedSong.track.id}
          player={audioPlayer}
          track={selectedSong.track}
        />
      ) : (
        <NotFoundPage
          label="Missing vignette"
          title="This song does not have a video page."
        />
      );
  }

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        themePreference={themePreference}
        currentPath={route}
        player={audioPlayer}
        tracks={siteAudioTracks}
        onThemeToggle={() =>
          setThemePreference(() =>
            theme === "dark" ? "light" : "dark",
          )
        }
      />
      {content}
      <Footer />
    </div>
  );
}
