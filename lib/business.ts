import type { SaveState, Business, BusinessConfig, BusinessType } from "./schema";
import { applyTransaction } from "./economy";
import { uuid, nowISO, round2 } from "./utils";

const HOUR_MS = 60 * 60 * 1000;
const MAX_COLLECT_HOURS = 72; // cap offline accumulation to keep game sane

export const BUSINESS_CONFIGS: Record<string, BusinessConfig> = {
  footballTurf: {
    type: "footballTurf",
    name: "Football Turf",
    description:
      "Community football ground. Earn hourly booking income. Fictional game values.",
    startupCost: 120000,
    baseHourlyRate: 800,
    operatingCostPerHour: 300,
    utilization: 0.45,
    upgradeLevels: [
      { level: 2, cost: 250000, hourlyRateMultiplier: 1.4, operatingCostMultiplier: 1.1 },
      { level: 3, cost: 500000, hourlyRateMultiplier: 2.0, operatingCostMultiplier: 1.25 },
    ],
  },
  foodCourt: {
    type: "foodCourt",
    name: "Food Court",
    description:
      "Multiple food stalls under one roof. Sales revenue minus ingredient and staff costs.",
    startupCost: 250000,
    baseHourlyRate: 1500,
    operatingCostPerHour: 700,
    utilization: 0.35,
    upgradeLevels: [
      { level: 2, cost: 400000, hourlyRateMultiplier: 1.5, operatingCostMultiplier: 1.15 },
      { level: 3, cost: 800000, hourlyRateMultiplier: 2.1, operatingCostMultiplier: 1.3 },
    ],
  },
  gamingCafe: {
    type: "gamingCafe",
    name: "Gaming Café",
    description:
      "PC and console stations with hourly charges, electricity and maintenance costs.",
    startupCost: 300000,
    baseHourlyRate: 600,
    operatingCostPerHour: 250,
    utilization: 0.4,
    upgradeLevels: [
      { level: 2, cost: 350000, hourlyRateMultiplier: 1.6, operatingCostMultiplier: 1.2 },
      { level: 3, cost: 700000, hourlyRateMultiplier: 2.3, operatingCostMultiplier: 1.35 },
    ],
  },
};

export function getConfig(type: string): BusinessConfig | undefined {
  return BUSINESS_CONFIGS[type];
}

export function businessHourlyNet(config: BusinessConfig, level: number): number {
  const upgrade = config.upgradeLevels.find((u) => u.level === level);
  const mult = upgrade ? upgrade.hourlyRateMultiplier : 1;
  const costMult = upgrade ? upgrade.operatingCostMultiplier : 1;
  const gross = config.baseHourlyRate * mult * config.utilization;
  const cost = config.operatingCostPerHour * costMult;
  return round2(gross - cost);
}

export function collectRevenue(
  state: SaveState,
  businessId: string,
  asOf: string = nowISO()
): SaveState {
  const index = state.businesses.findIndex((b) => b.id === businessId);
  if (index === -1) throw new Error("Business not found.");
  const business = state.businesses[index];
  if (business.status !== "operating") {
    throw new Error("Business is not operating.");
  }

  const config = getConfig(business.type);
  if (!config) throw new Error("Unknown business type.");

  const started = new Date(business.lastRevenueCollectedAt).getTime();
  const now = new Date(asOf).getTime();
  let hours = Math.max(0, (now - started) / HOUR_MS);
  hours = Math.min(hours, MAX_COLLECT_HOURS);

  const level = business.level;
  const netPerHour = businessHourlyNet(config, level);
  const netEarnings = round2(netPerHour * hours);

  const next: SaveState = {
    ...state,
    businesses: [...state.businesses],
  };
  const nextBusiness: Business = { ...business };
  nextBusiness.cash = round2(business.cash + netEarnings);
  nextBusiness.lastRevenueCollectedAt = asOf;
  next.businesses[index] = nextBusiness;
  next.player.updatedAt = nowISO();

  const description = `Revenue collected — ${config.name} (Level ${level})`;
  return applyTransaction(next, {
    type: "income",
    account: "bank",
    amount: Math.max(0, netEarnings),
    category: "Business Income",
    description,
    refId: businessId,
  });
}

