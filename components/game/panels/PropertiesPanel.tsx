"use client";

import { useCallback } from "react";
import type { SaveState } from "@/lib/schema";
import { applyTransaction } from "@/lib/economy";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils";

interface PropertiesPanelProps {
  state: SaveState;
  onUpdate: (fn: (prev: SaveState) => SaveState) => void;
  onClose: () => void;
}

export default function PropertiesPanel({ state, onUpdate, onClose }: PropertiesPanelProps) {
  const handleBuyPlot = useCallback(
    (propertyId: string) => {
      const prop = state.properties.find((p) => p.id === propertyId);
      if (!prop || prop.status !== "available") return;
      if (state.player.cash < prop.price) {
        showToast({ kind: "error", message: "Not enough cash to purchase this plot" });
        return;
      }
      try {
        let next = applyTransaction(state, {
          type: "purchase",
          account: "cash",
          amount: prop.price,
          category: "Property",
          description: "Purchased " + prop.title,
        });
        next = {
          ...next,
          properties: next.properties.map((p) =>
            p.id === propertyId ? { ...p, status: "owned" as const, purchasedAt: new Date().toISOString() } : p
          ),
          player: { ...next.player, updatedAt: new Date().toISOString() },
        };
        onUpdate(() => next);
        showToast({ kind: "saved", message: "Plot purchased: " + prop.title });
      } catch (e) {
        showToast({ kind: "error", message: e instanceof Error ? e.message : "Purchase failed" });
      }
    },
    [state, onUpdate]
  );

  return (
    <Panel
      title="Properties"
      subtitle="Buy available plots to expand your estate. Construction and business placement come in future updates."
      open
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.properties.map((prop) => (
            <div key={prop.id} className="p-4 rounded-xl border border-zinc-700 bg-[#12141b] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-zinc-200">{prop.title}</div>
                <Badge variant={prop.status === "owned" ? "owned" : "available"}>
                  {prop.status}
                </Badge>
              </div>
              <div className="text-xs text-zinc-500 mb-2">{prop.description}</div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="text-zinc-500 block">Price</span>
                  <span className="font-mono text-zinc-200">{formatMoney(prop.price)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Est. value</span>
                  <span className="font-mono text-zinc-200">{formatMoney(prop.value)}</span>
                </div>
              </div>
              <div className="mt-auto">
                {prop.status === "available" ? (
                  <Button
                    disabled={state.player.cash < prop.price}
                    onClick={() => handleBuyPlot(prop.id)}
                    className="w-full text-[11px]"
                  >
                    Buy Plot
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full text-[11px] text-zinc-500">
                    Owned
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg border border-dashed border-zinc-700 bg-[#12141b]/40 text-xs text-zinc-500">
          Owned plots add to your net worth at their estimated value. Building on plots
          and placing businesses on land is planned for a future update.
        </div>
      </div>
    </Panel>
  );
}
