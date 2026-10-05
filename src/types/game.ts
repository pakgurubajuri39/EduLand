export type GameView = 'TITLE' | 'VILLAGE' | 'LEVEL_SELECT' | 'PLAYING' | 'SUMMARY' | 'LORE';

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  isGliding: boolean;
  facing: 'left' | 'right';
  carriedBooks: number;
  health: number;
  maxHealth: number;
  invincibleTimer: number;
  bounceStreak: number;
  runFrame: number;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cardboard' | 'wood' | 'clover' | 'stone';
  label?: string;
  color?: string;
}

export interface BookmarkBridge {
  id: string;
  nodeX: number;
  nodeY: number;
  nodeRadius: number;
  bridgeX: number;
  bridgeY: number;
  bridgeWidth: number;
  bridgeHeight: number;
  isUnfolded: boolean;
  creaseTimer: number; // 4.0 seconds when unfolded
  maxTimer: number;
}

export interface ChimneyThermal {
  id: string;
  x: number;
  y: number; // base of chimney
  width: number;
  height: number; // updraft height
  chimneyWidth: number;
  chimneyHeight: number;
  updraftForce: number;
}

export interface AccordionPad {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  springHeight: number;
  compression: number; // 0 to 1 for visual bounce
}

export interface Pest {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minX: number;
  maxX: number;
  vx: number;
  type: 'bookworm' | 'silverfish' | 'inkblob';
  bumpTimer: number;
}

export interface GoldenBook {
  id: string;
  x: number;
  y: number;
  isSecret?: boolean;
  collected: boolean;
  bobOffset: number;
}

export interface LevelFlag {
  x: number;
  y: number;
  height: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  shape?: 'square' | 'circle' | 'sparkle' | 'leaf';
  rotation?: number;
  vRot?: number;
}

export type WeatherType = 'CONFETTI_BREEZE' | 'HEARTH_EMBER_MOTES' | 'INK_SQUALL' | 'GALE_GOLD_BLIZZARD';

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  vRot: number;
  shape: 'confetti' | 'ember' | 'ink_drop' | 'foil_flake' | 'leaf';
  swaySpeed: number;
  swayDist: number;
  seed: number;
}

export interface LevelData {
  id: number;
  title: string;
  zone: string;
  tagline: string;
  description: string;
  weather: WeatherType;
  worldWidth: number;
  worldHeight: number;
  playerStart: { x: number; y: number };
  platforms: Platform[];
  bookmarkBridges: BookmarkBridge[];
  chimneys: ChimneyThermal[];
  bouncePads: AccordionPad[];
  pests: Pest[];
  books: GoldenBook[];
  flag: LevelFlag;
  targetTime: number; // in seconds for 3-star time bonus
  requiredBooksFor3Star: number;
}

export interface LevelProgress {
  unlocked: boolean;
  stars: number; // 0-3
  highScore: number;
  bestTime: number | null;
  booksFound: number;
  totalBooks: number;
}

export interface VillageBuilding {
  id: 'atrium' | 'forge' | 'archive' | 'spire';
  name: string;
  subtitle: string;
  cost: number;
  isConstructed: boolean;
  description: string;
  perkTitle: string;
  perkDescription: string;
  unlockLevelId?: number;
}
