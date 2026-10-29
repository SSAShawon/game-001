"use client";

import { useCallback, useState } from "react";
import type { SaveState, BusinessType } from "@/lib/schema";
import {
  startBusiness,
  collectRevenue,
  toggleBusiness,
  upgradeBusiness,
  transferBusinessCash,
  BUSINESS_CONFIGS,
} from "@/lib/business";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils";

interface BusinessesPanelProps {
  state: SaveState;
  onUpdate: (fn: (prev: SaveState) => SaveState) => void;
  onClose: () => void;
  selectedBusinessId?: string | null;
}

export default function BusinessesPanel({ state, onUpdate, onClose, selectedBusinessId }: BusinessesPanelProps) {
  const [payout, setPayout] = useState<{ businessId: string | null; amount: string; to: "cash" | "bank" }>({
    businessId: null,
    amount: "",
    to: "bank",
  });

  const businessesByType: Record<string, typeof state.businesses[number] | undefined> = {};
  state.businesses.forEach((b) => { businessesByType[b.type] = b; });

  const handleStart = useCallback(
    (type: BusinessType) => {
      try {
        const next = startBusiness(state, type);
        onUpdate(() => next);
        showToast({ kind: "saved", message: "Business started" });
      } catch (e) {
        showToast({ kind: "error", message: e instanceof Error ? e.message : "Failed to start business" });
      }
    },
    [state, onUpdate]
  );

  const handleCollect = useCallback(
    (businessId: string) => {
      try {
        const next = collectRevenue(state, businessId);
        onUpdate(() => next);
        showToast({ kind: "saved", message: "Revenue collected" });
      } catch (e) {
        showToast({ kind: "error", message: e instanceof Error ? e.message : "Collection failed" });
      }
    },
    [state, onUpdate]
  );

  const handleToggle = useCallback(
    (businessId: string) => {
      try {
        const next = toggleBusiness(state, businessId);
        onUpdate(() => next);
        showToast({ kind: "saved", message: "Business status updated" });
      } catch (e) {
        showToast({ kind: "error", message: e instanceof Error ? e.message : "Failed" });
      }
    },
    [state, onUpdate]
  );

  const handleUpgrade = useCallback(
    (businessId: string) => {
      try {
        const next = upgradeBusiness(state, businessId);
        onUpdate(() => next);
        showToast({ kind: "saved", message: "Business upgraded" });
      } catch (e) {
        showToast({ kind: "error", message: e instanceof Error ? e.message : "Upgrade failed" });
      }
    },
    [state, onUpdate]
  );

  const handlePayout = useCallback(() => {
    if (!payout.businessId) return;
    const amount = Number(payout.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast({ kind: "error", message: "Enter a valid amount" });
      return;
    }
    try {
      const next = transferBusinessCash(state, payout.businessId, amount, payout.to);
      onUpdate(() => next);
      setPayout({ businessId: null, amount: "", to: "bank" });
      showToast({ kind: "saved", message: "Payout sent" });
    } catch (e) {
      showToast({ kind: "error", message: e instanceof Error ? e.message : "Payout failed" });
    }
  }, [payout, state, onUpdate]);

  return (
    <Panel
      title="Businesses"
      subtitle="Start businesses, collect revenue, upgrade, and pay yourself. All values are fictional game settings."
      open
      onClose={onClose}
    >
      <div className="space-y-5">
        {[
          { id: "footballTurf" as const, order: 1 },
          { id: "foodCourt" as const, order: 2 },
          { id: "gamingCafe" as const, order: 3 },
        ].sort((a, b) => a.order - b.order).map(({ id }) => {
          const config = BUSINESS_CONFIGS[id];
          const business = businessesByType[id];
          const highlighted = selectedBusinessId === id;
          if (!business) {
            return (
              <div key={id} className={`p-4 rounded-xl border border-zinc-700 bg-[#12141b] ${highlighted ? "ring-2 ring-glacial" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-lg font-semibold text-zinc-200">{config.name}</div>
                    <div className="text-xs text-zinc-500">{config.description}</div>
                  </div>
                  <Badge variant="locked">Locked</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-400">
                    Startup cost: {formatMoney(config.startupCost)}
                  </div>
                  <Button
                    disabled={state.player.cash < config.startupCost}
                    onClick={() => handleStart(id)}
                    className="flex-1 md:flex-none md:w-32"
                  >
                    Start Business
                  </Button>
                </div>
              </div>
            );
          }

          const netPerHour = config.baseHourlyRate * config.utilization - config.operatingCostPerHour;
const upgrade = config.upgradeLevels.find((u) => u.level === business.level + 1);
          return (
            <div key={id} className={`p-4 rounded-xl border border-zinc-700 bg-[#12141b] ${highlighted ? "ring-2 ring-glacial shadow-[0_0_20px_rgba(130,217,245,0.25)]" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold text-zinc-200">{config.name}</div>
                    <Badge variant={business.status === "operating" ? "active" : "closed"}>
                      {business.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-500">Level {business.level} • {config.description.split(".")[0]}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                <div>
                  <span className="text-zinc-500 block">Business cash</span>
                  <span className="font-mono text-zinc-200">{formatMoney(business.cash)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Net / hour</span>
                  <span className={`font-mono text-sm ${netPerHour >= 0 ? "text-[#4ade80]" : "text-[#f48fb1]"}`}>
                    {formatMoney(netPerHour)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Monthly est.</span>
                  <span className="font-mono text-zinc-200">{formatMoney(Math.max(0, netPerHour) * 24 * 30)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Invested</span>
                  <span className="font-mono text-zinc-200">{formatMoney(business.totalInvested)}</span>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <Button
                  size="sm"
                  variant={business.status === "operating" ? "outline" : "success"}
                  onClick={() => handleToggle(business.id)}
                >
                  {business.status === "operating" ? "Close" : "Open"}
                </Button>
                <Button size="sm" onClick={() => handleCollect(business.id)} className="flex-1">
                  Collect Revenue
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!upgrade}
                  onClick={() => handleUpgrade(business.id)}
                >
                  Upgrade
                </Button>
              </div>
              {upgrade ? (
                <div className="text-[10px] text-zinc-500 mb-3">
                  Next upgrade: {formatMoney(upgrade.cost)}
                </div>
              ) : (
                <div className="text-[10px] text-zinc-500 mb-3">Max level reached.</div>
              )}
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">Payout to yourself</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={payout.businessId === business.id ? payout.amount : ""}
                    onChange={(e) =>
                      setPayout({ businessId: business.id, amount: e.target.value, to: payout.to })
                    }
                    placeholder="Amount"
                    className="h-8 text-xs flex-1"
                  />
                  <select
                    value={payout.businessId === business.id ? payout.to : "bank"}
                    onChange={(e) =>
                      setPayout({ businessId: business.id, amount: payout.amount, to: e.target.value as "cash" | "bank" })
                    }
                    className="h-8 text-xs rounded-md border border-zinc-600 bg-[#12141b] px-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-glacial"
                  >
                    <option value="bank">Bank</option>
                    <option value="cash">Wallet</option>
                  </select>
                  <Button
                    size="sm"
                    disabled={payout.businessId !== business.id}
                    onClick={handlePayout}
                    className="text-[11px] px-3"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        <div className="p-3 rounded-lg border border-dashed border-zinc-700 bg-[#12141b]/40 text-xs text-zinc-500">
          Revenue is estimated from fictional utilization rates and accrues while a business is operating.
          Collect revenue to bank it; operating costs are deducted automatically.
        </div>
      </div>
    </Panel>
  );
}
