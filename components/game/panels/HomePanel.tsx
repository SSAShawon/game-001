"use client";

import { useCallback, useState } from "react";
import type { SaveState } from "@/lib/schema";
import { placeItem, removeItem, moveItem, getPlacedItems } from "@/lib/economy";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils";

interface HomePanelProps {
  state: SaveState;
  onUpdate: (fn: (prev: SaveState) => SaveState) => void;
  onClose: () => void;
  initialRoom?: string | null;
}

const ROOM_ORDER = ["bedroom", "gaming", "collection", "library", "garage"];

export default function HomePanel({ state, onUpdate, onClose, initialRoom }: HomePanelProps) {
  const [roomId, setRoomId] = useState(initialRoom || state.player.selectedRoom || "bedroom");
  const [moveItemId, setMoveItemId] = useState<string | null>(null);
  const [moveX, setMoveX] = useState("");
  const [moveY, setMoveY] = useState("");

  const room = state.rooms.find((r) => r.id === roomId);
  const placed = getPlacedItems(state, roomId);
  const unplaced = state.inventory.filter((i) => !i.placed);

  const handlePlace = useCallback(
    (item: typeof unplaced[number]) => {
      const nextX = placed.length * 32 + 20;
      const nextY = placed.length * 32 + 20;
      try {
        onUpdate((prev) => placeItem(prev, item.id, roomId, nextX, nextY));
        showToast({ kind: "saved", message: `${item.name} placed in ${room?.name}` });
      } catch (e) {
        showToast({ kind: "error", message: e instanceof Error ? e.message : "Failed to place item" });
      }
    },
    [room, roomId, placed.length, onUpdate]
  );

  const handleRemove = useCallback(
    (item: typeof placed[number]) => {
      try {
        onUpdate((prev) => removeItem(prev, item.id));
        showToast({ kind: "saved", message: `${item.name} returned to inventory` });
      } catch (e) {
        showToast({ kind: "error", message: e instanceof Error ? e.message : "Failed to remove item" });
      }
    },
    [onUpdate]
  );

  const handleMove = useCallback(
    (item: typeof placed[number]) => {
      setMoveItemId(item.id);
      setMoveX(String(item.x ?? 0));
      setMoveY(String(item.y ?? 0));
    },
    []
  );

  const handleApplyMove = useCallback(() => {
    if (!moveItemId) return;
    const x = Number(moveX);
    const y = Number(moveY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      showToast({ kind: "error", message: "Enter valid coordinates" });
      return;
    }
    try {
      const item = state.inventory.find((i) => i.id === moveItemId);
      if (!item) return;
      onUpdate((prev) => moveItem(prev, moveItemId, item.roomId!, x, y));
      setMoveItemId(null);
      showToast({ kind: "saved", message: "Item moved" });
    } catch (e) {
      showToast({ kind: "error", message: e instanceof Error ? e.message : "Failed to move item" });
    }
  }, [moveItemId, moveX, moveY, state.inventory, onUpdate]);

  return (
    <Panel
      title="My Home"
      subtitle="Purchase items from the Shopping Area, then place them in your rooms. Layouts are saved locally."
      open
      onClose={onClose}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Room selector */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Rooms</div>
          <div className="flex flex-col gap-1">
            {ROOM_ORDER.map((id) => {
              const r = state.rooms.find((room) => room.id === id);
              if (!r) return null;
              const active = roomId === id;
              return (
                <button
                  key={id}
                  onClick={() => setRoomId(id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors border ${
                    active
                      ? "bg-glacial/20 border-glacial text-glacial"
                      : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: r.color + "22" }}>
                    <span className="text-[10px] font-bold" style={{ color: r.color }}>
                      {r.name.charAt(0)}
                    </span>
                  </span>
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>
          {room && (
            <div className="mt-4 p-3 rounded-lg border border-zinc-700 bg-[#12141b]/50 text-sm">
              <div className="text-xs text-zinc-500 mb-1">{room.name.toUpperCase()}</div>
              <div className="text-zinc-300">{room.description}</div>
              <div className="mt-2 text-xs text-zinc-500">
                {placed.length} object{placed.length !== 1 ? "s" : ""} placed
              </div>
            </div>
          )}
        </div>

        {/* Placed objects */}
        <div className="lg:col-span-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-200">Placed in {room?.name}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {placed.length === 0 ? (
              <div className="col-span-3 py-6 rounded-lg border border-dashed border-zinc-700 bg-[#12141b]/40 text-center text-zinc-500 text-sm">
                Empty room. Place items from your inventory on the right.
              </div>
            ) : (
              placed.map((item) => (
                <div key={item.id} className="p-3 rounded-lg border border-zinc-700 bg-[#12141b] flex flex-col items-center gap-2">
                  <div className="text-3xl">{item.emoji}</div>
                  <div className="text-xs font-medium text-zinc-200 truncate w-full text-center">{item.name}</div>
                  <div className="text-[10px] text-zinc-500">({Math.round(item.x ?? 0)}, {Math.round(item.y ?? 0)})</div>
                  <div className="flex gap-1 w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMove(item)}
                      className="flex-1 text-[11px] px-2"
                    >
                      Move
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemove(item)}
                      className="flex-1 text-[11px] px-2"
                    >
                      Remove
                    </Button>
                  </div>
                  {moveItemId === item.id && (
                    <div className="flex gap-1 w-full mt-2">
                      <Input
                        value={moveX}
                        onChange={(e) => setMoveX(e.target.value)}
                        placeholder="X"
                        className="h-8 text-xs flex-1"
                      />
                      <Input
                        value={moveY}
                        onChange={(e) => setMoveY(e.target.value)}
                        placeholder="Y"
                        className="h-8 text-xs flex-1"
                      />
                      <Button size="sm" variant="success" onClick={handleApplyMove} className="text-[11px]">
                        Apply
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unplaced inventory */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-200">Unplaced Items</h3>
          </div>
          <div className="space-y-2">
            {unplaced.length === 0 ? (
              <div className="py-4 rounded-lg border border-dashed border-zinc-700 bg-[#12141b]/40 text-center text-zinc-500 text-sm">
                No unplaced items. Visit the Shopping Area to buy collectibles.
              </div>
            ) : (
              unplaced.map((item) => (
                <div key={item.id} className="p-3 rounded-lg border border-zinc-700 bg-[#12141b] flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-200">{item.name}</div>
                      <div className="text-xs text-zinc-500">{item.category}</div>
                    </div>
                    <Badge variant={item.rarity}>{item.rarity}</Badge>
                  </div>
                  <div className="text-xs text-zinc-400">{formatMoney(item.price)}</div>
                  <Button size="sm" variant="accent" onClick={() => handlePlace(item)} className="w-full text-[11px]">
                    Place in {room?.name}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
