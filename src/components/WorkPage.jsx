import { useEffect, useState } from 'react';
import { parseTaggedText } from '../lib/richText';
import { navigate } from '../lib/router';
import { RichText } from './RichText';

export function WorkPage({ work }) {
  const [segments, setSegments] = useState([]);
  const [blurbStatus, setBlurbStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadBlurb() {
      if (!work.blurbPath) {
        setSegments([]);
        setBlurbStatus('missing');
        return;
      }

      setSegments([]);
      setBlurbStatus('loading');

      try {
        const response = await fetch(work.blurbPath);
        if (!response.ok) {
          throw new Error('Failed to load blurb');
        }

        const text = await response.text();

        if (!cancelled) {
          setSegments(parseTaggedText(text));
          setBlurbStatus('loaded');
        }
      } catch {
        if (!cancelled) {
          setSegments([]);
          setBlurbStatus('error');
        }
      }
    }

    loadBlurb();

    return () => {
      cancelled = true;
    };
  }, [work.blurbPath]);

  return (
    <main className="page-shell">
      <section className="detail-header">
        <button className="back-link" type="button" onClick={() => navigate('/')}>
          Back to archive
        </button>
        <p className="eyebrow">{work.slug}</p>
        <h1>{work.title}</h1>
        {segments.length ? (
          <RichText className="detail-description" segments={segments} />
        ) : blurbStatus === 'error' ? (
          <p className="detail-description detail-debug">
            Failed to load {work.blurbPath}
          </p>
        ) : blurbStatus === 'loading' ? (
          <p className="detail-description detail-debug">Loading text...</p>
        ) : null}
      </section>

      <section className="detail-images" aria-label={`${work.title} images`}>
        {work.images.map((image, index) => (
          <figure className="detail-figure" key={`${work.slug}-${index}`}>
            <img src={image} alt={`${work.title} view ${index + 1}`} />
            <figcaption>
              {work.title} / {String(index + 1).padStart(2, '0')}
            </figcaption>
          </figure>
        ))}
      </section>
    </main>
  );
}
