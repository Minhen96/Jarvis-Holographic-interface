import * as THREE from 'three';

export const COLORS = {
  background: '#050505',
  primary: '#00f3ff', // Cyan
  hot: '#ffffff',     // White
  danger: '#ff003c',  // Red (for errors/alerts)
};

export const PARTICLE_COUNTS = {
  CORE: 75000,
  AURA: 4000,
};

export const CAMERA_CONFIG = {
  fov: 45,
  position: [0, 0, 30] as [number, number, number],
};

export const THREE_COLOR_PRIMARY = new THREE.Color(COLORS.primary);
export const THREE_COLOR_HOT = new THREE.Color(COLORS.hot);
