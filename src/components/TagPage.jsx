import { ArchiveCard } from './ArchiveCard';
import { TagForceMap } from './TagForceMap';
import { works } from '../data';

export function TagPage({ tag }) {
  return (
    <main className="page-shell">
      <TagForceMap selectedTagId={tag.slug} works={works} />

      <section className="archive-grid" aria-label={`${tag.label} works`}>
        {tag.works.map((work) => (
          <ArchiveCard key={work.slug} work={work} />
        ))}
      </section>
    </main>
  );
}
