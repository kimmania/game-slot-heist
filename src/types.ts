export type SymbolType = 'diamond' | 'goldbar' | 'vault' | 'cash' | 'coin' | 'badge' | 'drill' | 'bell' | 'dial';

export interface SymbolDef {
  type: SymbolType;
  emoji: string;
  value5: number;
  value4: number;
  value3: number;
  scatter: boolean;
  bonus: boolean;
  wild: boolean;
}

export const SYMBOLS: Record<SymbolType, SymbolDef> = {
  diamond: { type: 'diamond', emoji: '💎', value5: 250, value4: 100, value3: 50, scatter: false, bonus: false, wild: false },
  goldbar: { type: 'goldbar', emoji: '🥇', value5: 125, value4: 50, value3: 25, scatter: false, bonus: false, wild: false },
  vault:   { type: 'vault',   emoji: '🚪', value5: 0,   value4: 0,  value3: 0,  scatter: false, bonus: false, wild: true },
  cash:    { type: 'cash',    emoji: '💵', value5: 75,  value4: 30, value3: 15, scatter: false, bonus: false, wild: false },
  coin:    { type: 'coin',    emoji: '🪙', value5: 50,  value4: 20, value3: 10, scatter: false, bonus: false, wild: false },
  badge:   { type: 'badge',   emoji: '🛡️', value5: 30,  value4: 12, value3: 6,  scatter: false, bonus: false, wild: false },
  drill:   { type: 'drill',   emoji: '🔩', value5: 20,  value4: 8,  value3: 4,  scatter: false, bonus: false, wild: false },
  bell:    { type: 'bell',    emoji: '🔔', value5: 0,   value4: 0,  value3: 0,  scatter: true,  bonus: false, wild: false },
  dial:    { type: 'dial',    emoji: '🎛️', value5: 0,   value4: 0,  value3: 0,  scatter: false, bonus: true,  wild: false },
};

export const SYMBOL_LIST: SymbolType[] = Object.keys(SYMBOLS) as SymbolType[];

// Weighted distribution tuned for ~96% RTP and ~22% hit frequency
export const SYMBOL_WEIGHTS: Record<SymbolType, number> = {
  diamond: 2,
  goldbar: 4,
  vault:   3,
  cash:    8,
  coin:    12,
  badge:   14,
  drill:   16,
  bell:    5,
  dial:    4,
};

export const PAYLINES: number[][] = [
  [1,1,1,1,1], // middle row
  [0,0,0,0,0], // top row
  [2,2,2,2,2], // bottom row
  [0,1,2,1,0], // V
  [2,1,0,1,2], // inverted V
  [0,0,1,2,2], // diagonal down
  [2,2,1,0,0], // diagonal up
  [1,0,0,0,1], // top edge U
  [1,2,2,2,1], // bottom edge U
  [0,1,1,1,0], // top-mid block
  [2,1,1,1,2], // bottom-mid block
  [1,0,1,0,1], // zigzag up
  [1,2,1,2,1], // zigzag down
  [0,1,0,1,0], // small zigzag top
  [2,1,2,1,2], // small zigzag bottom
  [0,0,1,0,0], // top-center bump
  [2,2,1,2,2], // bottom-center bump
  [1,1,0,1,1], // mid-top dip
  [1,1,2,1,1], // mid-bottom dip
  [0,1,2,2,2], // long diagonal down
];

export const BET_AMOUNTS = [1, 2, 5, 10, 25];

export interface SavedGame {
  bank: number;
  xp: number;
  level: number;
  betIdx: number;
  dailyLogin: number; // timestamp
  recentWins: number[];
  topWins: number[];
  turbo: boolean;
  sound: boolean;
  hasSeenHelp: boolean;
  wheelCooldown: number;
}

export const STORAGE_KEY = 'slot-heist-save';

export const DEFAULT_SAVE: SavedGame = {
  bank: 100,
  xp: 0,
  level: 1,
  betIdx: 0,
  dailyLogin: 0,
  recentWins: [],
  topWins: [],
  turbo: false,
  sound: true,
  hasSeenHelp: false,
  wheelCooldown: 0,
};

export function xpForLevel(lvl: number): number {
  return Math.floor(100 * Math.pow(1.6, lvl - 1));
}
