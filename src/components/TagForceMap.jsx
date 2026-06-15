import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { navigate } from "../lib/router";
import {
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
const MAX_LABEL_LINE_LENGTH = 12;
const MAX_LABEL_LINES = 2;

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

function splitLabel(label) {
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length <= 1 || label.length <= MAX_LABEL_LINE_LENGTH) {
    return [label];
  }

  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= MAX_LABEL_LINE_LENGTH || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length <= MAX_LABEL_LINES) {
    return lines;
  }

  return [
    lines[0],
    lines.slice(1).join(" "),
  ];
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
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

function getNodeState(node, selectedTagId, activeNeighborIds) {
  const isSelected = node.id === selectedTagId;
  const isActiveNeighbor = activeNeighborIds.has(node.id);

  if (isSelected) {
    return "selected";
  }

  if (isActiveNeighbor) {
    return "related";
  }

  return "idle";
}

function getBubbleMetrics(node, state, ctx, scale) {
  const labelLines = splitLabel(node.label);
  const screenFontSize = state === "selected" ? 12 : state === "related" ? 10.5 : 9;
  const fontSize = screenFontSize / scale;
  const weight = state === "idle" ? 500 : 700;
  const paddingX = (state === "selected" ? 13 : state === "related" ? 10 : 8) / scale;
  const paddingY = (state === "selected" ? 8 : state === "related" ? 7 : 6) / scale;
  const minWidth = (state === "selected" ? 68 : state === "related" ? 54 : 44) / scale;
  const minHeight = (state === "selected" ? 40 : state === "related" ? 34 : 30) / scale;
  const lineHeight = fontSize * 1.08;

  ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;

  const textWidth = Math.max(...labelLines.map((line) => ctx.measureText(line).width));
  const width = Math.max(minWidth, textWidth + paddingX * 2);
  const height = Math.max(minHeight, labelLines.length * lineHeight + paddingY * 2);

  return {
    fontSize,
    height,
    labelLines,
    lineHeight,
    radius: height / 2,
    weight,
    width,
  };
}

function paintNode({ activeNeighborIds, colors, node, selectedTagId, ctx, scale }) {
  const state = getNodeState(node, selectedTagId, activeNeighborIds);
  const baseColor = getNodeColor(node);
  const metrics = getBubbleMetrics(node, state, ctx, scale);
  const x = node.x - metrics.width / 2;
  const y = node.y - metrics.height / 2;
  const fillAlpha = state === "selected" ? 0.98 : state === "related" ? 0.82 : 0.18;
  const strokeAlpha = state === "selected" ? 0.95 : state === "related" ? 0.7 : 0.32;
  const textColor = state === "idle" ? hexToRgba(baseColor, 0.92) : colors.ink;
  const lineWidth = (state === "selected" ? 2.4 : state === "related" ? 1.7 : 1) / scale;

  node.__pointerBox = {
    height: metrics.height + 10 / scale,
    width: metrics.width + 10 / scale,
  };

  ctx.save();
  drawRoundedRect(ctx, x, y, metrics.width, metrics.height, metrics.radius);
  ctx.fillStyle = hexToRgba(baseColor, fillAlpha);
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = state === "selected" ? colors.accent : hexToRgba(baseColor, strokeAlpha);
  ctx.stroke();

  if (state === "selected") {
    drawRoundedRect(
      ctx,
      x - 4 / scale,
      y - 4 / scale,
      metrics.width + 8 / scale,
      metrics.height + 8 / scale,
      metrics.radius + 4 / scale,
    );
    ctx.lineWidth = 1 / scale;
    ctx.strokeStyle = hexToRgba(baseColor, 0.4);
    ctx.stroke();
  }

  ctx.font = `${metrics.weight} ${metrics.fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = textColor;

  const firstLineY =
    node.y - ((metrics.labelLines.length - 1) * metrics.lineHeight) / 2;
  metrics.labelLines.forEach((line, index) => {
    ctx.fillText(line, node.x, firstLineY + index * metrics.lineHeight);
  });

  ctx.restore();
}

function paintPointerArea(node, color, ctx) {
  const width = node.__pointerBox?.width ?? Math.max(52, node.label.length * 8);
  const height = node.__pointerBox?.height ?? 34;

  ctx.fillStyle = color;
  drawRoundedRect(ctx, node.x - width / 2, node.y - height / 2, width, height, height / 2);
  ctx.fill();
}

export function TagForceMap({ selectedTagId, works }) {
  const graphRef = useRef();
  const [containerRef, size] = useElementSize();
  const didInitialFocusRef = useRef(false);
  const network = useMemo(() => getTagNetwork(works), [works]);
  const focus = useMemo(
    () => getTagFocus(network, selectedTagId),
    [network, selectedTagId],
  );
  const activeNeighborIds = focus.neighborIds;
  const isCompact = size.width > 0 && size.width < 700;
  const colors = {
    accent: cssVar("--accent", "#b7ff85"),
    ink: "#101610",
    line: cssVar("--line", "rgba(147, 245, 166, 0.16)"),
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
    if (!graphRef.current || size.width === 0) {
      return;
    }

    const chargeForce = graphRef.current.d3Force("charge");
    const linkForce = graphRef.current.d3Force("link");

    chargeForce?.strength(isCompact ? -110 : -150);
    linkForce?.distance((link) => Math.max(54, 84 - link.strength * 7));
    graphRef.current.d3ReheatSimulation();
  }, [isCompact, network, size.width]);

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
      paintNode({
        activeNeighborIds,
        colors,
        node,
        selectedTagId,
        ctx,
        scale,
      });
    },
    [activeNeighborIds, colors, selectedTagId],
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
            nodeLabel={() => ""}
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => "replace"}
            nodePointerAreaPaint={paintPointerArea}
            linkLabel={() => ""}
            linkColor={(link) =>
              isLinkConnectedTo(link, selectedTagId)
                ? hexToRgba(getNodeColor(network.nodeById.get(selectedTagId) ?? {}), 0.72)
                : colors.line
            }
            linkWidth={(link) =>
              isLinkConnectedTo(link, selectedTagId)
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
