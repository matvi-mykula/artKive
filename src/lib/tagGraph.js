import { getTagLabel } from "../tags";

function compareByStrengthThenLabel(left, right) {
  if (right.strength !== left.strength) {
    return right.strength - left.strength;
  }

  return left.label.localeCompare(right.label);
}

export function getTagGraph(works, selectedTagId) {
  const selectedWorks = works.filter((work) =>
    work.tags.includes(selectedTagId),
  );
  const relationMap = new Map();

  selectedWorks.forEach((work) => {
    work.tags.forEach((tagId) => {
      if (tagId === selectedTagId) {
        return;
      }

      const relation = relationMap.get(tagId) ?? {
        id: tagId,
        label: getTagLabel(tagId),
        strength: 0,
        works: [],
      };

      relation.strength += 1;
      relation.works.push(work);
      relationMap.set(tagId, relation);
    });
  });

  const relatedTags = Array.from(relationMap.values()).sort(
    compareByStrengthThenLabel,
  );
  const maxStrength = Math.max(
    1,
    ...relatedTags.map((relation) => relation.strength),
  );

  return {
    selectedTag: {
      id: selectedTagId,
      label: getTagLabel(selectedTagId),
      works: selectedWorks,
    },
    relatedTags,
    maxStrength,
  };
}
