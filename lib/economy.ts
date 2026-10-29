import type {
  SaveState,
  Transaction,
  Loan,
  LoanPayment,
  InventoryItem,
  CatalogItem,
} from "./schema";
import { uuid, nowISO, round2 } from "./utils";

const DAY_MS = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* Transaction engine                                                 */
/* All balance updates are immutable: every function returns a new    */
/* SaveState and never mutates the input.                             */
/* ------------------------------------------------------------------ */

export interface TransactionInput {
  type: "income" | "expense" | "loan" | "repayment" | "purchase" | "sale";
  account: "cash" | "bank";
  amount: number;
  category: string;
  description: string;
  date?: string;
  refId?: string;
}

export function applyTransaction(state: SaveState, input: TransactionInput): SaveState {
  const amount = round2(input.amount);
  if (!isFinite(amount) || amount < 0) {
    throw new Error("Transaction amount must be a non-negative number.");
  }
  if (amount === 0) throw new Error("Transaction amount must be greater than zero.");

  const accountBalance =
    input.account === "cash" ? state.player.cash : state.player.bankBalance;

  let delta = 0;
  if (input.type === "income" || input.type === "loan" || input.type === "sale") {
    delta = amount;
  } else if (input.type === "expense" || input.type === "repayment" || input.type === "purchase") {
    delta = -amount;
  } else {
    throw new Error(`Unknown transaction type: ${input.type}`);
  }

  const balanceAfter = round2(accountBalance + delta);
  if (balanceAfter < 0) {
    throw new Error("Insufficient balance.");
  }

  const tx: Transaction = {
    id: uuid(),
    type: input.type,
    account: input.account,
    amount,
    category: input.category,
    description: input.description,
    date: input.date || nowISO(),
    balanceAfter,
    refId: input.refId,
  };

  const next: SaveState = {
    ...state,
    player: { ...state.player },
    transactions: [tx, ...state.transactions].slice(0, 500),
  };
  if (input.account === "cash") {
    next.player.cash = balanceAfter;
  } else {
    next.player.bankBalance = balanceAfter;
  }
  next.player.updatedAt = nowISO();
  return next;
}

/* ------------------------------------------------------------------ */
/* Deposit / Withdraw                                                 */
/* ------------------------------------------------------------------ */

export function deposit(state: SaveState, amount: number): SaveState {
  amount = round2(amount);
  if (state.player.cash < amount) {
    throw new Error("Not enough cash to deposit.");
  }
  let next = applyTransaction(state, {
    type: "expense",
    account: "cash",
    amount,
    category: "Bank Transfer",
    description: "Deposit to bank",
  });
  next = applyTransaction(next, {
    type: "income",
    account: "bank",
    amount,
    category: "Bank Transfer",
    description: "Deposit from wallet",
  });
  return next;
}

export function withdraw(state: SaveState, amount: number): SaveState {
  amount = round2(amount);
  if (state.player.bankBalance < amount) {
    throw new Error("Not enough bank balance to withdraw.");
  }
  let next = applyTransaction(state, {
    type: "expense",
    account: "bank",
    amount,
    category: "Bank Transfer",
    description: "Withdrawal from bank",
  });
  next = applyTransaction(next, {
    type: "income",
    account: "cash",
    amount,
    category: "Bank Transfer",
    description: "Withdrawal to wallet",
  });
  return next;
}

/* ------------------------------------------------------------------ */
/* Loans                                                              */
/* Interest method (documented):
 *   Simple interest on the outstanding principal:
 *     annual interest = principal × annualRate
 *   Interest accrues daily: outstandingPrincipal × annualRate / 365 per day
 *   Total payable = principal + (principal × annualRate × termMonths / 12)
 *   Monthly installment = totalPayable / termMonths
 *
 * This is fictional game math, labeled as such in the UI.
 * ------------------------------------------------------------------ */

export function computeLoanTerms({
  principal,
  annualRate,
  termMonths,
}: {
  principal: number;
  annualRate: number;
  termMonths: number;
}) {
  principal = round2(principal);
  if (!isFinite(principal) || principal <= 0) {
    throw new Error("Loan amount must be greater than zero.");
  }
  if (!isFinite(annualRate) || annualRate < 0 || annualRate > 1) {
    throw new Error("Interest rate must be between 0 and 1 (e.g. 0.09 = 9%).");
  }
  if (!Number.isInteger(termMonths) || termMonths < 1 || termMonths > 360) {
    throw new Error("Term must be between 1 and 360 months.");
  }

  const totalInterest = round2(principal * annualRate * (termMonths / 12));
  const totalPayable = round2(principal + totalInterest);
  const monthlyInstallment = round2(totalPayable / termMonths);

  return { totalInterest, totalPayable, monthlyInstallment };
}

