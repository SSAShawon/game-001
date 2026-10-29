"use client";

import type { SaveState, Business } from "@/lib/schema";
import { getMonthlySummary } from "@/lib/economy";
import { getBusinessSummary } from "@/lib/business";
import { computeNetWorth } from "@/lib/utils";
import { Panel } from "@/components/ui/panel";
import { formatMoney } from "@/lib/utils";

interface FinancialPanelProps {
  state: SaveState;
  onClose: () => void;
}

export default function FinancialPanel({ state, onClose }: FinancialPanelProps) {
  const netWorth = computeNetWorth(state);
  const summaries = getBusinessSummary(state);
  const summary = getMonthlySummary(state);
  const businessCash = state.businesses.reduce((s, b) => s + b.cash, 0);
  const inventoryValue = state.inventory.reduce(
    (s, i) => s + (i.resaleValue ?? i.price),
    0
  );
  const propertyValue = state.properties.reduce(
    (s, p) => (p.status === "owned" ? s + p.value : s),
    0
  );
  const liability = state.loans.reduce(
    (s, l) => s + l.outstandingPrincipal + l.outstandingInterest,
    0
  );

  return (
    <Panel
      title="Financial Overview"
      subtitle="A snapshot of your virtual finances. All amounts are virtual game currency (৳)."
      open
      onClose={onClose}
    >
      <div className="space-y-5">
        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Cash (Wallet)" value={formatMoney(state.player.cash)} accent="text-orchid" />
          <StatCard label="Bank Balance" value={formatMoney(state.player.bankBalance)} accent="text-glacial" />
          <StatCard label="Business Cash" value={formatMoney(businessCash)} accent="text-zinc-200" />
          <StatCard label="Net Worth" value={formatMoney(netWorth)} accent="text-lavender" />
        </div>

        {/* Monthly summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Income (This Month)</div>
            <div className="text-lg font-mono text-[#4ade80]">{formatMoney(summary.income)}</div>
          </div>
          <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Expenses (This Month)</div>
            <div className="text-lg font-mono text-[#f48fb1]">{formatMoney(summary.expense)}</div>
          </div>
          <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Net (This Month)</div>
            <div className={`text-lg font-mono ${summary.net >= 0 ? "text-[#4ade80]" : "text-[#f48fb1]"}`}>
              {formatMoney(summary.net)}
            </div>
          </div>
        </div>

        {/* Net worth breakdown */}
        <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Net Worth Breakdown</h3>
          <div className="space-y-2">
            <BreakdownRow label="Wallet (Cash)" value={state.player.cash} />
            <BreakdownRow label="Bank Balance" value={state.player.bankBalance} />
            <BreakdownRow label="Business Cash" value={businessCash} />
            <BreakdownRow label="Inventory (estimated)" value={inventoryValue} />
            <BreakdownRow label="Properties (owned)" value={propertyValue} />
            <BreakdownRow label="Loans & Interest" value={-liability} negative />
            <div className="border-t border-zinc-700 pt-2">
              <div className="flex justify-between text-sm font-mono text-zinc-100">
                <span>Total Net Worth</span>
                <span>{formatMoney(netWorth)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business performance */}
        <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Business Performance</h3>
          {state.businesses.length === 0 ? (
            <p className="text-xs text-zinc-500">No businesses yet.</p>
          ) : (
            <div className="space-y-2">
              {state.businesses.map((b) => {
                const net = (summaries.find((x: Business) => x.id === b.id)?.monthlyEstimate) ?? 0;
                return (
                  <div key={b.id} className="flex items-center justify-between text-xs p-2 rounded-lg border border-zinc-800 bg-[#12141b]/50">
                    <div>
                      <div className="text-zinc-200 font-medium">{b.name}</div>
                      <div className="text-[10px] text-zinc-500">Level {b.level} • {b.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-zinc-200">{formatMoney(b.cash)}</div>
                      <div className={`text-[10px] ${net >= 0 ? "text-[#4ade80]" : "text-[#f48fb1]"}`}>
                        Est. monthly net: {formatMoney(net)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Loans */}
        <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Loans</h3>
          {state.loans.length === 0 ? (
            <p className="text-xs text-zinc-500">No loans.</p>
          ) : (
            <div className="space-y-2">
              {state.loans.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-xs p-2 rounded-lg border border-zinc-800 bg-[#12141b]/50">
                  <div>
                    <div className="text-zinc-200 font-medium">Loan #{l.id.slice(0, 6)}</div>
                    <div className="text-[10px] text-zinc-500">{l.termMonths} months • {l.annualRate * 100}% p.a.</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-zinc-200">{formatMoney(l.outstandingPrincipal + l.outstandingInterest)}</div>
                    <div className="text-[10px] text-zinc-500">outstanding</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="p-3 rounded-xl border border-zinc-700 bg-[#12141b]">
      <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">{label}</div>
      <div className={`font-mono font-semibold text-sm ${accent}`}>{value}</div>
    </div>
  );
}

function BreakdownRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className={`font-mono ${negative ? "text-[#f48fb1]" : "text-zinc-200"}`}>
        {formatMoney(value)}
      </span>
    </div>
  );
}
