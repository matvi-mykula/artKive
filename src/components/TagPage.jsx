import { ArchiveCard } from './ArchiveCard';
import { TagMap } from './TagMap';
import { works } from '../data';

export function TagPage({ tag }) {
  return (
    <main className="page-shell">
      <TagMap selectedTagId={tag.slug} works={works} />

      <section className="archive-grid" aria-label={`${tag.label} works`}>
        {tag.works.map((work) => (
          <ArchiveCard key={work.slug} work={work} />
        ))}
      </section>
    </main>
  );
}
