import { SYMBOLS } from './types';
import type { SymbolType } from './types';

export class UI {
  els: Record<string, HTMLElement | null> = {};

  constructor() {
    const ids = [
      'balance','level','xp-fill','reels','bet-amount','bet-minus','bet-plus','spin','turbo','info-btn',
      'mute-btn','free-spins','bet-chips','recent-wins','win-toast','reset-btn','heat-wrap','heat-fill',
      'help-modal','help-dismiss','help-paytable-btn','help-paylines',
      'paytable-modal','paytable-close','paytable',
      'vault-break','vault-status','vault-grid','vault-total','vault-done','vault-cashout',
      'wheel-modal','wheel','wheel-spin','wheel-result','message-toast',
      'reset-modal','reset-confirm','reset-cancel',
      'keypad-modal','keypad-status','keypad-display','keypad-grid','keypad-timer','keypad-reward','keypad-done','keypad-laser-overlay','keypad-hints',
      'achievements-modal','achievements-list','achievements-btn','achievements-close',
      'crew-modal','crew-list','crew-btn','crew-close',
    ];
    for (const id of ids) {
      this.els[id] = document.getElementById(id);
    }
  }

  updateBalance(val: number, animate = false, onTick?: (val: number) => void) {
    const el = this.els['balance'] as HTMLElement;
    if (!el) return;
    const target = el.textContent || '';
    if (!animate) {
      el.textContent = `$${Math.floor(val).toLocaleString()}`;
      return;
    }
    // simple count-up with blips
    const start = parseInt(target.replace(/[^0-9-]/g, ''), 10) || 0;
    const end = Math.floor(val);
    const dur = 600;
    const t0 = performance.now();
    let lastBlip = start;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const cur = Math.floor(start + (end - start) * p);
      el.textContent = `$${cur.toLocaleString()}`;
      if (onTick && cur > lastBlip) {
        const diff = cur - lastBlip;
        if (diff >= Math.max(1, Math.floor((end - start) / 12))) {
          lastBlip = cur;
          onTick(cur);
        }
      }
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  updateLevel(lvl: number, xp: number, nextXp: number) {
    const l = this.els['level'] as HTMLElement;
    if (l) l.textContent = String(lvl);
    const bar = this.els['xp-fill'] as HTMLElement;
    if (bar) bar.style.width = `${Math.min(100, (xp / nextXp) * 100)}%`;
  }

  renderGrid(grid: SymbolType[][]) {
    const container = this.els['reels'] as HTMLElement;
    if (!container) return;
    container.innerHTML = '';
    for (let reel = 0; reel < 5; reel++) {
      const reelEl = document.createElement('div');
      reelEl.className = 'reel';
      reelEl.dataset.reel = String(reel);
      for (let row = 0; row < 3; row++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.sym = grid[reel][row];
        cell.textContent = getEmoji(grid[reel][row]);
        if (grid[reel][row] === 'vault') cell.classList.add('wild');
        reelEl.appendChild(cell);
      }
      container.appendChild(reelEl);
    }
  }

  highlightCells(positions: [number, number][], cls = 'win') {
    const container = this.els['reels'] as HTMLElement;
    if (!container) return;
    for (const [reel, row] of positions) {
      const reelEl = container.children[reel] as HTMLElement;
      if (!reelEl) continue;
      const cell = reelEl.children[row] as HTMLElement;
      if (cell) cell.classList.add(cls);
    }
  }

  clearHighlights() {
    const container = this.els['reels'] as HTMLElement;
    if (!container) return;
    for (const reelEl of container.children) {
      for (const cell of reelEl.children) {
        cell.classList.remove('win');
        cell.classList.remove('near-miss');
      }
    }
  }

  /* Near-miss: exactly 2 scatters or 2 bonus symbols — pulse those cells. */
  pulseNearMiss(grid: SymbolType[][]) {
    const scat: [number, number][] = [];
    const bon: [number, number][] = [];
    for (let r = 0; r < 5; r++) {
      for (let row = 0; row < 3; row++) {
        const s = SYMBOLS[grid[r][row]];
        if (s.scatter) scat.push([r, row]);
        if (s.bonus) bon.push([r, row]);
      }
    }
    const targets = scat.length === 2 ? scat : bon.length === 2 ? bon : [];
    if (targets.length) this.highlightCells(targets, 'near-miss');
  }

  updateHeat(heat: number) {
    const fill = this.els['heat-fill'] as HTMLElement | null;
    if (fill) fill.style.width = `${Math.min(100, heat)}%`;
    const wrap = this.els['heat-wrap'] as HTMLElement | null;
    if (wrap) wrap.classList.toggle('hot', heat >= 70);
  }

  setBetDisplay(amount: number) {
    const el = this.els['bet-amount'] as HTMLElement;
    if (el) el.textContent = `$${amount}`;
    const chips = this.els['bet-chips'] as HTMLElement;
    if (!chips) return;
    for (const btn of Array.from(chips.children)) {
      btn.classList.toggle('active', parseInt((btn as HTMLElement).dataset.val || '-1', 10) === amount);
    }
  }

  addRecentWin(amount: number) {
    const el = this.els['recent-wins'] as HTMLElement;
    if (!el) return;
    const badges = Array.from(el.children);
    if (badges.length >= 5) badges[0].remove();
    const span = document.createElement('span');
    span.textContent = `$${amount}`;
    el.appendChild(span);
  }

  showHelp() {
    const m = this.els['help-modal'];
    if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }
  hideHelp() {
    const m = this.els['help-modal'];
    if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
  }

  showPaytable() {
    const m = this.els['paytable-modal'];
    if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }
  hidePaytable() {
    const m = this.els['paytable-modal'];
    if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
  }

  showVault() {
    const m = this.els['vault-break'];
    if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }
  hideVault() {
    const m = this.els['vault-break'];
    if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
  }

  showWheel() {
    const m = this.els['wheel-modal'];
    if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }
  hideWheel() {
    const m = this.els['wheel-modal'];
    if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
  }

  showReset() {
    const m = this.els['reset-modal'];
    if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }
  hideReset() {
    const m = this.els['reset-modal'];
    if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
  }

  toast(msg: string) {
    const el = this.els['message-toast'] as HTMLElement;
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    el.style.opacity = '1';
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.classList.add('hidden'), 300);
    }, 2000);
  }

  disableSpin(v: boolean) {
    const btn = this.els['spin'] as HTMLButtonElement;
    if (btn) btn.disabled = v;
  }

  setTurboActive(v: boolean) {
    const btn = this.els['turbo'] as HTMLElement;
    if (btn) btn.classList.toggle('active', v);
  }

  setMuteIcon(muted: boolean) {
    const el = this.els['mute-btn'] as HTMLElement | null;
    if (el) el.textContent = muted ? '🔇' : '🔊';
  }

  setFreeSpins(count: number) {
    const el = this.els['free-spins'] as HTMLElement | null;
    if (el) {
      if (count <= 0) { el.textContent = '—'; el.style.color = 'var(--muted)'; }
      else { el.textContent = String(count); el.style.color = 'var(--success)'; }
    }
  }

  showWinToast(msg: string, tier: 'normal' | 'big' | 'mega' = 'normal') {
    const el = this.els['win-toast'] as HTMLElement | null;
    if (el) {
      el.textContent = msg;
      el.classList.remove('big', 'mega');
      if (tier !== 'normal') el.classList.add(tier);
      el.classList.add('visible');
    }
  }
  hideWinToast() {
    const el = this.els['win-toast'] as HTMLElement | null;
    if (el) { el.classList.remove('visible'); }
  }

  renderHelpPaylines(paylines: number[][]) {
    const wrap = this.els['help-paylines'];
    if (!wrap) return;
    wrap.innerHTML = '';
    for (let idx = 0; idx < paylines.length; idx++) {
      const line = paylines[idx];
      const mini = document.createElement('div');
      mini.className = 'payline-mini';
      mini.title = `Line ${idx + 1}`;
      for (let row = 0; row < 3; row++) {
        for (let reel = 0; reel < 5; reel++) {
          const dot = document.createElement('div');
          dot.className = 'payline-dot' + (line[reel] === row ? ' active' : '');
          mini.appendChild(dot);
        }
      }
      wrap.appendChild(mini);
    }
  }

  renderPaytable() {
    // implemented in app.ts
  }

  showKeypad() {
    const m = this.els['keypad-modal'];
    if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }
  hideKeypad() {
    const m = this.els['keypad-modal'];
    if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
  }
  setKeypadStatus(msg: string) {
    const el = this.els['keypad-status'] as HTMLElement | null;
    if (el) el.textContent = msg;
  }
  setKeypadDisplay(code: string) {
    const el = this.els['keypad-display'] as HTMLElement | null;
    if (el) el.textContent = code || '_ _ _ _';
  }
  setKeypadTimer(count: number) {
    const el = this.els['keypad-timer'] as HTMLElement | null;
    if (el) el.textContent = `⏱️ ${count}s`;
  }
  setKeypadReward(msg: string) {
    const el = this.els['keypad-reward'] as HTMLElement | null;
    if (el) { el.textContent = msg; el.classList.toggle('hidden', !msg); }
  }
  /* Mastermind-style hint log. Each guess: array of {digit, kind} where
     kind = 'exact' (right digit, right spot) | 'near' (right digit, wrong spot) | 'miss' */
  addKeypadHint(guess: string, kinds: ('exact' | 'near' | 'miss')[]) {
    const el = this.els['keypad-hints'] as HTMLElement | null;
    if (!el) return;
    const row = document.createElement('div');
    row.className = 'hint-row';
    for (let i = 0; i < guess.length; i++) {
      const d = document.createElement('span');
      d.className = `hint-digit ${kinds[i]}`;
      d.textContent = guess[i];
      row.appendChild(d);
    }
    el.appendChild(row);
    el.scrollTop = el.scrollHeight;
  }
  clearKeypadHints() {
    const el = this.els['keypad-hints'] as HTMLElement | null;
    if (el) el.innerHTML = '';
  }
  showCrew() {
    const m = this.els['crew-modal'];
    if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }
  hideCrew() {
    const m = this.els['crew-modal'];
    if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
  }
  /* Renders crew rows with a Hire button (or HIRED state). onHire is called with the crew id. */
  renderCrew(defs: { id: string; icon: string; name: string; role: string; desc: string; cost: number }[],
            hired: string[], bank: number, onHire: (id: string) => void) {
    const list = this.els['crew-list'] as HTMLElement | null;
    if (!list) return;
    list.innerHTML = '';
    for (const c of defs) {
      const has = hired.includes(c.id);
      const afford = bank >= c.cost;
      const row = document.createElement('div');
      row.className = 'achievement-row crew-row' + (has ? ' unlocked' : '');
      const action = has
        ? `<span class="ach-state">✓</span>`
        : `<button class="chip-btn crew-hire" data-id="${c.id}" ${afford ? '' : 'disabled'}>Hire $${c.cost}</button>`;
      row.innerHTML = `<span class="ach-icon">${c.icon}</span><span class="ach-text"><strong>${c.name}</strong> <small>· ${c.role}</small><br><small>${c.desc}</small></span>${action}`;
      list.appendChild(row);
    }
    for (const btn of Array.from(list.querySelectorAll('.crew-hire'))) {
      btn.addEventListener('click', () => onHire((btn as HTMLElement).dataset.id || ''));
    }
  }
  showAchievements() {
    const m = this.els['achievements-modal'];
    if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }
  hideAchievements() {
    const m = this.els['achievements-modal'];
    if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
  }
  renderAchievements(defs: { id: string; icon: string; name: string; desc: string }[], unlocked: string[]) {
    const list = this.els['achievements-list'] as HTMLElement | null;
    if (!list) return;
    list.innerHTML = '';
    for (const a of defs) {
      const has = unlocked.includes(a.id);
      const row = document.createElement('div');
      row.className = 'achievement-row' + (has ? ' unlocked' : ' locked');
      row.innerHTML = `<span class="ach-icon">${a.icon}</span><span class="ach-text"><strong>${a.name}</strong><br><small>${a.desc}</small></span><span class="ach-state">${has ? '✓' : '🔒'}</span>`;
      list.appendChild(row);
    }
  }
  laserFlash() {
    const el = this.els['keypad-laser-overlay'] as HTMLElement | null;
    if (el) {
      el.classList.remove('active');
      void el.offsetWidth; // reflow
      el.classList.add('active');
    }
  }
}

function getEmoji(sym: SymbolType): string {
  const map: Record<SymbolType, string> = {
    diamond: '💎', goldbar: '🥇', vault: '🚪', cash: '💵',
    coin: '🪙', badge: '🛡️', drill: '🔩', bell: '🔔', dial: '🎛️',
  };
  return map[sym] || '❓';
}
