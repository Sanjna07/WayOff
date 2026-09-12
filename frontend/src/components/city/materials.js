import * as THREE from 'three';
import { C } from './constants.js';

/* ═══════════════════════════════════════════════════════════════════
   TEXTURE GENERATOR
   ═══════════════════════════════════════════════════════════════════ */

export function getWindowTexture(rows, cols, color = '#4a3520', frame = '#2a1f15') {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = frame;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = color;
  const pad = 4;
  const w = (256 - (cols + 1) * pad) / cols;
  const h = (256 - (rows + 1) * pad) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillRect(pad + c * (w + pad), pad + r * (h + pad), w, h);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/* ═══════════════════════════════════════════════════════════════════
   SHARED MATERIAL FACTORY
   ═══════════════════════════════════════════════════════════════════ */

export function createMaterials() {
  const slab      = new THREE.MeshStandardMaterial({ color: C.slab, roughness: 0.85, metalness: 0.02 });
  const concrete  = new THREE.MeshStandardMaterial({ color: C.concrete, roughness: 0.9 });
  const glass     = new THREE.MeshStandardMaterial({ color: C.glass, roughness: 0.12, metalness: 0.55, transparent: true, opacity: 0.88 });
  const railing   = new THREE.MeshStandardMaterial({ color: C.railing, roughness: 0.5, metalness: 0.5 });
  const road      = new THREE.MeshStandardMaterial({ color: C.road, roughness: 0.88 });
  const sidewalk  = new THREE.MeshStandardMaterial({ color: C.sidewalk, roughness: 0.85 });
  const ground    = new THREE.MeshStandardMaterial({ color: C.ground, roughness: 0.95 });
  const lane      = new THREE.MeshStandardMaterial({ color: C.lane });
  const water     = new THREE.MeshStandardMaterial({ color: C.water, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.3 });

  // Window textures (warm tinted)
  const skyTex  = getWindowTexture(8, 4, '#d4a050', '#2a1f15');
  const skyMat  = new THREE.MeshStandardMaterial({ map: skyTex, roughness: 0.2, metalness: 0.3 });
  const comTex  = getWindowTexture(4, 8, '#c8a878', '#3a2a1a');
  const comMat  = new THREE.MeshStandardMaterial({ map: comTex, roughness: 0.4 });

  // Sidewalk tile texture
  const swTex         = getWindowTexture(16, 16, '#d4c8a8', '#a89878');
  const tileSidewalk  = new THREE.MeshStandardMaterial({ map: swTex, roughness: 0.9 });

  return {
    slab, concrete, glass, railing, road, sidewalk, ground, lane, water,
    skyMat, comMat, tileSidewalk,
  };
}
