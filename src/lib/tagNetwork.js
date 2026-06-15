import {
  getPrimaryTagType,
  getTagType,
  getTagTypeOrder,
  tags,
} from "../tags";

function compareTags(left, right) {
  const typeOrderDelta = getTagTypeOrder(left.id) - getTagTypeOrder(right.id);
  if (typeOrderDelta !== 0) {
    return typeOrderDelta;
  }

  return left.label.localeCompare(right.label);
}

function compareLinks(left, right) {
  if (right.strength !== left.strength) {
    return right.strength - left.strength;
  }

  return left.id.localeCompare(right.id);
}

function getLinkKey(leftId, rightId) {
  return [leftId, rightId].sort().join("::");
}

function getLinkEndpoints(link) {
  const source = typeof link.source === "object" ? link.source.id : link.source;
  const target = typeof link.target === "object" ? link.target.id : link.target;

  return { source, target };
}

function createTagWorkMap() {
  return new Map(Object.keys(tags).map((tagId) => [tagId, []]));
}

export function getTagNetwork(works) {
  const worksByTagId = createTagWorkMap();
  const linksByKey = new Map();

  works.forEach((work) => {
    const workTagIds = [...new Set(work.tags)].filter((tagId) => tags[tagId]);

    workTagIds.forEach((tagId) => {
      worksByTagId.get(tagId)?.push(work);
    });

    workTagIds.forEach((sourceId, sourceIndex) => {
      workTagIds.slice(sourceIndex + 1).forEach((targetId) => {
        const linkKey = getLinkKey(sourceId, targetId);
        const [source, target] = linkKey.split("::");
        const link = linksByKey.get(linkKey) ?? {
          id: linkKey,
          source,
          target,
          strength: 0,
          workIds: [],
          workTitles: [],
        };

        link.strength += 1;
        link.workIds.push(work.slug);
        link.workTitles.push(work.title);
        linksByKey.set(linkKey, link);
      });
    });
  });

  const nodes = Object.values(tags)
    .map((tag) => {
      const primaryType = getPrimaryTagType(tag.id);
      const type = getTagType(primaryType);
      const workCount = worksByTagId.get(tag.id)?.length ?? 0;

      return {
        id: tag.id,
        label: tag.label,
        kind: "tag",
        type: primaryType,
        typeLabel: type?.label ?? primaryType,
        types: tag.types ?? [],
        workCount,
        val: Math.max(18, tag.label.length * 2.8 + workCount * 3),
      };
    })
    .sort(compareTags);

  const links = Array.from(linksByKey.values()).sort(compareLinks);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const neighborIdsByTagId = new Map(nodes.map((node) => [node.id, new Set()]));
  const linkByTagPair = new Map();

  links.forEach((link) => {
    const { source, target } = getLinkEndpoints(link);

    neighborIdsByTagId.get(source)?.add(target);
    neighborIdsByTagId.get(target)?.add(source);
    linkByTagPair.set(getLinkKey(source, target), link);
  });

  return {
    graphData: { nodes, links },
    links,
    linkByTagPair,
    maxStrength: Math.max(1, ...links.map((link) => link.strength)),
    maxWorkCount: Math.max(1, ...nodes.map((node) => node.workCount)),
    neighborIdsByTagId,
    nodeById,
    nodes,
    worksByTagId,
  };
}

export function getTagFocus(network, selectedTagId) {
  const selectedNode = network.nodeById.get(selectedTagId) ?? null;
  const neighborIds = network.neighborIdsByTagId.get(selectedTagId) ?? new Set();
  const selectedWorks = network.worksByTagId.get(selectedTagId) ?? [];

  return {
    neighborIds,
    relatedCount: neighborIds.size,
    selectedNode,
    selectedWorks,
  };
}

export function getLinkNodeIds(link) {
  return getLinkEndpoints(link);
}

export function isLinkConnectedTo(link, tagId) {
  const { source, target } = getLinkEndpoints(link);

  return source === tagId || target === tagId;
}
