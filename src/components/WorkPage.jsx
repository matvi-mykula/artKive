import { navigate } from '../lib/router';
import { useTextSegments } from '../hooks/useTextSegments';
import { RichText } from './RichText';

export function WorkPage({ work }) {
  const segments = useTextSegments(work.descriptionPath);

  return (
    <main className="page-shell">
      <section className="detail-header">
        <button className="back-link" type="button" onClick={() => navigate('/')}>
          Back to archive
        </button>
        <p className="eyebrow">{work.slug}</p>
        <h1>{work.title}</h1>
        {segments.length ? <RichText className="detail-description" segments={segments} /> : null}
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
