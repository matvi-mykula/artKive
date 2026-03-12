import { navigate } from '../lib/router';
import { RichText } from './RichText';

export function ArchiveCard({ work }) {
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
            transform: `scale(${work.coverScale ?? 1})`,
          }}
        />
      </button>
      <RichText className="card-text" segments={work.cardText} />
    </article>
  );
}
