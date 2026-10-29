"use client";

import { useCallback, useEffect, useState } from "react";
import { loadGame, saveGame } from "@/lib/db";
import { getDefaultState, migrateSave } from "@/lib/schema";
import { LOCATIONS } from "@/lib/locations";
import type { SaveState } from "@/lib/schema";
import WorldMap from "@/components/game/WorldMap";
import HUD from "@/components/game/HUD";
import MainNav from "@/components/game/MainNav";
import HomePanel from "@/components/game/panels/HomePanel";
import InventoryPanel from "@/components/game/panels/InventoryPanel";
import BankPanel from "@/components/game/panels/BankPanel";
import BusinessesPanel from "@/components/game/panels/BusinessesPanel";
import PropertiesPanel from "@/components/game/panels/PropertiesPanel";
import DreamsPanel from "@/components/game/panels/DreamsPanel";
import FinancialPanel from "@/components/game/panels/FinancialPanel";
import SavePanel from "@/components/game/panels/SavePanel";
import { Toast } from "@/components/ui/toast";
import { useToast, showToast } from "@/components/ui/toast";

export default function GamePage() {
  const [state, setState] = useState<SaveState | null>(null);
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<string | null>(null);
  const [initialRoom, setInitialRoom] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    null
  );
  const { show } = useToast();

  useEffect(() => {
    loadGame()
      .then((saved) => {
        const initial = saved ? migrateSave(saved) : getDefaultState();
        setState(initial);
        setReady(true);
      })
      .catch((err) => {
        show({ kind: "error", message: "Failed to load saved game: " + (err as Error).message });
        setState(getDefaultState());
        setReady(true);
      });
  }, [show]);

  const onUpdate = useCallback(
    (fn: (prev: SaveState) => SaveState) => {
      setState((prev) => (prev ? fn(prev) : prev));
    },
    []
  );

  // Debounced auto-save on state changes.
  useEffect(() => {
    if (!state || !ready || !state.player.settings.autoSave) return;
    const t = setTimeout(() => {
      saveGame(state).catch(() => {
        // Silent; the saving indicator remains the visible signal.
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [state, ready]);

  const handleLocation = useCallback(
    (locId: string) => {
      if (panel) return; // do not navigate the map while a panel is open
      const loc = LOCATIONS.find((l) => l.id === locId);
      if (!loc) return;
      if (!loc.panel) {
        showToast({ kind: "info", message: "Coming soon in a future update" });
        return;
      }
      if (loc.panel === "businesses") {
        setSelectedBusinessId(locId);
        setPanel("businesses");
      } else if (loc.panel === "home") {
        setInitialRoom(loc.initialRoom || null);
        setPanel("home");
      } else {
        setPanel(loc.panel);
      }
    },
    [panel]
  );

  const handleNav = useCallback(
    (id: string) => {
      if (id === "map") {
        setPanel(null);
        setSelectedBusinessId(null);
        return;
      }
      setSelectedBusinessId(null);
      setPanel(id);
    },
    []
  );

  const ownedLocationIds = new Set<string>(["home"]);
  state?.properties.forEach((p) => {
    if (p.status === "owned") ownedLocationIds.add(p.location);
  });
  state?.businesses.forEach((b) => ownedLocationIds.add(b.type));

  if (!ready || !state) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0b0f] text-zinc-300">
        Loading your saved life…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <WorldMap
        locations={LOCATIONS}
        ownedLocationIds={Array.from(ownedLocationIds)}
        onLocationSelect={handleLocation}
      />
      <HUD state={state} />
      <MainNav active={panel} onSelect={handleNav} />
      {panel === "home" && (
        <HomePanel
          state={state}
          onUpdate={onUpdate}
          onClose={() => {
            setPanel(null);
            setInitialRoom(null);
          }}
          initialRoom={initialRoom}
        />
      )}
      {panel === "inventory" && (
        <InventoryPanel
          state={state}
          onUpdate={onUpdate}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "bank" && (
        <BankPanel
          state={state}
          onUpdate={onUpdate}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "businesses" && (
        <BusinessesPanel
          state={state}
          onUpdate={onUpdate}
          onClose={() => {
            setPanel(null);
            setSelectedBusinessId(null);
          }}
          selectedBusinessId={selectedBusinessId}
        />
      )}
      {panel === "properties" && (
        <PropertiesPanel
          state={state}
          onUpdate={onUpdate}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "dreams" && (
        <DreamsPanel
          state={state}
          onUpdate={onUpdate}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "financial" && (
        <FinancialPanel state={state} onClose={() => setPanel(null)} />
      )}
      {panel === "save" && (
        <SavePanel
          state={state}
          onUpdate={onUpdate}
          onClose={() => setPanel(null)}
        />
      )}
      <Toast />
    </div>
  );
}
