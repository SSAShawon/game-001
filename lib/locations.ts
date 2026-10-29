import type { LocationId } from "./schema";

export interface LocationDef {
  id: LocationId;
  title: string;
  gx: number;
  gy: number;
  color: string;
  sideColor?: string;
  status: "owned" | "available" | "locked" | "future";
  description: string;
  panel: string;
  initialRoom?: string;
}

export const LOCATIONS: LocationDef[] = [
  {
    id: "home",
    title: "Player's Home",
    gx: 0,
    gy: 0,
    color: "#E9A5D1",
    sideColor: "#c77dbb",
    status: "owned",
    description: "Your customizable house with multiple rooms.",
    panel: "home",
  },
  {
    id: "bank",
    title: "Bank",
    gx: -5,
    gy: -4,
    color: "#82D9F5",
    sideColor: "#4fa8d1",
    status: "owned",
    description: "Deposits, withdrawals, loans, and repayment schedules.",
    panel: "bank",
  },
  {
    id: "footballTurf",
    title: "Football Turf",
    gx: 5,
    gy: -4,
    color: "#22c55e",
    sideColor: "#15803d",
    status: "locked",
    description: "Community football ground with hourly bookings.",
    panel: "businesses",
  },
  {
    id: "foodCourt",
    title: "Food Court",
    gx: -5,
    gy: 4,
    color: "#f59e0b",
    sideColor: "#b45309",
    status: "locked",
    description: "Multiple food stalls under one roof.",
    panel: "businesses",
  },
  {
    id: "gamingCafe",
    title: "Gaming Café",
    gx: 5,
    gy: 4,
    color: "#a855f7",
    sideColor: "#7e3bf2",
    status: "locked",
    description: "Gaming stations, hourly charges, and upgrades.",
    panel: "businesses",
  },
  {
    id: "shoppingArea",
    title: "Shopping Area",
    gx: -8,
    gy: 0,
    color: "#ec4899",
    sideColor: "#be185d",
    status: "owned",
    description: "Browse the catalog and buy collectibles.",
    panel: "inventory",
  },
  {
    id: "garage",
    title: "Garage",
    gx: 1,
    gy: 3,
    color: "#82D9F5",
    sideColor: "#4fa8d1",
    status: "owned",
    description: "Part of your home — store miniatures and models here.",
    panel: "home",
    initialRoom: "garage",
  },
  {
    id: "emptyLand",
    title: "Empty Land / Property Market",
    gx: -2,
    gy: 6,
    color: "#64748b",
    sideColor: "#475569",
    status: "available",
    description: "Available plots to buy and develop.",
    panel: "properties",
  },
  {
    id: "futurePlaza",
    title: "Future Expansion Area",
    gx: 3,
    gy: 7,
    color: "#334155",
    sideColor: "#1e293b",
    status: "future",
    description: "More locations coming in future updates.",
    panel: "",
  },
];

export function getLocation(id: LocationId): LocationDef | undefined {
  return LOCATIONS.find((loc) => loc.id === id);
}

export function locationForPanel(panel: string): LocationDef | undefined {
  return LOCATIONS.find((loc) => loc.panel === panel);
}
