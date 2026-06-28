import { loadGame, saveGame, clearGame } from './storage';
import { spinReels, random } from './rng';
import { evaluateWin, countScatters, countBonus } from './reels';
import { UI } from './ui';
import { BET_AMOUNTS, xpForLevel, SYMBOLS, PAYLINES } from './types';
import type { SavedGame, SymbolType } from './types';
import * as sound from './sound';

let state: SavedGame;
let grid: SymbolType[][] = [];
let spinning = false;
let turbo = false;
let freeSpins = 0;
let freeSpinMultiplier = 1;
let wheelLock = false;
let spinningWheel = false;

const ui = new UI();

export function init() {
  state = loadGame();
  sound.setMuted(!state.sound);

  const now = Date.now();
  if (now - state.dailyLogin > 24 * 60 * 60 * 1000) {
    state.bank += 100;
    state.dailyLogin = now;
    ui.toast("Daily login bonus: +$100!");
  }

  syncUI();
  ui.setFreeSpins(freeSpins);
  ui.renderHelpPaylines(PAYLINES);
  ui.setMuteIcon(!state.sound);

  if (!state.hasSeenHelp) {
    ui.showHelp();
  } else {
    ui.toast("New heist started! Set your bet and spin.");
  }

  bindEvents();
}

function bindEvents() {
  ui.els['spin']?.addEventListener('pointerdown', () => onSpin());
  ui.els['bet-minus']?.addEventListener('pointerdown', () => changeBet(-1));
  ui.els['bet-plus']?.addEventListener('pointerdown', () => changeBet(1));
  ui.els['turbo']?.addEventListener('click', () => {
    turbo = !turbo;
    state.turbo = turbo;
    ui.setTurboActive(turbo);
    saveGame(state);
  });
  ui.els['mute-btn']?.addEventListener('click', () => {
    state.sound = !state.sound;
    sound.setMuted(!state.sound);
    ui.setMuteIcon(!state.sound);
    saveGame(state);
  });
  ui.els['info-btn']?.addEventListener('click', () => { ui.showHelp(); });
  ui.els['help-dismiss']?.addEventListener('click', () => {
    state.hasSeenHelp = true;
    ui.hideHelp();
    saveGame(state);
  });
  ui.els['help-paytable-btn']?.addEventListener('click', () => { ui.hideHelp(); ui.showPaytable(); });
  ui.els['paytable-close']?.addEventListener('click', () => ui.hidePaytable());
  ui.els['vault-done']?.addEventListener('click', () => ui.hideVault());
  ui.els['wheel-spin']?.addEventListener('click', () => spinWheel());
  ui.els['reset-btn']?.addEventListener('click', () => ui.showReset());
  ui.els['reset-confirm']?.addEventListener('click', () => resetGame());
  ui.els['reset-cancel']?.addEventListener('click', () => ui.hideReset());

  // Keypad mini-game buttons
  const kpad = ui.els['keypad-grid'] as HTMLElement | null;
  if (kpad) {
    for (const btn of Array.from(kpad.children)) {
      btn.addEventListener('click', () => {
        if ((btn as HTMLElement).id === 'keypad-clear') setKeypadInput('', true);
        else if ((btn as HTMLElement).id === 'keypad-enter') submitKeypadInput();
        else setKeypadInput(((btn as HTMLElement).dataset.k) || '');
      });
    }
  }
  ui.els['keypad-done']?.addEventListener('click', () => finishKeypad());

  const chips = ui.els['bet-chips'] as HTMLElement | null;
  if (chips) {
    for (const btn of Array.from(chips.children)) {
      btn.addEventListener('click', () => {
        const val = parseInt((btn as HTMLElement).dataset.val || '-1', 10);
        if (val < 0) return;
        const idx = BET_AMOUNTS.indexOf(val);
        if (idx >= 0) { state.betIdx = idx; syncUI(); }
      });
    }
  }

  const pt = ui.els['paytable'];
  if (pt) buildPaytable(pt as HTMLElement);
}

