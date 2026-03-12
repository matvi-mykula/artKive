import { navigate } from '../lib/router';

export function Header({ theme, onThemeToggle, currentPath }) {
  const isHome = currentPath === '/';
  const isTagPage = currentPath.startsWith('/tags/');

  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => navigate('/')}>
        artKive
      </button>
      <div className="header-meta">
        <span className="status">
          {isHome ? 'Archive Index' : isTagPage ? 'Tag Index' : 'Work Record'}
        </span>
        <button className="theme-toggle" type="button" onClick={onThemeToggle}>
          Theme: {theme}
        </button>
      </div>
    </header>
  );
}
