import type { SymbolType } from './types';

export class UI {
  els: Record<string, HTMLElement | null> = {};

  constructor() {
    const ids = [
      'balance','level','xp-fill','reels','bet-amount','bet-minus','bet-plus','spin','turbo','info-btn',
      'bet-chips','recent-wins','help-modal','help-dismiss','help-paylines','paytable-modal','paytable-close','paytable',
      'vault-break','vault-status','vault-grid','vault-total','vault-done',
      'wheel-modal','wheel','wheel-spin','wheel-result','message-toast',
    ];
    for (const id of ids) {
      this.els[id] = document.getElementById(id);
    }
  }

  updateBalance(val: number, animate = false) {
    const el = this.els['balance'] as HTMLElement;
    if (!el) return;
    const target = el.textContent || '';
    if (!animate) {
      el.textContent = `$${Math.floor(val).toLocaleString()}`;
      return;
    }
    // simple count-up
    const start = parseInt(target.replace(/[^0-9-]/g, ''), 10) || 0;
    const end = Math.floor(val);
    const dur = 600;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const cur = Math.floor(start + (end - start) * p);
      el.textContent = `$${cur.toLocaleString()}`;
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
      }
    }
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
}

function getEmoji(sym: SymbolType): string {
  const map: Record<SymbolType, string> = {
    diamond: '💎', goldbar: '🥇', vault: '🚪', cash: '💵',
    coin: '🪙', badge: '🛡️', drill: '🔩', bell: '🔔', dial: '🎛️',
  };
  return map[sym] || '❓';
}