function buildPaytable(el: HTMLElement) {
  let html = '<tr><th>Symbol</th><th>3</th><th>4</th><th>5</th></tr>';
  for (const key of Object.keys(SYMBOLS) as (keyof typeof SYMBOLS)[]) {
    const s = SYMBOLS[key];
    if (s.wild || s.scatter || s.bonus) continue;
    html += `<tr><td>${s.emoji} ${key}</td><td>×${s.value3}</td><td>×${s.value4}</td><td>×${s.value5}</td></tr>`;
  }
  html += `<tr><td>🚪 Wild</td><td colspan="3">substitutes any pay symbol</td></tr>`;
  html += `<tr><td>🔔 Scatter</td><td colspan="3">3+ triggers Free Spins</td></tr>`;
  html += `<tr><td>🎛️ Bonus</td><td colspan="3">3+ triggers Vault Break</td></tr>`;
  el.innerHTML = html;
}

function changeBet(delta: number) {
  let idx = state.betIdx + delta;
  idx = Math.max(0, Math.min(BET_AMOUNTS.length - 1, idx));
  state.betIdx = idx;
  syncUI();
}

function syncUI() {
  const nextXp = xpForLevel(state.level + 1);
  ui.updateBalance(state.bank, false);
  ui.updateLevel(state.level, state.xp, nextXp);
  ui.setBetDisplay(BET_AMOUNTS[state.betIdx]);
  ui.setTurboActive(state.turbo);
  turbo = state.turbo;
}

async function onSpin() {
  if (spinning) return;
  const bet = BET_AMOUNTS[state.betIdx];
  if (state.bank < bet && freeSpins <= 0) {
    ui.toast("Not enough bankroll! Come back tomorrow for a bonus.");
    return;
  }

  spinning = true;
  ui.disableSpin(true);
  ui.clearHighlights();

  if (freeSpins > 0) {
    freeSpins--;
    ui.setFreeSpins(freeSpins);
  } else {
    state.bank -= bet;
    ui.updateBalance(state.bank, false);
    state.xp += bet;
    maybeLevelUp();
  }

  grid = spinReels();

  // Random mini-game trigger (mutually exclusive, ~1/75 wheel, ~1/100 keypad)
  if (!wheelLock && freeSpins <= 0) {
    const roll = random();
    if (roll < 0.01) {
      setTimeout(() => triggerKeypad(), 600);
    } else if (roll < 1/70) {
      setTimeout(() => triggerMysteryWheel(), 600);
    }
  }

  if (!turbo) {
    await animateSpin(grid);
  } else {
    ui.renderGrid(grid);
  }

  const wins = evaluateWin(grid, bet);
  let totalWin = 0;
  for (const w of wins) totalWin += w.payout;

  if (totalWin > 0) {
    sound.winChime();
  }
  if (freeSpins > 0 && totalWin > 0) {
    totalWin *= freeSpinMultiplier;
    freeSpinMultiplier++;
  }
  if (totalWin > 0) {
    state.bank += totalWin;
    ui.showWinToast(`Win $${totalWin}!`);
    ui.updateBalance(state.bank, true, () => sound.coinBlip());
    addTopWin(totalWin);
    for (const w of wins) ui.highlightCells(w.positions, 'win');
    setTimeout(() => ui.hideWinToast(), 1400);
  }

  const scatters = countScatters(grid);
  if (scatters >= 3) {
    const award = scatters === 5 ? 25 : scatters === 4 ? 15 : 10;
    freeSpins += award;
    ui.setFreeSpins(freeSpins);
    freeSpinMultiplier = 1;
    ui.toast(`${award} Free Spins!`);
  }

  const bonusCount = countBonus(grid);
  if (bonusCount >= 3) {
    setTimeout(() => triggerVaultBreak(bonusCount), 500);
  }

  if (!turbo && totalWin <= 0 && scatters < 3 && bonusCount < 3) {
    await new Promise(r => setTimeout(r, 300));
  }

  saveGame(state);
  spinning = false;
  ui.disableSpin(false);
}

