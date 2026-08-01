export interface CrewMember {
  id: string;
  icon: string;
  name: string;
  role: string;
  desc: string;
  cost: number;
}

export const CREW: CrewMember[] = [
  { id: 'hacker', icon: '🧑‍💻', name: 'The Hacker', role: 'Electronics', desc: '+15s on the loot chest code timer', cost: 500 },
  { id: 'muscle', icon: '💪', name: 'The Muscle', role: 'Enforcer', desc: 'Absorbs one buzzer per Vault Break', cost: 750 },
  { id: 'driver', icon: '🚗', name: 'The Driver', role: 'Getaway', desc: '+10% on every reel win', cost: 1000 },
];
