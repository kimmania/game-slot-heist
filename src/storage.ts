import { STORAGE_KEY, DEFAULT_SAVE, type SavedGame } from './types';

export function loadGame(): SavedGame {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw) as Partial<SavedGame>;
    return { ...DEFAULT_SAVE, ...parsed } as SavedGame;
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function saveGame(state: SavedGame) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