function maybeLevelUp() {
  let nextXp = xpForLevel(state.level + 1);
  while (state.xp >= nextXp) {
    state.level++;
    state.bank += 200;
    ui.toast(`Level Up! You are now level ${state.level}. +$200 bonus!`);
    nextXp = xpForLevel(state.level + 1);
  }
  const newNext = xpForLevel(state.level + 1);
  ui.updateLevel(state.level, state.xp, newNext);
}

function addTopWin(amount: number) {
  state.recentWins.push(amount);
  if (state.recentWins.length > 5) state.recentWins.shift();
  for (const a of state.recentWins) ui.addRecentWin(a);
  state.topWins.push(amount);
  state.topWins.sort((a, b) => b - a);
  state.topWins = state.topWins.slice(0, 10);
}

async function animateSpin(finalGrid: SymbolType[][]) {
  const container = ui.els['reels'] as HTMLElement;
  if (!container) return;
  container.innerHTML = '';
  const reelEls: HTMLElement[] = [];
  for (let r = 0; r < 5; r++) {
    const reel = document.createElement('div');
    reel.className = 'reel';
    const strip = document.createElement('div');
    strip.className = 'reel-strip';
    strip.style.willChange = 'transform';
    reel.appendChild(strip);
    container.appendChild(reel);
    reelEls.push(strip);
  }

  const duration = 1200;
  const settleDelay = 180;

  await Promise.all(reelEls.map((strip, i) => animateOneReel(strip, i, finalGrid, duration, settleDelay)));

  ui.renderGrid(finalGrid);
}

function animateOneReel(
  strip: HTMLElement,
  i: number,
  finalGrid: SymbolType[][],
  duration: number,
  settleDelay: number
): Promise<void> {
  return new Promise((resolve) => {
    const symbols = finalGrid[i];
    const totalSymbols = 40 + i * 10;
    const items: SymbolType[] = [];
    for (let n = 0; n < totalSymbols; n++) {
      const pool: SymbolType[] = [
        'coin', 'badge', 'drill', 'cash', 'goldbar',
        'diamond', 'bell', 'dial', 'vault'
      ];
      items.push(pool[Math.floor(random() * pool.length)]);
    }
    items[items.length - 3] = symbols[0];
    items[items.length - 2] = symbols[1];
    items[items.length - 1] = symbols[2];

    renderStrip(strip, items);

    const delay = i * settleDelay;
    const t0 = performance.now() + delay;

    // force reflow so strip gets laid out before reading heights
    void strip.offsetHeight;
    const cellH = strip.querySelector('.cell')!.getBoundingClientRect().height;
    const gapH  = parseFloat(getComputedStyle(strip).gap) || parseFloat(getComputedStyle(strip).rowGap) || 0;
    const stripH = items.length * cellH + (items.length - 1) * gapH;
    const reelH  = 3 * cellH + 2 * gapH;
    const endY   = stripH - reelH;

    function frame(t: number) {
      const elapsed = t - t0;
      if (elapsed < 0) {
        requestAnimationFrame(frame);
        return;
      }
      const p = Math.min(1, elapsed / (duration - delay * 0.6));
      const lastP = (strip as any).__lastP ?? -1;
      (strip as any).__lastP = p;
      // tick every ~8% of progress passing a multiple
      if (Math.floor(p * 12) > Math.floor(lastP * 12)) {
        sound.spinTick();
      }
      const ease = 1 - Math.pow(1 - p, 3);
      strip.style.transform = `translateY(-${ease * endY}px)`;
      if (p < 1) requestAnimationFrame(frame);
      else { sound.reelStop(); resolve(); }
    }
    requestAnimationFrame(frame);
  });
}

function renderStrip(strip: HTMLElement, items: SymbolType[]) {
  strip.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const sym of items) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.sym = sym;
    cell.textContent = getEmoji(sym);
    if (sym === 'vault') cell.classList.add('wild');
    frag.appendChild(cell);
  }
  strip.appendChild(frag);
}

