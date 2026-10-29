import { openDB, IDBPDatabase, DBSchema } from "idb";
import { SAVE_VERSION, validateImport, type SaveState, type ImportValidation } from "./schema";

const DB_NAME = "life-lead-db";
const STORE = "saves";
const SAVE_KEY = "main-save";

interface LifeLeadDB extends DBSchema {
  [STORE]: { key: string; value: SaveState };
}

let dbPromise: Promise<IDBPDatabase<LifeLeadDB>> | null = null;

function getDB(): Promise<IDBPDatabase<LifeLeadDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LifeLeadDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function loadGame(): Promise<SaveState | null> {
  const db = await getDB();
  const value = await db.get(STORE, SAVE_KEY);
  return value ?? null;
}

export async function saveGame(state: SaveState): Promise<void> {
  const db = await getDB();
  const payload: SaveState = {
    ...state,
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    player: { ...state.player, updatedAt: new Date().toISOString() },
  };
  await db.put(STORE, payload, SAVE_KEY);
}

export async function exportBackupToFile(fileName?: string): Promise<string> {
  const db = await getDB();
  const value = await db.get(STORE, SAVE_KEY);
  if (!value) throw new Error("No save data to export.");
  const json = JSON.stringify(value, null, 2);
  if (typeof window !== "undefined") {
    const name = fileName || `life-lead-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return json;
}

export async function importBackupFromFile(file: File): Promise<ImportValidation> {
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { valid: false, errors: ["Invalid JSON file."] };
  }
  const result = validateImport(raw);
  if (result.valid && result.state) {
    const db = await getDB();
    await db.put(STORE, result.state, SAVE_KEY);
  }
  return result;
}

export async function clearSave(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, SAVE_KEY);
}
