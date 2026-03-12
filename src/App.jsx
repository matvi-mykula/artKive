import { useEffect, useMemo, useState } from 'react';
import { works } from './data';
import { ArchiveCard } from './components/ArchiveCard';
import { Header } from './components/Header';
import { TagPage } from './components/TagPage';
import { WorkPage } from './components/WorkPage';
import { navigate } from './lib/router';
import { getTag, getTagLabel } from './tags';

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

function parseRoute(route) {
  if (route === '/') {
    return { type: 'home' };
  }

  if (route === '/contact') {
    return { type: 'contact' };
  }

  const workMatch = route.match(/^\/works\/([^/]+)$/);
  if (workMatch) {
    return { type: 'work', slug: workMatch[1] };
  }

  const tagMatch = route.match(/^\/tags\/([^/]+)$/);
  if (tagMatch) {
    return { type: 'tag', slug: tagMatch[1] };
  }

  return { type: 'not-found' };
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
        <button className="back-link" type="button" onClick={() => navigate('/')}>
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
        <h1>Contact</h1>
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
      <button className="footer-link" type="button" onClick={() => navigate('/contact')}>
        Contact
      </button>
    </footer>
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

  const routeState = useMemo(() => parseRoute(route), [route]);

  const selectedWork = useMemo(() => {
    if (routeState.type !== 'work') {
      return null;
    }

    return works.find((work) => work.slug === routeState.slug) ?? null;
  }, [routeState]);

  const selectedTag = useMemo(() => {
    if (routeState.type !== 'tag') {
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

  let content = <NotFoundPage label="Missing page" title="This page does not exist." />;

  if (routeState.type === 'home') {
    content = <HomePage items={works} />;
  } else if (routeState.type === 'contact') {
    content = <ContactPage />;
  } else if (routeState.type === 'work') {
    content = selectedWork ? (
      <WorkPage key={selectedWork.slug} work={selectedWork} />
    ) : (
      <NotFoundPage label="Missing work" title="This record does not exist." />
    );
  } else if (routeState.type === 'tag') {
    content = selectedTag ? (
      <TagPage tag={selectedTag} />
    ) : (
      <NotFoundPage label="Missing tag" title="This tag does not exist." />
    );
  }

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
      {content}
      <Footer />
    </div>
  );
}
