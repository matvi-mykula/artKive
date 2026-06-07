import { useEffect, useMemo, useState } from "react";
import { navigate } from "../lib/router";
import { getTagGraph } from "../lib/tagGraph";

const MAX_RELATED_TAGS = 12;
const MAX_MOBILE_RELATED_TAGS = 6;
const MAX_PREVIEW_WORKS = 6;

function getOrbitPoint(index, total, radiusX, radiusY, offset = -90) {
  const angle = ((360 / Math.max(1, total)) * index + offset) * (Math.PI / 180);

  return {
    x: 50 + Math.cos(angle) * radiusX,
    y: 50 + Math.sin(angle) * radiusY,
  };
}

function strengthClass(strength, maxStrength) {
  if (strength === maxStrength) {
    return "is-strong";
  }

  if (strength > 1) {
    return "is-medium";
  }

  return "is-light";
}

export function TagMap({ selectedTagId, works }) {
  const [isCompact, setIsCompact] = useState(() =>
    window.matchMedia("(max-width: 699px)").matches,
  );
  const graph = useMemo(
    () => getTagGraph(works, selectedTagId),
    [selectedTagId, works],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 699px)");
    const handleChange = () => setIsCompact(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const visibleTags = graph.relatedTags.slice(
    0,
    isCompact ? MAX_MOBILE_RELATED_TAGS : MAX_RELATED_TAGS,
  );
  const previewWorks = graph.selectedTag.works.slice(0, MAX_PREVIEW_WORKS);
  const hasRelatedTags = visibleTags.length > 0;

  return (
    <section className="tag-map-section" aria-label={`${graph.selectedTag.label} tag map`}>
      <div className="tag-map">
        {hasRelatedTags ? (
          <svg
            className="tag-map-lines"
            viewBox="0 0 100 100"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            {visibleTags.map((tag, index) => {
              const point = getOrbitPoint(
                index,
                visibleTags.length,
                isCompact ? 39 : 38,
                isCompact ? 42 : 34,
              );

              return (
                <line
                  key={tag.id}
                  className={`tag-map-line ${strengthClass(
                    tag.strength,
                    graph.maxStrength,
                  )}`}
                  x1="50"
                  y1="50"
                  x2={point.x}
                  y2={point.y}
                />
              );
            })}
          </svg>
        ) : null}

        <div className="tag-map-center" style={{ left: "50%", top: "50%" }}>
          <p className="eyebrow">Selected tag</p>
          <h1>{graph.selectedTag.label}</h1>
          <p className="tag-map-count">
            {graph.selectedTag.works.length} work
            {graph.selectedTag.works.length === 1 ? "" : "s"}
          </p>
          {previewWorks.length ? (
            <div
              className="tag-map-previews"
              aria-label={`${graph.selectedTag.label} work previews`}
            >
              {previewWorks.map((work) => (
                <button
                  key={work.slug}
                  className="tag-map-work"
                  type="button"
                  onClick={() => navigate(`/works/${work.slug}`)}
                  aria-label={`Open ${work.title}`}
                >
                  <img
                    src={work.coverImage}
                    alt=""
                    style={{ objectPosition: work.coverPosition }}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {visibleTags.map((tag, index) => {
          const point = getOrbitPoint(
            index,
            visibleTags.length,
            isCompact ? 39 : 38,
            isCompact ? 42 : 34,
          );

          return (
            <button
              key={tag.id}
              className={`tag-map-node ${strengthClass(
                tag.strength,
                graph.maxStrength,
              )}`}
              type="button"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => navigate(`/tags/${tag.id}`)}
              aria-label={`Center map on ${tag.label}`}
            >
              <span>{tag.label}</span>
              <small>+{tag.strength}</small>
            </button>
          );
        })}

        {!hasRelatedTags ? (
          <p className="tag-map-empty">
            No neighboring tags yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
