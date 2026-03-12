export const tags = {
  stone: { id: 'stone', label: 'stone' },
  lamp: { id: 'lamp', label: 'lamp' },
  sculpture: { id: 'sculpture', label: 'sculpture' },
  shell: { id: 'shell', label: 'shell' },
  figure: { id: 'figure', label: 'figure' },
  object: { id: 'object', label: 'object' },
  study: { id: 'study', label: 'study' },
};

export function getTag(tagId) {
  return tags[tagId] ?? null;
}

export function getTagLabel(tagId) {
  return tags[tagId]?.label ?? tagId;
}
