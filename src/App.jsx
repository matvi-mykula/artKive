import { useEffect, useMemo, useState } from 'react';
import { works } from './data';

const THEME_KEY = 'art-display-theme';

function getInitialTheme() {
  const storedTheme = window.localStorage.getItem(THEME_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return 'dark';
}

function getRoute() {
  return window.location.pathname;
}

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function Header({ theme, onThemeToggle, currentPath }) {
  const isHome = currentPath === '/';

  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => navigate('/')}>
        Art Display
      </button>
      <div className="header-meta">
        <span className="status">{isHome ? 'Archive Index' : 'Work Record'}</span>
        <button className="theme-toggle" type="button" onClick={onThemeToggle}>
          Theme: {theme}
        </button>
      </div>
    </header>
  );
}

function HomePage({ items }) {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Archive</p>
        <h1>Works</h1>
      </section>

      <section className="archive-grid" aria-label="Artwork archive">
        {items.map((work, index) => (
          <article className="archive-card" key={work.slug}>
            <button
              className="card-link"
              type="button"
              onClick={() => navigate(`/works/${work.slug}`)}
            >
              <div className="card-copy">
                <p className="card-index">
                  {String(index + 1).padStart(2, '0')} / {work.year}
                </p>
                <h2>{work.title}</h2>
                <ul className="tag-list" aria-label={`${work.title} tags`}>
                  {work.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
              <img
                src={work.coverImage}
                alt={work.title}
                className="card-image"
                style={{
                  objectPosition: work.coverPosition,
                  transform: `scale(${work.coverScale ?? 1})`,
                }}
              />
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

function WorkPage({ work }) {
  if (!work) {
    return (
      <main className="page-shell">
        <section className="detail-header">
          <p className="eyebrow">Missing work</p>
          <h1>This record does not exist.</h1>
          <button className="back-link" type="button" onClick={() => navigate('/')}>
            Back to archive
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="detail-header">
        <button className="back-link" type="button" onClick={() => navigate('/')}>
          Back to archive
        </button>
        <p className="eyebrow">
          {work.year} / {work.slug}
        </p>
        <h1>{work.title}</h1>
        {work.description ? (
          <p className="detail-description">{work.description}</p>
        ) : null}
        <ul className="tag-list" aria-label={`${work.title} tags`}>
          {work.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </section>

      <section className="detail-images" aria-label={`${work.title} images`}>
        {work.images.map((image, index) => (
          <figure className="detail-figure" key={`${work.slug}-${index}`}>
            <img src={image} alt={`${work.title} view ${index + 1}`} />
            <figcaption>
              {work.title} / frame {String(index + 1).padStart(2, '0')}
            </figcaption>
          </figure>
        ))}
      </section>
    </main>
  );
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const selectedWork = useMemo(() => {
    const match = route.match(/^\/works\/([^/]+)$/);
    if (!match) {
      return null;
    }

    return works.find((work) => work.slug === match[1]) ?? null;
  }, [route]);

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        currentPath={route}
        onThemeToggle={() =>
          setTheme((currentTheme) =>
            currentTheme === 'dark' ? 'light' : 'dark',
          )
        }
      />
      {route === '/' ? <HomePage items={works} /> : <WorkPage work={selectedWork} />}
    </div>
  );
}