export function accrueLoanInterest(loan: Loan, asOf: string): Loan {
  const now = new Date(asOf).getTime();
  const last = new Date(loan.lastAccrualDate).getTime();
  const days = Math.max(0, (now - last) / DAY_MS);
  if (days <= 0) return loan;

  const dailyRate = loan.annualRate / 365;
  const accrued = round2(loan.outstandingPrincipal * dailyRate * days);

  const next: Loan = { ...loan };
  if (accrued > 0) {
    next.outstandingInterest = round2(loan.outstandingInterest + accrued);
  }
  next.lastAccrualDate = asOf;

  const due = new Date(loan.nextDueDate).getTime();
  if (now > due && next.outstandingPrincipal > 0) {
    next.status = "overdue";
  }
  return next;
}

export function createLoan(
  state: SaveState,
  amount: number,
  annualRate: number,
  termMonths: number
): SaveState {
  const terms = computeLoanTerms({ principal: amount, annualRate, termMonths });
  const startDate = nowISO();
  const nextDue = new Date();
  nextDue.setMonth(nextDue.getMonth() + 1);

  const loan: Loan = {
    id: uuid(),
    principal: round2(amount),
    annualRate,
    termMonths,
    outstandingPrincipal: round2(amount),
    outstandingInterest: 0,
    totalPayable: terms.totalPayable,
    monthlyInstallment: terms.monthlyInstallment,
    status: "active",
    startDate,
    lastAccrualDate: startDate,
    nextDueDate: nextDue.toISOString(),
    payments: [],
  };

  // Loan proceeds go to the bank as a liability — NOT as profit/income.
  let next = applyTransaction(state, {
    type: "loan",
    account: "bank",
    amount: round2(amount),
    category: "Loan",
    description: `Loan received — ${termMonths} months at ${(annualRate * 100).toFixed(0)}% p.a.`,
    refId: loan.id,
  });
  next = { ...next, loans: [...state.loans, loan] };
  next.player.updatedAt = nowISO();
  return next;
}

export function repayLoan(
  state: SaveState,
  loanId: string,
  amount: number,
  account: "cash" | "bank" = "bank"
): SaveState {
  amount = round2(amount);
  if (!isFinite(amount) || amount <= 0) {
    throw new Error("Repayment amount must be greater than zero.");
  }

  const loanIndex = state.loans.findIndex((l) => l.id === loanId);
  if (loanIndex === -1) throw new Error("Loan not found.");

  let loan = state.loans[loanIndex];
  loan = accrueLoanInterest(loan, nowISO());

  const accountBalance = account === "cash" ? state.player.cash : state.player.bankBalance;
  const totalOwed = loan.outstandingPrincipal + loan.outstandingInterest;
  if (accountBalance < amount) {
    throw new Error("Insufficient balance for repayment.");
  }
  if (amount > totalOwed) {
    throw new Error("Repayment exceeds amount owed.");
  }

  // Allocation: interest first, then principal.
  const interestPart = round2(Math.min(amount, loan.outstandingInterest));
  const principalPart = round2(amount - interestPart);

  let next = applyTransaction(state, {
    type: "repayment",
    account,
    amount,
    category: "Loan Repayment",
    description: `Repayment toward loan #${loanId.slice(0, 6)}`,
    refId: loanId,
  });

  const nextLoan: Loan = { ...loan };
  nextLoan.outstandingInterest = round2(loan.outstandingInterest - interestPart);
  nextLoan.outstandingPrincipal = round2(loan.outstandingPrincipal - principalPart);
  if (nextLoan.outstandingPrincipal <= 0) {
    nextLoan.status = "paid";
    nextLoan.outstandingPrincipal = 0;
    nextLoan.outstandingInterest = 0;
  } else {
    nextLoan.status = "active";
  }
  const due = new Date(nextLoan.nextDueDate);
  due.setMonth(due.getMonth() + 1);
  nextLoan.nextDueDate = due.toISOString();
  nextLoan.lastAccrualDate = nowISO();

  const payment: LoanPayment = {
    id: uuid(),
    date: nowISO(),
    amount,
    principalPart,
    interestPart,
    type: nextLoan.status === "paid" ? "early" : "installment",
  };
  nextLoan.payments = [...nextLoan.payments, payment];

  const nextLoans = [...state.loans];
  nextLoans[loanIndex] = nextLoan;
  next = { ...next, loans: nextLoans };
  next.player.updatedAt = nowISO();
  return next;
}

