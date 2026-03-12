import { ArchiveCard } from './ArchiveCard';

export function TagPage({ tag }) {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Tag</p>
        <h1>{tag.label}</h1>
        <p className="intro">{tag.works.length} work{tag.works.length === 1 ? '' : 's'}</p>
      </section>

      <section className="archive-grid" aria-label={`${tag.label} works`}>
        {tag.works.map((work) => (
          <ArchiveCard key={work.slug} work={work} />
        ))}
      </section>
    </main>
  );
}
