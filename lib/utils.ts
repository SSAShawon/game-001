import type { SaveState } from "./schema";
export function uuid() {
  return crypto.randomUUID();
}

export function nowISO() {
  return new Date().toISOString();
}

export function parseDateSafe(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeNetWorth(state: SaveState): number {
  const businessCash = state.businesses.reduce((sum: number, b) => sum + b.cash, 0);
  const inventoryValue = state.inventory.reduce(
    (sum: number, item) => sum + (item.resaleValue ?? item.price),
    0
  );
  const propertyValue = state.properties.reduce(
    (sum: number, p) => (p.status === "owned" ? sum + p.value : sum),
    0
  );
  const liability = state.loans.reduce(
    (sum: number, l) => sum + l.outstandingPrincipal + l.outstandingInterest,
    0
  );
  return state.player.cash + state.player.bankBalance + businessCash + inventoryValue + propertyValue - liability;
}
