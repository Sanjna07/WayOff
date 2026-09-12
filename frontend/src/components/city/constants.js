import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════
   WARM GOLDEN-HOUR PALETTE
   ═══════════════════════════════════════════════════════════════════ */

export const C = {
  // Sky & atmosphere
  sky:       '#e8c9a0',
  fog:       '#e0c090',

  // Ground & infrastructure
  ground:    '#b5a88a',
  road:      '#3d3d3d',
  sidewalk:  '#d4c8a8',
  lane:      '#6b6b5e',
  concrete:  '#ddd5c4',
  slab:      '#cfc5ae',

  // Building elements
  glass:     '#4a3828',
  darkGlass: '#2a1f15',
  railing:   '#8a7d6e',

  // Nature
  grass:     '#6a8a42',
  water:     '#5bb8d4',
};

export const STATUS_COLORS = {
  registered: { wall: '#c9a87c', edge: '#8a6d4a' },
  disputed:   { wall: '#c46b5c', edge: '#8a3d30' },
  vacant:     { wall: '#b8b0a0', edge: '#847e6f' },
  selected:   { wall: '#e8b84a', edge: '#a07820' },
};

export const RESIDENTIAL_PALETTES = [
  { wall: '#c9a87c', edge: '#8a6d4a' },   // terracotta
  { wall: '#d4b896', edge: '#9a8060' },   // sand
  { wall: '#bfa78a', edge: '#8a7055' },   // clay
  { wall: '#c4b49a', edge: '#8a7d65' },   // wheat
];

export const OV_POS = new THREE.Vector3(50, 45, 50);
export const OV_TAR = new THREE.Vector3(0, 3, 0);