function triggerVaultBreak(dialCount: number) {
  ui.showVault();
  const gridEl = ui.els['vault-grid'] as HTMLElement;
  if (!gridEl) return;
  gridEl.innerHTML = '';
  let picks = dialCount;
  const totalBoxes = 12;

  // Build explicit boxes: 2 buzzers + 10 prizes (no value-range ambiguity)
  interface VBox { isBuzzer: boolean; cash: number; multiplier: number; extraPicks: number; }
  const boxes: VBox[] = [];
  boxes.push({ isBuzzer: true, cash: 0, multiplier: 0, extraPicks: 0 }, { isBuzzer: true, cash: 0, multiplier: 0, extraPicks: 0 });
  const pool = [
    { isBuzzer: false, cash: 50, multiplier: 0, extraPicks: 0 },
    { isBuzzer: false, cash: 100, multiplier: 0, extraPicks: 0 },
    { isBuzzer: false, cash: 200, multiplier: 0, extraPicks: 0 },
    { isBuzzer: false, cash: 300, multiplier: 0, extraPicks: 0 },
    { isBuzzer: false, cash: 500, multiplier: 0, extraPicks: 0 },
    { isBuzzer: false, cash: 0, multiplier: 2, extraPicks: 0 },
    { isBuzzer: false, cash: 0, multiplier: 3, extraPicks: 0 },
    { isBuzzer: false, cash: 0, multiplier: 5, extraPicks: 0 },
    { isBuzzer: false, cash: 0, multiplier: 0, extraPicks: 2 },
    { isBuzzer: false, cash: 0, multiplier: 0, extraPicks: 2 },
  ] as VBox[];
  for (const p of pool) boxes.push({ ...p });
  for (let i = boxes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [boxes[i], boxes[j]] = [boxes[j], boxes[i]];
  }

  let picked = 0;
  let vaultTotal = 0;
  let alive = true;
  const MAX_VAULT_WIN = 5000; // hard cap to prevent runaway multipliers

  function refreshTotal() {
    const el = ui.els['vault-total'] as HTMLElement | null;
    if (el) el.textContent = `Total loot: $${vaultTotal}`;
  }

  function refreshStatus() {
    const el = ui.els['vault-status'] as HTMLElement | null;
    const remaining = Math.max(0, picks - picked);
    if (el) {
      el.textContent = `Crack the vault doors before the alarm trips! You have ${remaining} pick${remaining !== 1 ? 's' : ''} remaining.`;
    }
  }

  for (let i = 0; i < totalBoxes; i++) {
    const box = document.createElement('div');
    box.className = 'vault-box';
    box.dataset.index = String(i);
    box.innerHTML = `<div class="valk">🚪</div><div class="valm">🔒</div>`;
    box.addEventListener('click', () => {
      if (!alive || box.classList.contains('opened') || box.classList.contains('buzzer')) return;
      const prize = boxes[Number(box.dataset.index)];
      if (prize.isBuzzer) {
        sound.laserZap();
        sound.vaultBuzzer();
        box.classList.add('buzzer');
        box.innerHTML = `<div class="valk">🚪</div><div class="valm">⚡</div>`;
        alive = false;
        ui.toast("Alarm triggered! Vault sealed.");
        finishVault();
        return;
      }
      sound.vaultClick();
      sound.vaultUnlock();
      sound.metalClank();
      box.classList.add('opened');
      let face = '';
      if (prize.cash > 0) {
        face = `$${prize.cash}`;
        vaultTotal += prize.cash;
      } else if (prize.multiplier > 0) {
        face = `×${prize.multiplier}`;
        vaultTotal = (vaultTotal || 1) * prize.multiplier;
      } else if (prize.extraPicks > 0) {
        face = `+${prize.extraPicks} picks`;
        picks += prize.extraPicks;
      }
      vaultTotal = Math.min(vaultTotal, MAX_VAULT_WIN);
      refreshTotal();
      refreshStatus();
      box.innerHTML = `<div class="valk gold">💎</div><div class="valm">${face}</div>`;
      picked++;
      if (picked >= picks) {
        alive = false;
        finishVault();
      }
    });
    gridEl.appendChild(box);
  }

  refreshStatus();
  refreshTotal();

  function finishVault() {
    const doneBtn = ui.els['vault-done'] as HTMLElement;
    if (doneBtn) doneBtn.classList.remove('hidden');
    if (vaultTotal > 0) {
      state.bank += vaultTotal;
      ui.updateBalance(state.bank, true, () => sound.coinBlip());
      sound.cashRegister();
      ui.toast(`Vault loot: $${vaultTotal}`);
      addTopWin(vaultTotal);
      saveGame(state);
    }
  }
}

