"use client";

import { useCallback, useState } from "react";
import type { SaveState, CatalogItem } from "@/lib/schema";
import { purchaseItem, sellItem } from "@/lib/economy";
import { CATALOG, getCatalogItem } from "@/lib/catalog";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils";

interface InventoryPanelProps {
  state: SaveState;
  onUpdate: (fn: (prev: SaveState) => SaveState) => void;
  onClose: () => void;
}

const TABS: { id: string; label: string }[] = [
  { id: "inventory", label: "Inventory" },
  { id: "market", label: "Market (Buy)" },
  { id: "collection", label: "Collection" },
];

const CATEGORY_KEYS: string[] = [
  "watches",
  "hotWheels",
  "gamingGear",
  "pcsTech",
  "sneakers",
  "perfumes",
  "books",
  "figuresModels",
  "footballMemorabilia",
  "trophiesMedals",
  "musicCollectibles",
  "photography",
  "motorcyclesMini",
  "sunglasses",
  "coinsCurrency",
  "stationery",
  "tradingCards",
  "artPosters",
  "buildingSets",
  "travelSouvenirs",
];

export default function InventoryPanel({ state, onUpdate, onClose }: InventoryPanelProps) {
  const [tab, setTab] = useState("inventory");
  const [filter, setFilter] = useState("all");

  const ownedIds = new Set(state.inventory.map((i) => i.catalogId));

  const handleBuy = useCallback(
    (catalogId: string) => {
      const item = getCatalogItem(catalogId);
      if (!item) return;
      try {
        onUpdate((prev) => purchaseItem(prev, item));
        showToast({ kind: "saved", message: `Purchased ${item.name}` });
      } catch (e) {
        showToast({ kind: "error", message: e instanceof Error ? e.message : "Purchase failed" });
      }
    },
    [onUpdate]
  );

  const handleSell = useCallback(
    (itemId: string) => {
      if (!window.confirm("Sell this item? You will receive its resale value.")) return;
      try {
        onUpdate((prev) => sellItem(prev, itemId));
        showToast({ kind: "saved", message: "Item sold" });
      } catch (e) {
        showToast({ kind: "error", message: e instanceof Error ? e.message : "Sale failed" });
      }
    },
    [onUpdate]
  );

  const inventoryItems = state.inventory.filter(
    (i) => filter === "all" || i.category === filter
  );

  const catalogByCategory: Record<string, CatalogItem[]> = {};
  CATALOG.forEach((c) => {
    if (!catalogByCategory[c.category]) catalogByCategory[c.category] = [];
    catalogByCategory[c.category].push(c);
  });

  const collectionProgress = CATEGORY_KEYS.map((cat) => {
    const total = (catalogByCategory[cat] ?? []).length;
    const owned = state.inventory.filter((i) => i.category === cat).length;
    return { cat, total, owned, pct: total === 0 ? 0 : Math.round((owned / total) * 100) };
  });

  const totalOwnedValue = state.inventory.reduce(
    (sum, i) => sum + (i.resaleValue ?? i.price),
    0
  );

  return (
    <Panel
      title="Inventory & Collections"
      subtitle="Buy collectibles from the market, keep them in inventory, and place them in your home."
      open
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                tab === t.id
                  ? "bg-glacial text-black border-glacial"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "inventory" && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:w-64 flex-shrink-0">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Category</div>
              <div className="space-y-1">
                {["all", ...CATEGORY_KEYS].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      filter === c
                        ? "bg-glacial/20 text-glacial"
                        : "text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    {c === "all" ? "All" : c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              {inventoryItems.length === 0 ? (
                <div className="py-8 rounded-lg border border-dashed border-zinc-700 text-center text-zinc-500 text-sm">
                  No items here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inventoryItems.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border border-zinc-700 bg-[#12141b] flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{item.emoji}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-zinc-200">{item.name}</div>
                          <div className="text-xs text-zinc-500">{item.category}</div>
                        </div>
                        <Badge variant={item.rarity}>{item.rarity}</Badge>
                      </div>
                      <div className="text-xs text-zinc-400">{item.purchasedAt.slice(0, 10)}</div>
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="outline" onClick={() => handleSell(item.id)} className="flex-1 text-[11px]">
                          Sell
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "market" && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">Browse the catalog and purchase items with cash.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATALOG.filter((c) => !ownedIds.has(c.id)).map((item) => (
                <div key={item.id} className="p-3 rounded-lg border border-zinc-700 bg-[#12141b] flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-200">{item.name}</div>
                      <div className="text-xs text-zinc-500">{item.category}</div>
                    </div>
                    <Badge variant={item.rarity}>{item.rarity}</Badge>
                  </div>
                  <div className="text-xs text-zinc-400">{item.description}</div>
                  <div className="mt-auto flex items-baseline gap-1">
                    <span className="font-mono font-semibold text-sm text-zinc-100">{formatMoney(item.price)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="success"
                    disabled={state.player.cash < item.price}
                    onClick={() => handleBuy(item.id)}
                    className="w-full text-[11px]"
                  >
                    {state.player.cash < item.price ? "Not enough cash" : "Buy"}
                  </Button>
                </div>
              ))}
            </div>
            {CATALOG.filter((c) => !ownedIds.has(c.id)).length === 0 && (
              <div className="py-4 rounded-lg border border-dashed border-zinc-700 bg-[#12141b]/40 text-center text-zinc-500 text-sm">
                You already own every catalog item!
              </div>
            )}
          </div>
        )}

        {tab === "collection" && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Collection progress across all {CATALOG.length} catalog items.
              Total estimated value {formatMoney(totalOwnedValue)}.
            </p>
            <div className="space-y-2">
              {collectionProgress.map((entry) => (
                <div key={entry.cat} className="p-3 rounded-lg border border-zinc-700 bg-[#12141b]">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="font-medium text-zinc-200">{entry.cat}</span>
                    <span className="text-xs text-zinc-400">{entry.owned} / {entry.total}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-glacial transition-all duration-500"
                      style={{ width: Math.min(100, entry.pct) + "%" }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {entry.pct}% complete
                  </div>
                </div>
              ))}
              <div className="pt-2 text-xs text-zinc-500">
                Total owned: {state.inventory.length} / {CATALOG.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
