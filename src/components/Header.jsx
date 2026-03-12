import { navigate } from "../lib/router";

export function Header({ theme, onThemeToggle, currentPath }) {
  const isHome = currentPath === "/";
  const isTagPage = currentPath.startsWith("/tags/");

  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => navigate("/")}>
        Matvi ArtKive
      </button>
      <div className="header-meta">
        {!isHome && isTagPage ? (
          <span className="status">Tag Library</span>
        ) : null}
        <button className="theme-toggle" type="button" onClick={onThemeToggle}>
          Theme: {theme}
        </button>
      </div>
    </header>
  );
}
