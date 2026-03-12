export function parseTaggedText(source) {
  if (!source) {
    return [];
  }

  const segments = [];
  const pattern = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        text: source.slice(lastIndex, match.index),
      });
    }

    segments.push({
      type: 'tag',
      tagId: match[1].trim(),
      text: (match[2] ?? match[1]).trim(),
    });

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < source.length) {
    segments.push({
      type: 'text',
      text: source.slice(lastIndex),
    });
  }

  return segments;
}
