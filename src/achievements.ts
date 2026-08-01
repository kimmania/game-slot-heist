export interface Achievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win',      icon: '💵', name: 'First Score',      desc: 'Win your first payout' },
  { id: 'big-win',        icon: '🎉', name: 'Big Score',        desc: 'Land a BIG WIN (×25 bet or more)' },
  { id: 'mega-win',       icon: '💰', name: 'Mega Score',       desc: 'Land a MEGA WIN (×100 bet or more)' },
  { id: 'free-spins',     icon: '🔔', name: 'Bell Ringer',      desc: 'Trigger Free Spins' },
  { id: 'vault-break',    icon: '🔐', name: 'Vault Cracker',    desc: 'Trigger a Vault Break' },
  { id: 'vault-cashout',  icon: '💎', name: 'Clean Getaway',    desc: 'Cash out of a Vault Break early' },
  { id: 'vault-1000',     icon: '🏦', name: 'Master Thief',     desc: 'Escape a Vault Break with $1,000+' },
  { id: 'wheel-spin',     icon: '🎡', name: 'Wheel Watcher',    desc: 'Spin the Mystery Wheel' },
  { id: 'keypad-win',     icon: '🔢', name: 'Code Breaker',     desc: 'Crack the loot chest code' },
  { id: 'level-5',        icon: '⭐', name: 'Made Man',         desc: 'Reach level 5' },
  { id: 'level-10',       icon: '🌟', name: 'Kingpin',          desc: 'Reach level 10' },
  { id: 'hot-streak',     icon: '🔥', name: 'Hot Streak',       desc: 'Fill the heat meter to 100%' },
];
