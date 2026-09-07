// The SVG contains interactive HTML actions; its scroll container must also be keyboard reachable.
/* eslint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-tabindex */
import { useState } from 'react';
import {
  ArrowDownRight,
  Bot,
  CircleCheck,
  Diamond,
  Expand,
  Minus,
  Plus,
} from 'lucide-react';
import type { Flow } from '@/lib/graph';
export function FlowMap({
  flow,
  assisted,
  onSelect,
  visited = [],
}: {
  flow: Flow;
  assisted: boolean;
  onSelect: (id: string) => void;
  visited?: string[];
}) {
  const [zoom, setZoom] = useState(1);
  const width = Math.max(
    1020,
    (Math.max(0, ...flow.nodes.map((n) => n.column)) + 1) * 194 + 40,
  );
  const height = 640;
  const pos = (id: string) => {
    const n = flow.nodes.find((n) => n.id === id)!;
    return { x: 28 + n.column * 194, y: 78 + n.lane * 184 };
  };
  return (
    <div className="flow-map">
      <div className="graph-caption">
        <span>
          <span className="live-dot" />{' '}
          {assisted ? 'Proposed operating flow' : 'Current operating flow'}
        </span>
        <div className="actions">
          <button
            className="btn icon"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.65, z - 0.15))}
          >
            <Minus />
          </button>
          <button
            className="btn icon"
            aria-label="Reset zoom"
            onClick={() => setZoom(1)}
          >
            <Expand />
          </button>
          <button
            className="btn icon"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
          >
            <Plus />
          </button>
          <span className="small muted">{Math.round(zoom * 100)}%</span>
        </div>
      </div>
      <div
        className="graph-scroll"
        tabIndex={0}
        aria-label="Flow canvas. Scroll horizontally to see the whole route."
      >
        <svg
          className="graph-svg"
          style={{ width: `${width * zoom}px`, height: `${height * zoom}px` }}
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label="Connected flow of actions and decisions"
        >
          <defs>
            <pattern
              id="dots"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".8" fill="#cdd7d8" />
            </pattern>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L10 5 L0 10z" fill="#96a8af" />
            </marker>
          </defs>
          <rect width={width} height={height} fill="url(#dots)" />
          {[
            'Experience & fulfillment',
            'Systems & coordination',
            'People & exception work',
          ].map((label, i) => (
            <g key={label}>
              <rect
                x="0"
                y={i * 184 + 40}
                width={width}
                height="180"
                fill={i === 1 ? '#eff5f380' : '#ffffff50'}
              />
              <text x="28" y={i * 184 + 62} className="lane-label">
                {label}
              </text>
            </g>
          ))}
          {flow.edges.map((e) => {
            const a = pos(e.from),
              b = pos(e.to);
            const across = b.x > a.x;
            const sx = across ? a.x + 164 : a.x + 82,
              sy = across ? a.y + 60 : a.y + 118,
              tx = across ? b.x : b.x + 82,
              ty = across ? b.y + 60 : b.y;
            const mx = (sx + tx) / 2,
              my = (sy + ty) / 2;
            const path = across
              ? `M${sx},${sy} H${mx} V${ty} H${tx}`
              : `M${sx},${sy} V${my} H${tx} V${ty}`;
            return (
              <g key={e.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={
                    visited.includes(e.from) && visited.includes(e.to)
                      ? '#278477'
                      : '#9eb1b8'
                  }
                  strokeWidth="1.7"
                  markerEnd="url(#arrow)"
                  strokeDasharray={e.when === 'always' ? undefined : '4 3'}
                />
                <title>
                  {e.signal} · {e.when}
                </title>
                {e.when !== 'always' && (
                  <g>
                    <rect
                      x={mx - 37}
                      y={my - 9}
                      width="74"
                      height="19"
                      rx="4"
                      fill="#f8fbfb"
                    />
                    <text
                      x={mx}
                      y={my + 4}
                      textAnchor="middle"
                      className="edge-label"
                    >
                      {e.when}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {flow.nodes.map((n) => {
            const p = pos(n.id);
            const actor = flow.components.find((c) => c.id === n.componentId);
            return (
              <foreignObject
                key={n.id}
                x={p.x}
                y={p.y}
                width="166"
                height="125"
              >
                <button
                  className={`graph-node ${n.kind} ${assisted && n.ai ? 'ai-node' : ''} ${visited.includes(n.id) ? 'visited' : ''}`}
                  onClick={() => onSelect(n.id)}
                >
                  <span className="node-top">
                    <span>
                      {n.kind === 'decision' ? (
                        <Diamond size={12} />
                      ) : n.kind === 'outcome' ? (
                        <CircleCheck size={12} />
                      ) : (
                        <ArrowDownRight size={12} />
                      )}{' '}
                      {n.capability || 'Capability'}
                    </span>
                    {assisted && n.ai && <Bot size={15} />}
                  </span>
                  <strong>{n.title}</strong>
                  <small>{actor?.name || 'Unassigned'}</small>
                  {n.friction && (
                    <span className="friction-dot" title="Friction recorded" />
                  )}
                </button>
              </foreignObject>
            );
          })}
          {!flow.nodes.length && (
            <text x="45" y="140" className="lane-label">
              Add a component, then the first action. Connect actions with
              signals.
            </text>
          )}
        </svg>
      </div>
      <div className="map-footer">
        <span>◇ Decision</span>
        <span>━━ Signal / context handoff</span>
        <span>┄ Conditional route</span>
        <span className="ai-legend">● AI delegation candidate</span>
        <span>Select any action for its contract</span>
      </div>
    </div>
  );
}
