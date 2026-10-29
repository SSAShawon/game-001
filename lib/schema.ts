import { nowISO } from "./utils";
export const SAVE_VERSION = 1;
export const CATALOG_VERSION = 1;

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type ItemCategory =
  | "watches"
  | "hotWheels"
  | "gamingGear"
  | "pcsTech"
  | "sneakers"
  | "perfumes"
  | "books"
  | "figuresModels"
  | "footballMemorabilia"
  | "trophiesMedals"
  | "musicCollectibles"
  | "photography"
  | "motorcyclesMini"
  | "sunglasses"
  | "coinsCurrency"
  | "stationery"
  | "tradingCards"
  | "artPosters"
  | "buildingSets"
  | "travelSouvenirs";

export type BusinessType = "footballTurf" | "foodCourt" | "gamingCafe";

export type LocationId =
  | "home"
  | "bank"
  | "footballTurf"
  | "foodCourt"
  | "gamingCafe"
  | "emptyLand"
  | "shoppingArea"
  | "garage"
  | "futurePlaza";

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "loan"
  | "repayment"
  | "purchase"
  | "sale";

export type LoanStatus = "active" | "overdue" | "paid";
export type BusinessStatus = "locked" | "operating" | "closed";
export type PropertyStatus = "available" | "owned";
export type DreamStatus = "planning" | "active" | "achieved" | "paused";

export interface CatalogItem {
  id: string;
  category: ItemCategory;
  name: string;
  description: string;
  price: number;
  resaleValue?: number;
  rarity: Rarity;
  emoji: string;
  color?: string;
}

export interface InventoryItem {
  id: string;
  catalogId: string;
  name: string;
  category: ItemCategory;
  description: string;
  price: number;
  resaleValue?: number;
  rarity: Rarity;
  emoji: string;
  purchasedAt: string;
  placed: boolean;
  roomId?: string;
  x?: number;
  y?: number;
  rotation?: number;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  color: string;
}