function triggerMysteryWheel() {
  wheelLock = true;
  ui.showWheel();
  resetWheel();
}

function resetWheel() {
  const wheel = ui.els['wheel'] as HTMLElement;
  if (wheel) {
    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
  }
}

function spinWheel() {
  const wheel = ui.els['wheel'] as HTMLElement;
  const btn = ui.els['wheel-spin'] as HTMLButtonElement;
  const resultEl = ui.els['wheel-result'] as HTMLElement;
  if (!wheel || !btn || spinningWheel) return;

  type Seg = { label: string; value: () => number };
  const segments: Seg[] = [
    { label: '×10', value: () => BET_AMOUNTS[state.betIdx] * 10 },
    { label: '×25', value: () => BET_AMOUNTS[state.betIdx] * 25 },
    { label: '×50', value: () => BET_AMOUNTS[state.betIdx] * 50 },
    { label: '×100', value: () => BET_AMOUNTS[state.betIdx] * 100 },
    { label: '×250', value: () => BET_AMOUNTS[state.betIdx] * 250 },
    { label: '+5 Free Spins', value: () => { freeSpins += 5; ui.setFreeSpins(freeSpins); ui.toast("+5 Free Spins!"); return 0; } },
    { label: 'Vault Break now!', value: () => { setTimeout(() => triggerVaultBreak(3), 400); return 0; } },
    { label: 'JACKPOT ×2000', value: () => BET_AMOUNTS[state.betIdx] * 2000 },
  ];

  const weights = [2,2,2,2,1,1,1,1];
  const pickIndex = weightedPick(weights);
  const seg = segments[Math.min(pickIndex, segments.length - 1)];
  const rotations = 4 + Math.floor(random() * 3);
  // 8 segments × 45°. Pointer at top (0°). Bring segment center to top.
  const targetDeg = 360 * rotations + (337.5 - pickIndex * 45);
  wheel.style.transition = 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)';
  wheel.style.transform = `rotate(${targetDeg}deg)`;
  spinningWheel = true;
  btn.disabled = true;
  resultEl.textContent = '';

  let ticks = 0;
  const tickInt = setInterval(() => {
    ticks++;
    if (ticks < 24) sound.wheelTick();
  }, 120);

  setTimeout(() => {
    clearInterval(tickInt);
    const val = seg.value();
    resultEl.textContent = seg.label;
    if (val > 0) {
      state.bank += val;
      ui.updateBalance(state.bank, true);
      ui.toast(`Wheel win: $${val}!`);
      addTopWin(val);
      sound.wheelWin();
    } else {
      sound.reelStop(); // small chime for non-cash prizes
    }
    saveGame(state);
    spinningWheel = false;
    btn.disabled = false;
    state.wheelCooldown = Date.now() + 5 * 60 * 1000;
    setTimeout(() => { ui.hideWheel(); wheelLock = false; }, 1500);
  }, 3200);
}

