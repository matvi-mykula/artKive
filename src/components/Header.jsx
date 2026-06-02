import { navigate } from "../lib/router";
import { AudioPlayer } from "./AudioPlayer";

export function Header({
  theme,
  themePreference,
  onThemeToggle,
  currentPath,
  tracks,
}) {
  const isHome = currentPath === "/";
  const isTagPage = currentPath.startsWith("/tags/");
  const themeLabel =
    themePreference === "auto" ? `Auto: ${theme}` : `Theme: ${theme}`;

  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => navigate("/")}>
        Matvi ArtKive
      </button>
      <div className="header-meta">
        {!isHome && isTagPage ? (
          <span className="status">Tag Library</span>
        ) : null}
        <AudioPlayer tracks={tracks} />
        <button className="theme-toggle" type="button" onClick={onThemeToggle}>
          {themeLabel}
        </button>
      </div>
    </header>
  );
}
