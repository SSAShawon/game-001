"use client";

import type { LocationDef } from "@/lib/locations";

interface WorldMapProps {
  locations: LocationDef[];
  ownedLocationIds: string[];
  onLocationSelect: (id: string) => void;
}

// Grid spacing in px. Locations are placed by their (gx, gy) coords.
const CELL = 62;
const OFFSET_X = 8; // shift gx (-8..5) into positive columns (0..13)
const OFFSET_Y = 4; // shift gy (-4..7) into positive rows (0..11)

const GRID_COLS = 14;
const GRID_ROWS = 12;

function markerColor(status: LocationDef["status"], owned: boolean): string {
  if (owned) return "#E9A5D1"; // orchid
  if (status === "available") return "#82D9F5"; // glacial
  if (status === "future") return "#334155";
  return "#64748b"; // locked
}

function statusLabel(status: LocationDef["status"], owned: boolean): string {
  if (owned) return "Owned";
  if (status === "available") return "Available";
  if (status === "future") return "Future";
  return "Locked";
}

export default function WorldMap({
  locations,
  ownedLocationIds,
  onLocationSelect,
}: WorldMapProps) {
  const ownedSet = new Set(ownedLocationIds);

  return (
    <div
      className="absolute inset-0 z-0 w-full h-full bg-[#0a0b0f] overflow-hidden flex items-center justify-center p-4"
    >
      <div
        className="w-full max-w-[870px] max-h-[640px] relative bg-[#0f1118] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Title */}
        <div className="absolute top-4 left-4 z-20 flex flex-col">
          <h1 className="text-2xl font-bold text-glacial tracking-tight">
            LIFE LEAD
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Personal Life Simulation
          </p>
        </div>

        {/* 2D world grid */}
        <div
          className="relative mx-auto"
          style={{
            width: GRID_COLS * CELL,
            height: GRID_ROWS * CELL,
          }}
        >
          {/* Grid lines */}
          {[...Array(GRID_ROWS + 1)].map((row) => (
            <div
              key={`h-${row}`}
              className="absolute left-0 w-full border-b border-zinc-900/40"
              style={{ top: row * CELL }}
            />
          ))}
          {[...Array(GRID_COLS + 1)].map((col) => (
            <div
              key={`v-${col}`}
              className="absolute top-0 h-full border-r border-zinc-900/40"
              style={{ left: col * CELL }}
            />
          ))}

          {/* Location markers */}
          {locations.map((loc) => {
            const owned = ownedSet.has(loc.id);
            const interactive = loc.status === "owned" || loc.status === "available";
            const color = markerColor(loc.status, owned);
            const x = (loc.gx + OFFSET_X) * CELL;
            const y = (loc.gy + OFFSET_Y) * CELL;

            return (
              <div
                key={loc.id}
                className="absolute z-10 flex flex-col items-center cursor-pointer transition-transform duration-150 group"
                style={{
                  left: x - 20,
                  top: y - 46,
                  transform: `translate(${x}px, ${y}px)`,
                }}
                onClick={() => onLocationSelect(loc.id)}
                title={statusLabel(loc.status, owned)}
              >
                {/* Marker circle */}
                <div
                  className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shadow-lg text-black font-bold transition-all duration-200 group-hover:scale-110 ${
                    interactive
                      ? `bg-white/10 border-[${color}] text-[${color}]`
                      : "bg-zinc-800 border-zinc-700 text-zinc-500"
                  }`}
                >
                  {loc.title.charAt(0)}
                </div>

                {/* Label */}
                <div
                  className={`mt-1.5 text-[10px] font-semibold text-center text-zinc-200 w-[76px] leading-tight ${
                    owned ? "text-orchid" : "text-glacial"
                  }`}
                >
                  {loc.title}
                </div>

                {/* Status tag */}
                {!interactive && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold ${
                        loc.status === "future"
                          ? "border-zinc-600 text-zinc-500"
                          : "border-zinc-700 text-zinc-500"
                      }`}
                    >
                      {loc.status === "future" ? "…" : "🔒"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
          {[
            { color: "#E9A5D1", label: "Owned" },
            { color: "#82D9F5", label: "Available" },
            { color: "#64748b", label: "Locked" },
            { color: "#334155", label: "Future" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-700 bg-[#12141b]/80 text-[10px] text-zinc-300"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Hint */}
        <div className="absolute bottom-4 right-4 z-20 text-[10px] text-zinc-500">
          Click a location to enter
        </div>
      </div>
    </div>
  );
}
