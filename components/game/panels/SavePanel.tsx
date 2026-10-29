"use client";

import { useCallback } from "react";
import type { SaveState } from "@/lib/schema";
import { saveGame, exportBackupToFile, importBackupFromFile } from "@/lib/db";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";

interface SavePanelProps {
  state: SaveState;
  onUpdate: (fn: (prev: SaveState) => SaveState) => void;
  onClose: () => void;
}

export default function SavePanel({ state, onUpdate, onClose }: SavePanelProps) {
  const handleSaveNow = useCallback(async () => {
    try {
      await saveGame(state);
      showToast({ kind: "saved", message: "Game saved locally (IndexedDB)" });
    } catch (e) {
      showToast({
        kind: "error",
        message: e instanceof Error ? e.message : "Save failed",
      });
    }
  }, [state]);

  const handleExport = useCallback(async () => {
    try {
      await exportBackupToFile();
      showToast({ kind: "saved", message: "Backup exported as JSON" });
    } catch (e) {
      showToast({ kind: "error", message: e instanceof Error ? e.message : "Export failed" });
    }
  }, []);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const result = await importBackupFromFile(file);
        if (!result.valid || !result.state) {
          showToast({
            kind: "error",
            message: "Invalid backup: " + result.errors.join("; "),
          });
          return;
        }
        const imported = result.state;
        onUpdate(() => imported);
        showToast({ kind: "saved", message: "Backup imported and applied" });
      } catch (err) {
        showToast({
          kind: "error",
          message: err instanceof Error ? err.message : "Import failed",
        });
      }
      e.target.value = "";
    },
    [onUpdate]
  );

  const handleToggleAutoSave = useCallback(() => {
    onUpdate((prev) => {
      const next = { ...prev };
      next.player.settings.autoSave = !next.player.settings.autoSave;
      next.player.updatedAt = new Date().toISOString();
      return next;
    });
  }, [onUpdate]);

  return (
    <Panel
      title="Save & Backup Settings"
      subtitle="Your game is saved locally in your browser's IndexedDB — no account or internet needed."
      open
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">How saving works</h3>
          <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4">
            <li>
              Changes save automatically to <b>IndexedDB</b> on your PC (a subtle indicator shows when saving).
            </li>
            <li>
              Your progress returns when you reopen the game — even after closing the browser.
            </li>
            <li>
              Use <b>Export Backup</b> to download a JSON file you can keep somewhere safe.
              Use <b>Import Backup</b> to restore it (backups are validated before being applied).
            </li>
            <li className="text-orchid/70">
              <b>Important:</b> Browser data clearing, browser profiles, or using another
              device can affect or lose local saves. Export backups regularly.
            </li>
          </ul>
        </div>

        <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Settings</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Auto-save</span>
            <Button
              size="sm"
              variant={state.player.settings.autoSave ? "accent" : "outline"}
              onClick={handleToggleAutoSave}
            >
              {state.player.settings.autoSave ? "On" : "Off"}
            </Button>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Default virtual currency: Bangladeshi Taka (৳) — entirely fictional game money.
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={handleSaveNow} className="w-full">
              Save Now
            </Button>
            <Button variant="outline" onClick={handleExport} className="w-full">
              Export Backup
            </Button>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="w-full" onClick={() => {
                const input = document.getElementById("import-file") as HTMLInputElement | null;
                input?.click();
              }}>
                Import Backup
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-dashed border-zinc-700 bg-[#12141b]/40 text-xs text-zinc-500">
          Where is data stored? IndexedDB is managed by your browser — there is no single
          file you can copy. This is why exported backups matter.
        </div>
      </div>
    </Panel>
  );
}
