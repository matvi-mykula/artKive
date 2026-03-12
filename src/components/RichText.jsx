import { navigate } from '../lib/router';
import { getTagLabel } from '../tags';

export function RichText({ segments, className = '' }) {
  return (
    <p className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'tag') {
          return (
            <button
              key={`${segment.tagId}-${index}`}
              className="inline-tag"
              type="button"
              onClick={() => navigate(`/tags/${segment.tagId}`)}
              aria-label={`View works tagged ${getTagLabel(segment.tagId)}`}
            >
              {segment.text}
            </button>
          );
        }

        return <span key={`${segment.text}-${index}`}>{segment.text}</span>;
      })}
    </p>
  );
}