function weightedPick(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function resetGame() {
  ui.hideReset();
  clearGame();
  state = loadGame();
  grid = [];
  spinning = false;
  turbo = false;
  freeSpins = 0;
  freeSpinMultiplier = 1;
  wheelLock = false;
  spinningWheel = false;
  syncUI();
  ui.setFreeSpins(0);
  ui.setMuteIcon(!state.sound);
  sound.setMuted(!state.sound);
  ui.renderGrid(spinReels());
  ui.toast("Game reset. Good luck!");
}

let keypadTimer: number | undefined;
let keypadInterval: ReturnType<typeof setInterval> | undefined;
let keypadCode = '';
let keypadTarget = '';

/* 4-digit vault code.  Guessed within the time limit = cash prize.
   Out of attempts or time runs out = laser trap, no payout.              */
function triggerKeypad(): number {
  ui.showKeypad();
  keypadCode = '';
  // generate a 4-digit numeric code, duplicates allowed for variety
  let target = '';
  for (let i = 0; i < 4; i++) target += String(Math.floor(random() * 10));
  keypadTarget = target;
  ui.setKeypadDisplay('');
  ui.setKeypadStatus('Enter the vault code');
  ui.setKeypadTimer(15);
  ui.setKeypadReward('');
  (ui.els['keypad-done'] as HTMLElement)?.classList.add('hidden');
  const overlay = ui.els['keypad-laser-overlay'] as HTMLElement | null;
  if (overlay) overlay.classList.remove('active');

  let seconds = 15;
  if (keypadInterval) clearInterval(keypadInterval);
  if (keypadTimer) clearTimeout(keypadTimer);
  keypadInterval = setInterval(() => {
    seconds--;
    ui.setKeypadTimer(seconds);
    if (seconds <= 0) {
      clearInterval(keypadInterval!);
      keypadInterval = undefined;
      failKeypad('Time ran out!');
    }
  }, 1000);
  keypadTimer = window.setTimeout(() => { /* safeguard if interval stalls */ clearInterval(keypadInterval!); keypadInterval = undefined; failKeypad('Time ran out!'); }, 16000);
  return 0;
}

function cancelKeypadTimers() {
  if (keypadInterval) { clearInterval(keypadInterval); keypadInterval = undefined; }
  if (keypadTimer) { clearTimeout(keypadTimer); keypadTimer = undefined; }
}

function failKeypad(reason: string) {
  cancelKeypadTimers();
  ui.setKeypadStatus(reason);
  ui.setKeypadReward('No payout — vault sealed!');
  ui.laserFlash();
  sound.laserZap();
  (ui.els['keypad-done'] as HTMLElement)?.classList.remove('hidden');
}

function setKeypadInput(digit: string, clear = false) {
  if (clear) { keypadCode = ''; ui.setKeypadDisplay(''); return; }
  if (keypadCode.length >= 4) return;
  keypadCode += digit;
  ui.setKeypadDisplay(keypadCode);
}

function submitKeypadInput() {
  if (keypadCode === keypadTarget) {
    cancelKeypadTimers();
    // cash reward scales with remaining time: more time left = higher reward
    const reward = BET_AMOUNTS[state.betIdx] * (20 + Math.floor(Math.random() * 81)); // ×20–×100 of current bet
    state.bank += reward;
    ui.updateBalance(state.bank, true, () => sound.coinBlip());
    sound.cashRegister();
    ui.setKeypadStatus('Code correct!');
    ui.setKeypadReward(`Loot: $${reward}`);
    (ui.els['keypad-done'] as HTMLElement)?.classList.remove('hidden');
    addTopWin(reward);
    saveGame(state);
    return;
  }
  sound.laserZap();
  if (keypadCode !== keypadTarget) {
    keypadCode = '';
    ui.setKeypadDisplay('');
    ui.setKeypadStatus('Incorrect — try again!');
  }
}

function finishKeypad() {
  ui.hideKeypad();
}

function getEmoji(sym: SymbolType): string {
  const map: Record<SymbolType, string> = {
    diamond: '💎', goldbar: '🥇', vault: '🚪', cash: '💵',
    coin: '🪙', badge: '🛡️', drill: '💎', bell: '🔔', dial: '🎛️',
  };
  return map[sym] || '❓';
}
