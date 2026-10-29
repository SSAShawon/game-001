"use client";

import { useCallback, useState } from "react";
import type { SaveState } from "@/lib/schema";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils";

interface DreamsPanelProps {
  state: SaveState;
  onUpdate: (fn: (prev: SaveState) => SaveState) => void;
  onClose: () => void;
}

export default function DreamsPanel({ state, onUpdate, onClose }: DreamsPanelProps) {
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    category: "Personal",
    budget: "",
    emoji: "⭐",
  });

  const handleAddDream = useCallback(() => {
    if (!draft.title.trim()) {
      showToast({ kind: "error", message: "Title is required" });
      return;
    }
    const budget = Number(draft.budget);
    const next: SaveState = {
      ...state,
      dreams: [
        ...state.dreams,
        {
          id: "dream-" + Date.now(),
          title: draft.title.trim(),
          description: draft.description.trim(),
          category: draft.category,
          budget: Number.isFinite(budget) && budget > 0 ? budget : undefined,
          emoji: draft.emoji || "⭐",
          status: "planning",
          progress: 0,
          milestones: [],
          notes: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
    next.player.updatedAt = new Date().toISOString();
    onUpdate(() => next);
    setDraft({ title: "", description: "", category: "Personal", budget: "", emoji: "⭐" });
    showToast({ kind: "saved", message: "Dream added" });
  }, [draft, state, onUpdate]);

  const handleToggleStatus = useCallback(
    (dreamId: string) => {
      const dream = state.dreams.find((d) => d.id === dreamId);
      if (!dream) return;
      const next: SaveState = {
        ...state,
        dreams: state.dreams.map((d) =>
          d.id === dreamId
            ? {
                ...d,
                status:
                  d.status === "active" ? "achieved" : d.status === "achieved" ? "paused" : "active",
                progress:
                  d.status === "active" ? 100 : d.status === "achieved" ? d.progress : 0,
                updatedAt: new Date().toISOString(),
              }
            : d
        ),
      };
      next.player.updatedAt = new Date().toISOString();
      onUpdate(() => next);
    },
    [state, onUpdate]
  );

  const handleToggleMilestone = useCallback(
    (dreamId: string, milestoneId: string) => {
      const next: SaveState = {
        ...state,
        dreams: state.dreams.map((d) => {
          if (d.id !== dreamId) return d;
          const milestones = d.milestones.map((m) =>
            m.id === milestoneId ? { ...m, done: !m.done } : m
          );
          const progress = Math.round(
            (milestones.filter((m) => m.done).length / Math.max(1, milestones.length)) * 100
          );
          return { ...d, milestones, progress, updatedAt: new Date().toISOString() };
        }),
      };
      next.player.updatedAt = new Date().toISOString();
      onUpdate(() => next);
    },
    [state, onUpdate]
  );

  return (
    <Panel
      title="Dreams & Wishlist"
      subtitle="Personal aspirations — kept separate from the virtual economy unless you connect them to an in-game goal."
      open
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Add a Dream</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Buy a gaming PC"
            />
            <Input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="Category"
            />
            <Input
              value={draft.budget}
              onChange={(e) => setDraft({ ...draft, budget: e.target.value })}
              placeholder="Estimated budget"
              className="font-mono"
            />
          </div>
          <div className="mt-2">
            <label className="block text-xs text-zinc-400 mb-1">Description</label>
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Why does this matter to you?"
            />
          </div>
          <Button onClick={handleAddDream} className="mt-3">Add Dream</Button>
        </div>

        <div className="space-y-3">
          {state.dreams.length === 0 ? (
            <p className="text-xs text-zinc-500">No dreams yet. Add your first aspiration.</p>
          ) : (
            state.dreams.map((dream) => (
              <div key={dream.id} className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{dream.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold text-zinc-200">{dream.title}</div>
                      <div className="text-xs text-zinc-500">
                        {dream.category} • {dream.status}
                      </div>
                    </div>
                    <Badge
                      variant={
                        dream.status === "achieved"
                          ? "active"
                          : dream.status === "paused"
                            ? "closed"
                            : "default"
                      }
                    >
                      {dream.status}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleToggleStatus(dream.id)}>
                    {dream.status === "achieved" ? "Reopen" : "Mark"}
                  </Button>
                </div>
                {dream.description && (
                  <div className="text-xs text-zinc-400 mb-2">{dream.description}</div>
                )}
                {dream.budget !== undefined && (
                  <div className="text-xs text-zinc-400 mb-3">
                    Estimated budget: {formatMoney(dream.budget)}
                  </div>
                )}
                <div className="w-full bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className="h-full bg-orchid transition-all duration-500"
                    style={{ width: dream.progress + "%" }}
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-3">
                  <span>{dream.progress}% progress</span>
                </div>
                <div className="space-y-1">
                  {dream.milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={m.done}
                        onChange={() => handleToggleMilestone(dream.id, m.id)}
                        className="rounded border-zinc-600 text-glacial focus:ring-glacial"
                      />
                      <span className={m.done ? "line-through text-zinc-500" : "text-zinc-300"}>
                        {m.title}
                      </span>
                    </div>
                  ))}
                  <div className="mt-2">
                    <label className="block text-[10px] text-zinc-500 mb-1">Add milestone</label>
                    <Input
                      placeholder="Milestone title"
                      className="h-8 text-xs"
                      onChange={(e) => {
                        const title = e.target.value;
                        if (!title) return;
                        const next: SaveState = {
                          ...state,
                          dreams: state.dreams.map((d) =>
                            d.id === dream.id
                              ? {
                                  ...d,
                                  milestones: [
                                    ...d.milestones,
                                    { id: "m-" + Date.now(), title, done: false },
                                  ],
                                }
                              : d
                          ),
                        };
                        next.player.updatedAt = new Date().toISOString();
                        onUpdate(() => next);
                      }}
                    />
                  </div>
                </div>
                {dream.notes && (
                  <div className="mt-3 text-[10px] text-zinc-500 italic">{dream.notes}</div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="p-3 rounded-lg border border-dashed border-zinc-700 bg-[#12141b]/40 text-xs text-zinc-500">
          Dreams are personal planning records. They do not affect your virtual cash, bank,
          or businesses unless you explicitly record a connected purchase yourself.
        </div>
      </div>
    </Panel>
  );
}