export interface Player {
  id: string;
  name: string;
  cash: number;
  bankBalance: number;
  currentLocation: LocationId;
  selectedRoom: string | null;
  settings: {
    currency: string;
    autoSave: boolean;
    soundEnabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  account: "cash" | "bank";
  amount: number;
  category: string;
  description: string;
  date: string;
  balanceAfter: number;
  refId?: string;
}

export interface LoanPayment {
  id: string;
  date: string;
  amount: number;
  principalPart: number;
  interestPart: number;
  type: "installment" | "partial" | "early";
}

export interface Loan {
  id: string;
  principal: number;
  annualRate: number;
  termMonths: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  totalPayable: number;
  monthlyInstallment: number;
  status: LoanStatus;
  startDate: string;
  lastAccrualDate: string;
  nextDueDate: string;
  payments: LoanPayment[];
}

export interface BusinessConfig {
  type: BusinessType;
  name: string;
  description: string;
  startupCost: number;
  baseHourlyRate: number;
  operatingCostPerHour: number;
  utilization: number;
  upgradeLevels: {
    level: number;
    cost: number;
    hourlyRateMultiplier: number;
    operatingCostMultiplier: number;
  }[];
}

export interface Business {
  id: string;
  type: BusinessType;
  name: string;
  level: number;
  status: BusinessStatus;
  cash: number;
  totalInvested: number;
  lastRevenueCollectedAt: string;
  upgrades: string[];
  createdAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  status: PropertyStatus;
  location: string;
  value: number;
  purchasedAt?: string;
  notes: string;
}

export interface DreamMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface Dream {
  id: string;
  title: string;
  description: string;
  category: string;
  budget?: number;
  emoji?: string;
  status: DreamStatus;
  progress: number;
  milestones: DreamMilestone[];
  notes: string;
  connectedPurchase?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveState {
  version: number;
  savedAt: string;
  player: Player;
  transactions: Transaction[];
  loans: Loan[];
  businesses: Business[];
  properties: Property[];
  inventory: InventoryItem[];
  rooms: Room[];
  dreams: Dream[];
  catalogVersion: number;
}

export interface ImportValidation {
  valid: boolean;
  errors: string[];
  state?: SaveState;
}

/* ------------------------------------------------------------------ */
/* Default state                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_PLAYER: Player = {
  id: "player-1",
  name: "Player",
  cash: 50000,
  bankBalance: 0,
  currentLocation: "home",
  selectedRoom: "bedroom",
  settings: { currency: "BDT", autoSave: true, soundEnabled: true },
  createdAt: nowISO(),
  updatedAt: nowISO(),
};

export const DEFAULT_ROOMS: Room[] = [
  {
    id: "bedroom",
    name: "Bedroom",
    description: "Your private resting space.",
    unlocked: true,
    color: "#E9A5D1",
  },
  {
    id: "gaming",
    name: "Gaming Room",
    description: "Setup your gaming gear here.",
    unlocked: true,
    color: "#82D9F5",
  },
  {
    id: "collection",
    name: "Collection Room",
    description: "Display your prized collectibles.",
    unlocked: true,
    color: "#B7A7FF",
  },
  {
    id: "library",
    name: "Library",
    description: "Books, art, and quiet corners.",
    unlocked: true,
    color: "#F5C56A",
  },
  {
    id: "garage",
    name: "Garage",
    description: "For miniatures, models, and memories.",
    unlocked: true,
    color: "#82D9F5",
  },
];

export const DEFAULT_PROPERTIES: Property[] = [
  {
    id: "property-home",
    title: "Player's Home",
    description: "Your cozy home in the city.",
    price: 0,
    status: "owned",
    location: "home",
    value: 300000,
    purchasedAt: nowISO(),
    notes: "Starting home.",
  },
  {
    id: "property-plot-riverside",
    title: "Riverside Plot",
    description: "A quiet plot by the river, ready for construction.",
    price: 85000,
    status: "available",
    location: "emptyLand",
    value: 85000,
    notes: "Future construction site.",
  },
  {
    id: "property-plot-market",
    title: "Market Plaza Plot",
    description: "High-footfall plot in the shopping district.",
    price: 220000,
    status: "available",
    location: "emptyLand",
    value: 220000,
    notes: "Good for a shop or stall.",
  },
  {
    id: "property-plot-turf",
    title: "Turf Site",
    description: "Land where the Football Turf could be built.",
    price: 150000,
    status: "available",
    location: "emptyLand",
    value: 150000,
    notes: "Reserved for sports business.",
  },
];

export function getDefaultState(): SaveState {
  return {
    version: SAVE_VERSION,
    savedAt: nowISO(),
    catalogVersion: CATALOG_VERSION,
    player: { ...DEFAULT_PLAYER, updatedAt: nowISO() },
    transactions: [],
    loans: [],
    businesses: [],
    properties: [...DEFAULT_PROPERTIES],
    inventory: [],
    rooms: [...DEFAULT_ROOMS],
    dreams: [
      {
        id: "dream-1",
        title: "Build a Dream Home",
        description: "Expand the house into a full estate with a garden.",
        category: "Housing",
        budget: 1200000,
        emoji: "🏠",
        status: "planning",
        progress: 5,
        milestones: [
          { id: "m1", title: "Save initial down payment", done: false },
          { id: "m2", title: "Buy adjacent plot", done: false },
          { id: "m3", title: "Complete construction", done: false },
        ],
        notes: "Keep separate from virtual economy unless connected to an in-game purchase.",
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
      {
        id: "dream-2",
        title: "Own a Business Empire",
        description: "Run Football Turf, Food Court, and Gaming Café profitably.",
        category: "Business",
        budget: 1000000,
        emoji: "🏢",
        status: "active",
        progress: 0,
        milestones: [
          { id: "m4", title: "Start first business", done: false },
          { id: "m5", title: "Reach monthly profit of ৳50,000", done: false },
        ],
        notes: "",
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Migration & validation                                             */
/* ------------------------------------------------------------------ */

export function migrateSave(raw: unknown): SaveState {
  const state = raw as Partial<SaveState> & Record<string, unknown>;
  if (!state || typeof state !== "object") return getDefaultState();

  const next: SaveState = getDefaultState();

  if (state.player && typeof state.player === "object") {
    next.player = {
      ...next.player,
      ...(state.player as object),
      updatedAt: nowISO(),
    };
  }
  if (Array.isArray(state.transactions)) next.transactions = state.transactions as Transaction[];
  if (Array.isArray(state.loans)) next.loans = state.loans as Loan[];
  if (Array.isArray(state.businesses)) next.businesses = state.businesses as Business[];
  if (Array.isArray(state.properties)) next.properties = state.properties as Property[];
  if (Array.isArray(state.inventory)) next.inventory = state.inventory as InventoryItem[];
  if (Array.isArray(state.rooms)) next.rooms = state.rooms as Room[];
  if (Array.isArray(state.dreams)) next.dreams = state.dreams as Dream[];

  next.version = (state.version && state.version >= 1) ? state.version : SAVE_VERSION;
  next.catalogVersion = state.catalogVersion ?? CATALOG_VERSION;
  next.savedAt = nowISO();
  return next;
}

export function validateImport(raw: unknown): ImportValidation {
  const errors: string[] = [];
  const state = raw as Partial<SaveState> & Record<string, unknown>;

  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return { valid: false, errors: ["Backup file must contain a JSON object."] };
  }

  const version = state.version;
  if (typeof version !== "number" || version < 1 || version > SAVE_VERSION) {
    errors.push(`Unsupported save version: ${version ?? "missing"}. Expected ${SAVE_VERSION}.`);
  }

  const player = state.player;
  if (!player || typeof player !== "object") {
    errors.push("Missing player data.");
  } else {
    const p = player as unknown as Record<string, unknown>;
    if (typeof p.cash !== "number" || !isFinite(p.cash) || p.cash < 0) {
      errors.push("Invalid player.cash.");
    }
    if (typeof p.bankBalance !== "number" || !isFinite(p.bankBalance) || p.bankBalance < 0) {
      errors.push("Invalid player.bankBalance.");
    }
  }

  for (const key of ["transactions", "loans", "businesses", "properties", "inventory", "rooms", "dreams"]) {
    if (state[key] !== undefined && !Array.isArray(state[key])) {
      errors.push(`Field "${key}" must be an array.`);
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  const migrated = migrateSave(state);
  return { valid: true, errors: [], state: migrated };
}
