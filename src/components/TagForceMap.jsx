import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { navigate } from "../lib/router";
import {
  getLinkNodeIds,
  getTagFocus,
  getTagNetwork,
  isLinkConnectedTo,
} from "../lib/tagNetwork";
import { tagTypes } from "../tags";

const TYPE_COLORS = {
  material: "#53d7a1",
  form: "#f0c85a",
  process: "#ff8b5f",
  quality: "#9fb7ff",
  phenomenon: "#72dfff",
  motif: "#ee8bd6",
  context: "#b89cff",
  location: "#7ed86a",
  uncategorized: "#9aa59a",
};

const FOCUS_ZOOM = 2.35;
const MOBILE_FOCUS_ZOOM = 1.55;
const FOCUS_MS = 650;

function cssVar(name, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  return (
    window.getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function hexToRgba(hex, alpha) {
  const cleanHex = hex.replace("#", "");
  const value = Number.parseInt(cleanHex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getNodeColor(node) {
  return TYPE_COLORS[node.type] ?? TYPE_COLORS.uncategorized;
}

function formatWorkCount(count) {
  return `${count} work${count === 1 ? "" : "s"}`;
}

function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

function nodeRadius(node, selectedTagId, activeNeighborIds, hoveredTagId) {
  const isSelected = node.id === selectedTagId;
  const isHovered = node.id === hoveredTagId;
  const isActiveNeighbor = activeNeighborIds.has(node.id);
  const usageRadius = Math.min(5.4, 2.8 + node.workCount * 0.75);

  if (isSelected) {
    return usageRadius + 4.8;
  }

  if (isHovered) {
    return usageRadius + 3.4;
  }

  if (isActiveNeighbor) {
    return usageRadius + 1.8;
  }

  return Math.max(3.2, usageRadius);
}

function shouldShowNodeLabel(node, selectedTagId, activeNeighborIds, hoveredTagId, scale) {
  if (node.id === selectedTagId || node.id === hoveredTagId) {
    return true;
  }

  if (activeNeighborIds.has(node.id) && scale > 0.58) {
    return true;
  }

  return node.workCount > 1 && scale > 0.9;
}

function paintNode({
  activeNeighborIds,
  colors,
  hoveredTagId,
  node,
  selectedTagId,
  ctx,
  scale,
}) {
  const isSelected = node.id === selectedTagId;
  const isHovered = node.id === hoveredTagId;
  const isActiveNeighbor = activeNeighborIds.has(node.id);
  const baseColor = getNodeColor(node);
  const radius = nodeRadius(node, selectedTagId, activeNeighborIds, hoveredTagId);
  const alpha = isSelected || isHovered ? 1 : isActiveNeighbor ? 0.88 : 0.38;
  const strokeAlpha = isSelected || isHovered ? 0.95 : isActiveNeighbor ? 0.55 : 0.22;

  ctx.save();
  ctx.beginPath();
  ctx.arc(node.x, node.y, radius, 0, Math.PI * 2, false);
  ctx.fillStyle = hexToRgba(baseColor, alpha);
  ctx.fill();
  ctx.lineWidth = (isSelected ? 2.2 : 1.2) / scale;
  ctx.strokeStyle = isSelected ? colors.accent : hexToRgba(baseColor, strokeAlpha);
  ctx.stroke();

  if (isSelected || isHovered) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + 4 / scale, 0, Math.PI * 2, false);
    ctx.lineWidth = 1 / scale;
    ctx.strokeStyle = hexToRgba(baseColor, 0.35);
    ctx.stroke();
  }

  if (shouldShowNodeLabel(node, selectedTagId, activeNeighborIds, hoveredTagId, scale)) {
    const fontSize = Math.max(3.2, Math.min(7.4, 10 / scale));
    const labelOffset = radius + fontSize * 0.82;

    ctx.font = `${isSelected ? 600 : 500} ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(node.label).width;
    const paddingX = fontSize * 0.45;
    const paddingY = fontSize * 0.28;

    ctx.fillStyle = colors.labelBackground;
    ctx.fillRect(
      node.x - textWidth / 2 - paddingX,
      node.y + labelOffset - fontSize / 2 - paddingY,
      textWidth + paddingX * 2,
      fontSize + paddingY * 2,
    );

    ctx.fillStyle = isSelected ? colors.accent : colors.text;
    ctx.fillText(node.label, node.x, node.y + labelOffset);
  }

  ctx.restore();
}

function paintPointerArea(node, color, ctx) {
  const radius = Math.max(11, node.__pointerRadius ?? 12);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(node.x, node.y, radius, 0, Math.PI * 2, false);
  ctx.fill();
}

export function TagForceMap({ selectedTagId, works }) {
  const graphRef = useRef();
  const [containerRef, size] = useElementSize();
  const [hoveredTagId, setHoveredTagId] = useState(null);
  const didInitialFocusRef = useRef(false);
  const network = useMemo(() => getTagNetwork(works), [works]);
  const focus = useMemo(
    () => getTagFocus(network, selectedTagId),
    [network, selectedTagId],
  );
  const hoveredFocus = useMemo(
    () => (hoveredTagId ? getTagFocus(network, hoveredTagId) : null),
    [hoveredTagId, network],
  );
  const activeNeighborIds = hoveredFocus?.neighborIds ?? focus.neighborIds;
  const activeTagId = hoveredTagId ?? selectedTagId;
  const isCompact = size.width > 0 && size.width < 700;
  const colors = {
    accent: cssVar("--accent", "#b7ff85"),
    labelBackground: cssVar("--bg", "#121512"),
    line: cssVar("--line", "rgba(147, 245, 166, 0.16)"),
    text: cssVar("--text", "#93f5a6"),
  };

  const focusNode = useCallback(
    (node, duration = FOCUS_MS) => {
      if (!graphRef.current || typeof node?.x !== "number" || typeof node?.y !== "number") {
        return;
      }

      graphRef.current.centerAt(node.x, node.y, duration);
      graphRef.current.zoom(isCompact ? MOBILE_FOCUS_ZOOM : FOCUS_ZOOM, duration);
    },
    [isCompact],
  );

  useEffect(() => {
    if (!focus.selectedNode) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      focusNode(focus.selectedNode, 420);
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [focus.selectedNode, focusNode, selectedTagId]);

  const handleEngineStop = useCallback(() => {
    if (didInitialFocusRef.current) {
      return;
    }

    didInitialFocusRef.current = true;
    if (focus.selectedNode) {
      focusNode(focus.selectedNode, 700);
    } else {
      graphRef.current?.zoomToFit(700, 48);
    }
  }, [focus.selectedNode, focusNode]);

  const handleNodeClick = useCallback(
    (node) => {
      focusNode(node);

      if (node.id !== selectedTagId) {
        navigate(`/tags/${node.id}`);
      }
    },
    [focusNode, selectedTagId],
  );

  const handleNodeDragEnd = useCallback((node) => {
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  const nodeCanvasObject = useCallback(
    (node, ctx, scale) => {
      node.__pointerRadius = nodeRadius(
        node,
        selectedTagId,
        activeNeighborIds,
        hoveredTagId,
      ) + 7 / scale;

      paintNode({
        activeNeighborIds,
        colors,
        hoveredTagId,
        node,
        selectedTagId,
        ctx,
        scale,
      });
    },
    [activeNeighborIds, colors, hoveredTagId, selectedTagId],
  );

  const selectedLabel = focus.selectedNode?.label ?? selectedTagId;
  const visibleWorks = focus.selectedWorks.slice(0, 5);
  const typeEntries = Object.values(tagTypes).filter(
    (type) => type.id !== "uncategorized",
  );

  return (
    <section className="tag-force-section" aria-label={`${selectedLabel} tag force map`}>
      <div className="tag-force-header">
        <div className="tag-force-title">
          <p className="eyebrow">Selected tag</p>
          <h1>{selectedLabel}</h1>
          <p className="tag-force-count">
            {formatWorkCount(focus.selectedWorks.length)} / {focus.relatedCount} linked tag
            {focus.relatedCount === 1 ? "" : "s"}
          </p>
        </div>

        {visibleWorks.length ? (
          <div className="tag-force-previews" aria-label={`${selectedLabel} work previews`}>
            {visibleWorks.map((work) => (
              <button
                key={work.slug}
                className="tag-force-work"
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

      <div className="tag-force-map" ref={containerRef}>
        {size.width > 0 && size.height > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={network.graphData}
            width={size.width}
            height={size.height}
            backgroundColor="rgba(0,0,0,0)"
            nodeId="id"
            nodeVal={(node) => node.val}
            nodeLabel={(node) =>
              `${node.label}<br>${node.typeLabel} / ${formatWorkCount(node.workCount)}`
            }
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => "replace"}
            nodePointerAreaPaint={paintPointerArea}
            linkLabel={(link) => {
              const { source, target } = getLinkNodeIds(link);
              const sourceLabel = network.nodeById.get(source)?.label ?? source;
              const targetLabel = network.nodeById.get(target)?.label ?? target;

              return `${sourceLabel} / ${targetLabel}<br>${formatWorkCount(link.strength)}`;
            }}
            linkColor={(link) =>
              isLinkConnectedTo(link, activeTagId)
                ? hexToRgba(getNodeColor(network.nodeById.get(activeTagId) ?? {}), 0.72)
                : colors.line
            }
            linkWidth={(link) =>
              isLinkConnectedTo(link, activeTagId)
                ? 0.95 + Math.min(2.4, link.strength * 0.55)
                : 0.35 + Math.min(1.2, link.strength * 0.18)
            }
            linkCurvature={0.04}
            minZoom={0.35}
            maxZoom={5}
            warmupTicks={80}
            cooldownTicks={160}
            d3AlphaDecay={0.028}
            d3VelocityDecay={0.34}
            onEngineStop={handleEngineStop}
            onNodeClick={handleNodeClick}
            onNodeHover={(node) => setHoveredTagId(node?.id ?? null)}
            onNodeDragEnd={handleNodeDragEnd}
            showPointerCursor
          />
        ) : null}
      </div>

      <div className="tag-force-types" aria-label="Tag types">
        {typeEntries.map((type) => (
          <span key={type.id} className="tag-force-type">
            <span
              className="tag-force-type-swatch"
              style={{ backgroundColor: TYPE_COLORS[type.id] }}
              aria-hidden="true"
            />
            {type.label}
          </span>
        ))}
      </div>
    </section>
  );
}
