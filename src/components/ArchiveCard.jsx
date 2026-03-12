import { navigate } from '../lib/router';
import { useTextSegments } from '../hooks/useTextSegments';
import { RichText } from './RichText';

export function ArchiveCard({ work }) {
  const segments = useTextSegments(work.blurbPath);

  return (
    <article className="archive-card">
      <button
        className="card-link"
        type="button"
        onClick={() => navigate(`/works/${work.slug}`)}
      >
        <div className="card-copy">
          <h2>{work.title}</h2>
        </div>
        <img
          src={work.coverImage}
          alt={work.title}
          className="card-image"
          style={{
            objectPosition: work.coverPosition,
          }}
        />
      </button>
      {segments.length ? <RichText className="card-text" segments={segments} /> : null}
    </article>
  );
}
