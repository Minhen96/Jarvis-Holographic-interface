export enum ParticleShape {
  SPHERE = 'SPHERE',
  CUBE = 'CUBE',
  TORUS = 'TORUS',
  GALAXY = 'GALAXY',
  BIG_BANG = 'BIG_BANG'
}

export interface HandData {
  x: number; // Normalized -1 to 1
  y: number; // Normalized -1 to 1
  isDetected: boolean;
  isClenched: boolean; // True if fist is closed
  handSpread: number; // 0 to 1 (0 = Fist, 1 = Wide Open)
}

export interface ParticleConfig {
  color: string;
  count: number;
  size: number;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      pointsMaterial: any;
      ambientLight: any;
      pointLight: any;
      color: any;
    }
  }
}