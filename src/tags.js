export const tags = {
  'oat-grass-roots': { id: 'oat-grass-roots', label: 'oat grass roots' },
  'coconut-fiber': { id: 'coconut-fiber', label: 'coconut fiber' },
  painted: { id: 'painted', label: 'painted' },
  'seed-pod': { id: 'seed-pod', label: 'seed pod' },
  stone: { id: 'stone', label: 'stone' },
  lamp: { id: 'lamp', label: 'lamp' },
  sculpture: { id: 'sculpture', label: 'sculpture' },
  shell: { id: 'shell', label: 'shell' },
  figure: { id: 'figure', label: 'figure' },
  object: { id: 'object', label: 'object' },
};

export function getTag(tagId) {
  return tags[tagId] ?? null;
}

export function getTagLabel(tagId) {
  return tags[tagId]?.label ?? tagId;
}