export function getMonthlySummary(state: SaveState) {
  const start = new Date();
  start.setDate(1);
  const month = state.transactions.filter((t) => new Date(t.date).getTime() >= start.getTime());
  const income = round2(
    month.filter((t) => t.type === "income" || t.type === "loan").reduce((s, t) => s + t.amount, 0)
  );
  const expense = round2(
    month.filter(
      (t) => t.type === "expense" || t.type === "repayment" || t.type === "purchase"
    ).reduce((s, t) => s + t.amount, 0)
  );
  return { income, expense, net: round2(income - expense), count: month.length };
}

/* ------------------------------------------------------------------ */
/* Inventory purchases                                                */
/* ------------------------------------------------------------------ */

export function purchaseItem(state: SaveState, catalogItem: CatalogItem): SaveState {
  const price = round2(catalogItem.price);
  if (state.player.cash < price) {
    throw new Error("Not enough cash to purchase this item.");
  }
  let next = applyTransaction(state, {
    type: "purchase",
    account: "cash",
    amount: price,
    category: catalogItem.category,
    description: `Purchased ${catalogItem.name}`,
  });
  const item: InventoryItem = {
    id: uuid(),
    catalogId: catalogItem.id,
    name: catalogItem.name,
    category: catalogItem.category,
    description: catalogItem.description,
    price,
    resaleValue: catalogItem.resaleValue,
    rarity: catalogItem.rarity,
    emoji: catalogItem.emoji,
    purchasedAt: nowISO(),
    placed: false,
  };
  next = { ...next, inventory: [...state.inventory, item] };
  next.player.updatedAt = nowISO();
  return next;
}

export function sellItem(state: SaveState, itemId: string): SaveState {
  const index = state.inventory.findIndex((i) => i.id === itemId);
  if (index === -1) throw new Error("Item not found.");
  const item = state.inventory[index];
  if (item.placed) {
    throw new Error("Remove the item from your home before selling it.");
  }
  const resale = item.resaleValue ?? round2(item.price * 0.5);
  let next = applyTransaction(state, {
    type: "sale",
    account: "cash",
    amount: round2(resale),
    category: item.category,
    description: `Sold ${item.name}`,
  });
  next = {
    ...next,
    inventory: state.inventory.filter((i) => i.id !== itemId),
  };
  next.player.updatedAt = nowISO();
  return next;
}

export function placeItem(
  state: SaveState,
  itemId: string,
  roomId: string,
  x: number,
  y: number
): SaveState {
  const index = state.inventory.findIndex((i) => i.id === itemId);
  if (index === -1) throw new Error("Item not found.");
  const item = state.inventory[index];
  if (item.placed) throw new Error("Item is already placed in a room.");
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room || !room.unlocked) throw new Error("Room not available.");

  const next: SaveState = {
    ...state,
    inventory: state.inventory.map((i) =>
      i.id === itemId ? { ...item, placed: true, roomId, x, y } : i
    ),
  };
  next.player.selectedRoom = roomId;
  next.player.updatedAt = nowISO();
  return next;
}

export function removeItem(state: SaveState, itemId: string): SaveState {
  const index = state.inventory.findIndex((i) => i.id === itemId);
  if (index === -1) throw new Error("Item not found.");
  const item = state.inventory[index];
  if (!item.placed) throw new Error("Item is not placed.");

  const next: SaveState = {
    ...state,
    inventory: state.inventory.map((i) =>
      i.id === itemId
        ? { ...item, placed: false, roomId: undefined, x: undefined, y: undefined }
        : i
    ),
  };
  next.player.updatedAt = nowISO();
  return next;
}

export function moveItem(
  state: SaveState,
  itemId: string,
  roomId: string,
  x: number,
  y: number
): SaveState {
  const index = state.inventory.findIndex((i) => i.id === itemId);
  if (index === -1) throw new Error("Item not found.");
  const item = state.inventory[index];
  if (!item.placed) throw new Error("Item is not placed.");
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error("Room not found.");

  const next: SaveState = {
    ...state,
    inventory: state.inventory.map((i) =>
      i.id === itemId ? { ...item, roomId, x, y } : i
    ),
  };
  next.player.selectedRoom = roomId;
  next.player.updatedAt = nowISO();
  return next;
}

export function getPlacedItems(state: SaveState, roomId: string): InventoryItem[] {
  return state.inventory.filter((i) => i.placed && i.roomId === roomId);
}

export function getInventoryValue(state: SaveState): number {
  return state.inventory.reduce(
    (sum, i) => sum + (i.resaleValue ?? i.price),
    0
  );
}
