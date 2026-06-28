import { SYMBOL_LIST, SYMBOL_WEIGHTS, type SymbolType } from './types';

let pool: SymbolType[] = [];

function buildPool(): SymbolType[] {
  const arr: SymbolType[] = [];
  for (const sym of SYMBOL_LIST) {
    const w = SYMBOL_WEIGHTS[sym];
    for (let i = 0; i < w; i++) arr.push(sym);
  }
  return arr;
}

function refill() {
  pool = buildPool();
  // Fisher-Yates shuffle using crypto RNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
}

export function random(): number {
  const ary = new Uint32Array(1);
  crypto.getRandomValues(ary);
  return ary[0] / 0x100000000;
}

export function pickSymbol(): SymbolType {
  if (pool.length === 0) refill();
  return pool.pop()!;
}

export function spinReels(): SymbolType[][] {
  // 5 reels × 3 rows
  const result: SymbolType[][] = [];
  for (let r = 0; r < 5; r++) {
    const reel: SymbolType[] = [];
    for (let row = 0; row < 3; row++) {
      reel.push(pickSymbol());
    }
    result.push(reel);
  }
  return result;
}
