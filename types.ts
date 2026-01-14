
export interface Entity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'buy' | 'sell' | 'hype' | 'rekt';
  isSliced: boolean;
}

export interface GameState {
  score: number;
  combo: number;
  gameOver: boolean;
  highScore: number;
  gameStarted: boolean;
  sentiment: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
