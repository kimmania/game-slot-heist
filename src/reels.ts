import { SYMBOLS, PAYLINES, type SymbolType } from './types';

export interface WinResult {
  paylineIndex: number;
  symbol: SymbolType;
  count: number;
  payout: number;
  positions: [number, number][]; // [reel, row]
}

export function evaluateWin(grid: SymbolType[][], bet: number): WinResult[] {
  const wins: WinResult[] = [];
  for (let pi = 0; pi < PAYLINES.length; pi++) {
    const line = PAYLINES[pi];
    let effectiveSym: SymbolType | null = null;
    let contiguous = 0;
    const pos: [number, number][] = [];

    for (let reel = 0; reel < 5; reel++) {
      const row = line[reel];
      const cur = grid[reel][row];
      if (effectiveSym === null) {
        if (!SYMBOLS[cur].wild) effectiveSym = cur;
        pos.push([reel, row]);
        contiguous++;
      } else {
        if (cur === effectiveSym || SYMBOLS[cur].wild) {
          pos.push([reel, row]);
          contiguous++;
        } else {
          break;
        }
      }
    }

    if (contiguous >= 3 && effectiveSym !== null && !SYMBOLS[effectiveSym].scatter && !SYMBOLS[effectiveSym].bonus) {
      const def = SYMBOLS[effectiveSym];
      let payout = 0;
      if (contiguous === 5) payout = def.value5;
      else if (contiguous === 4) payout = def.value4;
      else payout = def.value3;
      wins.push({ paylineIndex: pi, symbol: effectiveSym, count: contiguous, payout: payout * bet, positions: pos });
    }

    // Edge case: all 5 wilds — treat as diamond win
    if (contiguous === 5 && effectiveSym === null) {
      const def = SYMBOLS.diamond;
      wins.push({ paylineIndex: pi, symbol: 'diamond', count: 5, payout: def.value5 * bet, positions: pos });
    }
  }
  return wins;
}

export function countScatters(grid: SymbolType[][]): number {
  let n = 0;
  for (let r = 0; r < 5; r++) {
    for (let row = 0; row < 3; row++) {
      if (SYMBOLS[grid[r][row]].scatter) n++;
    }
  }
  return n;
}

export function countBonus(grid: SymbolType[][]): number {
  let n = 0;
  for (let r = 0; r < 5; r++) {
    for (let row = 0; row < 3; row++) {
      if (SYMBOLS[grid[r][row]].bonus) n++;
    }
  }
  return n;
}
