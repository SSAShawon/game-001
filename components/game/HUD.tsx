"use client";

import type { SaveState } from "@/lib/schema";
import { computeNetWorth, formatMoney } from "@/lib/utils";

interface HUDProps {
  state: SaveState;
}

export default function HUD({ state }: HUDProps) {
  const netWorth = computeNetWorth(state);
  const loanTotal = state.loans.reduce(
    (sum, l) => sum + l.outstandingPrincipal + l.outstandingInterest,
    0
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-20 pt-3 pb-2">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-glacial via-orchid to-lavender flex items-center justify-center text-black font-bold shadow-lg shadow-game">
              L
            </div>
            <div>
              <div className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">
                LIFE LEAD
              </div>
              <div className="text-sm font-semibold text-zinc-100">
                {state.player.name}
              </div>
            </div>
          </div>
          <div className="flex gap-3 md:gap-5">
            <Stat label="Cash" value={formatMoney(state.player.cash)} accent="text-orchid" />
            <Stat label="Bank" value={formatMoney(state.player.bankBalance)} accent="text-glacial" />
            <Stat label="Net Worth" value={formatMoney(netWorth)} accent="text-lavender" />
            <Stat label="Liabilities" value={formatMoney(loanTotal)} accent="text-zinc-300" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-700 bg-[#12141b]/60 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-zinc-400">Auto-save {state.player.settings.autoSave ? "on" : "off"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono font-semibold text-xs ${accent}`}>{value}</span>
      </div>
    </div>
  );
}
