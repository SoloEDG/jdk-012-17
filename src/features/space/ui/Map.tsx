import type { Point } from "../../../shared/types";
import { artworks } from "../../../shared/catalog";
export type MapMarker = {
  id: string;
  point: Point;
  index: number;
  stale?: boolean;
};
export function Map({
  position,
  active,
  onSelect,
  large = false,
  markers = [],
  onSelectMarker,
}: {
  position: Point;
  active: string | null;
  onSelect: (id: string) => void;
  large?: boolean;
  markers?: MapMarker[];
  onSelectMarker?: (id: string) => void;
}) {
  return (
    <svg
      className={large ? "map large" : "map"}
      viewBox="0 0 160 190"
      aria-label="展馆平面导航"
    >
      <rect x="12" y="10" width="136" height="165" rx="2" fill="#e6e2d7" />
      <path d="M12 65H148M12 120H148M57 10V175M103 10V175" stroke="#d4d0c5" />
      <rect x="67" y="88" width="26" height="20" fill="#b8ad94" />
      {artworks.map((a, i) => (
        <g
          key={a.id}
          onClick={() => onSelect(a.id)}
          role="button"
          tabIndex={0}
          aria-label={"前往" + a.title}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSelect(a.id);
          }}
        >
          <circle
            cx={80 + a.position.x * 10}
            cy={90 + a.position.z * 10}
            r={active === a.id ? 9 : 7}
            fill={active === a.id ? "#c5a66d" : "#797c72"}
          />
          <text
            x={80 + a.position.x * 10}
            y={93 + a.position.z * 10}
            textAnchor="middle"
            fill="white"
            fontSize="8"
          >
            {i + 1}
          </text>
        </g>
      ))}
      {markers.map((m) => (
        <g
          key={m.id}
          className="memory-marker"
          onClick={(e) => {
            e.stopPropagation();
            onSelectMarker?.(m.id);
          }}
          role="button"
          tabIndex={0}
          aria-label={"打开记忆点 " + (m.index + 1)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSelectMarker?.(m.id);
          }}
        >
          <circle
            cx={80 + m.point.x * 10}
            cy={90 + m.point.z * 10}
            r="4.5"
            fill={m.stale ? "#8a7a55" : "#b08d4f"}
            stroke="#fff8"
            strokeWidth="1"
          />
          <text
            x={80 + m.point.x * 10}
            y={92.8 + m.point.z * 10}
            textAnchor="middle"
            fill="white"
            fontSize="5.5"
          >
            {m.index + 1}
          </text>
        </g>
      ))}
      <circle
        data-testid="map-position"
        cx={80 + position.x * 10}
        cy={90 + position.z * 10}
        r="5"
        fill="#282c26"
        stroke="white"
        strokeWidth="2"
      />
      <text x="80" y="187" textAnchor="middle" fontSize="9" fill="#77796d">
        南入口 · SOUTH ENTRANCE
      </text>
    </svg>
  );
}
