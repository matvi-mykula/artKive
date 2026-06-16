export const tagTypes = {
  material: { id: "material", label: "Material", order: 10 },
  form: { id: "form", label: "Form", order: 20 },
  process: { id: "process", label: "Process", order: 30 },
  quality: { id: "quality", label: "Quality", order: 40 },
  phenomenon: { id: "phenomenon", label: "Phenomenon", order: 50 },
  motif: { id: "motif", label: "Motif", order: 60 },
  context: { id: "context", label: "Context", order: 70 },
  location: { id: "location", label: "Location", order: 80 },
  uncategorized: { id: "uncategorized", label: "Uncategorized", order: 999 },
};

export const tags = {
  "oat-grass-roots": {
    id: "oat-grass-roots",
    label: "oat grass roots",
    types: ["material", "process"],
  },
  "coconut-fiber": {
    id: "coconut-fiber",
    label: "coconut fiber",
    types: ["material"],
  },
  painted: { id: "painted", label: "painted", types: ["process"] },
  "seed-pod": {
    id: "seed-pod",
    label: "seed pod",
    types: ["material", "form"],
  },
  stone: { id: "stone", label: "stone", types: ["material"] },
  lamp: { id: "lamp", label: "lamp", types: ["form"] },
  sculpture: { id: "sculpture", label: "sculpture", types: ["form"] },
  shell: { id: "shell", label: "shell", types: ["material", "form"] },
  figure: { id: "figure", label: "figure", types: ["form"] },
  translucent: {
    id: "translucent",
    label: "translucent",
    types: ["quality", "phenomenon"],
  },
  wood: { id: "wood", label: "wood", types: ["material"] },
  dowels: { id: "dowels", label: "dowels", types: ["material", "form"] },
  pyramid: { id: "pyramid", label: "pyramid", types: ["form"] },
  nightlight: { id: "nightlight", label: "nightlight", types: ["form"] },
  light: { id: "light", label: "light", types: ["phenomenon"] },
  glow: { id: "glow", label: "glow", types: ["phenomenon", "quality"] },
  stacked: { id: "stacked", label: "stacked", types: ["process"] },
  surface: { id: "surface", label: "surface", types: ["context", "form"] },
  vibration: {
    id: "vibration",
    label: "vibration",
    types: ["phenomenon", "quality"],
  },
  architectural: {
    id: "architectural",
    label: "architectural",
    types: ["context", "motif"],
  },
  carved: { id: "carved", label: "carved", types: ["process"] },
  "found-material": {
    id: "found-material",
    label: "found material",
    types: ["material", "context"],
  },
  obelisk: { id: "obelisk", label: "obelisk", types: ["form", "motif"] },
  coral: { id: "coral", label: "coral", types: ["motif", "material"] },
  framing: { id: "framing", label: "framing", types: ["process", "context"] },
  ornament: { id: "ornament", label: "ornament", types: ["motif"] },
  provisional: {
    id: "provisional",
    label: "provisional",
    types: ["quality"],
  },
  narrative: { id: "narrative", label: "narrative", types: ["context"] },
  mysticism: { id: "mysticism", label: "mysticism", types: ["motif"] },
  fabric: { id: "fabric", label: "fabric", types: ["material"] },
  tapestry: { id: "tapestry", label: "tapestry", types: ["form"] },
  grown: { id: "grown", label: "grown", types: ["process"] },
  structure: { id: "structure", label: "structure", types: ["context", "form"] },
  orbital: { id: "orbital", label: "orbital", types: ["motif", "quality"] },
  planetary: { id: "planetary", label: "planetary", types: ["motif"] },
  swirl: { id: "swirl", label: "swirl", types: ["motif", "quality"] },
  suspended: { id: "suspended", label: "suspended", types: ["process"] },
  watchful: { id: "watchful", label: "watchful", types: ["quality"] },
  animate: { id: "animate", label: "animate", types: ["quality", "motif"] },
  tropical: { id: "tropical", label: "tropical", types: ["motif", "location"] },
};

export function getTag(tagId) {
  return tags[tagId] ?? null;
}

export function getTagLabel(tagId) {
  return tags[tagId]?.label ?? tagId;
}

export function getTagTypes(tagId) {
  return tags[tagId]?.types ?? [];
}

export function getPrimaryTagType(tagId) {
  return getTagTypes(tagId)[0] ?? "uncategorized";
}

export function getTagType(tagTypeId) {
  return tagTypes[tagTypeId] ?? null;
}

export function getTagTypeOrder(tagId) {
  const primaryType = getPrimaryTagType(tagId);
  return tagTypes[primaryType]?.order ?? Number.POSITIVE_INFINITY;
}

export function getTagsByType(tagTypeId) {
  return Object.values(tags).filter((tag) => tag.types.includes(tagTypeId));
}