export function startBusiness(state: SaveState, type: BusinessType): SaveState {
  const config = getConfig(type);
  if (!config) throw new Error("Unknown business type.");
  const existing = state.businesses.find((b) => b.type === type);
  if (existing) throw new Error(`${config.name} already exists.`);
  if (state.player.cash < config.startupCost) {
    throw new Error("Not enough cash to start this business.");
  }

  let next = applyTransaction(state, {
    type: "expense",
    account: "cash",
    amount: config.startupCost,
    category: "Business Investment",
    description: `Started ${config.name}`,
  });

  const business: Business = {
    id: uuid(),
    type,
    name: config.name,
    level: 1,
    status: "operating",
    cash: 0,
    totalInvested: config.startupCost,
    lastRevenueCollectedAt: nowISO(),
    upgrades: [],
    createdAt: nowISO(),
  };
  next = { ...next, businesses: [...next.businesses, business] };
  next.player.updatedAt = nowISO();
  return next;
}

export function toggleBusiness(state: SaveState, businessId: string): SaveState {
  const index = state.businesses.findIndex((b) => b.id === businessId);
  if (index === -1) throw new Error("Business not found.");
  const next: SaveState = {
    ...state,
    businesses: [...state.businesses],
  };
  const b: Business = { ...next.businesses[index] };
  b.status = b.status === "operating" ? "closed" : "operating";
  next.businesses[index] = b;
  next.player.updatedAt = nowISO();
  return next;
}

export function upgradeBusiness(state: SaveState, businessId: string): SaveState {
  const index = state.businesses.findIndex((b) => b.id === businessId);
  if (index === -1) throw new Error("Business not found.");
  const business = state.businesses[index];
  const config = getConfig(business.type);
  if (!config) throw new Error("Unknown business type.");

  const nextLevel = business.level + 1;
  const upgrade = config.upgradeLevels.find((u) => u.level === nextLevel);
  if (!upgrade) throw new Error("No further upgrades available.");
  if (state.player.cash < upgrade.cost) {
    throw new Error("Not enough cash for this upgrade.");
  }

  let next = applyTransaction(state, {
    type: "expense",
    account: "cash",
    amount: upgrade.cost,
    category: "Business Upgrade",
    description: `Upgraded ${config.name} to Level ${nextLevel}`,
  });

  const nextBusinesses = [...next.businesses];
  const nextBusiness: Business = { ...business };
  nextBusiness.level = nextLevel;
  nextBusiness.upgrades = [...business.upgrades, `level-${nextLevel}`];
  nextBusiness.totalInvested = round2(business.totalInvested + upgrade.cost);
  nextBusinesses[index] = nextBusiness;
  next = { ...next, businesses: nextBusinesses };
  next.player.updatedAt = nowISO();
  return next;
}

export function transferBusinessCash(
  state: SaveState,
  businessId: string,
  amount: number,
  to: "cash" | "bank"
): SaveState {
  amount = round2(amount);
  const index = state.businesses.findIndex((b) => b.id === businessId);
  if (index === -1) throw new Error("Business not found.");
  const business = state.businesses[index];
  if (amount <= 0 || amount > business.cash) {
    throw new Error("Invalid transfer amount.");
  }

  const next: SaveState = {
    ...state,
    businesses: [...state.businesses],
  };
  const b: Business = { ...business };
  b.cash = round2(b.cash - amount);
  next.businesses[index] = b;

  return applyTransaction(next, {
    type: "income",
    account: to,
    amount,
    category: "Business Payout",
    description: `Payout from ${business.name}`,
  });
}

export function getBusinessSummary(state: SaveState) {
  return state.businesses.map((b) => {
    const config = getConfig(b.type);
    const netPerHour = config ? businessHourlyNet(config, b.level) : 0;
    return {
      ...b,
      config,
      netPerHour,
      monthlyEstimate: round2(netPerHour * 24 * 30),
    };
  });
}
