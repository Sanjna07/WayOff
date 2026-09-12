import * as THREE from 'three';
import { C } from './constants.js';
import { addProceduralTree } from './proceduralTree.js';
import { SAMPLE_BUILDINGS } from '../../data/sampleBuildings.js';

/* ═══════════════════════════════════════════════════════════════════
   CITY INFRASTRUCTURE
   Ground · Roads · Roundabout · Crossings · Signals · Bus Stands
   ═══════════════════════════════════════════════════════════════════ */

export function createInfrastructure(scene, mats) {
  const group = new THREE.Group();
  scene.add(group);

  /* ─── Ground ─── */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), mats.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  /* ─── Main Roads ─── */
  // Horizontal (z = 0)
  const hR = new THREE.Mesh(new THREE.BoxGeometry(160, 0.06, 8), mats.road);
  hR.position.set(0, 0.03, 0); hR.receiveShadow = true; group.add(hR);

  // Vertical (x = 0)
  const vR = new THREE.Mesh(new THREE.BoxGeometry(8, 0.06, 160), mats.road);
  vR.position.set(0, 0.03, 0); vR.receiveShadow = true; group.add(vR);

  /* ─── Sidewalks & curbs (H-road) ─── */
  [-4.5, 4.5].forEach(z => {
    [-45, 45].forEach(cx => {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(70, 0.12, 1.8), mats.tileSidewalk);
      sw.position.set(cx, 0.06, z); sw.receiveShadow = true; group.add(sw);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(70, 0.16, 0.2), mats.concrete);
      curb.position.set(cx, 0.08, z > 0 ? z - 0.8 : z + 0.8); group.add(curb);
    });
  });

  /* ─── Sidewalks & curbs (V-road) ─── */
  [-4.5, 4.5].forEach(x => {
    [-45, 45].forEach(cz => {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 70), mats.tileSidewalk);
      sw.position.set(x, 0.06, cz); sw.receiveShadow = true; group.add(sw);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 70), mats.concrete);
      curb.position.set(x > 0 ? x - 0.8 : x + 0.8, 0.08, cz); group.add(curb);
    });
  });

  /* ─── Secondary roads ─── */
  [-45, 40].forEach(sz => {
    const sr = new THREE.Mesh(new THREE.BoxGeometry(160, 0.05, 4), mats.road);
    sr.position.set(0, 0.035, sz); sr.receiveShadow = true; group.add(sr);
    [-2.1, 2.1].forEach(cz => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(160, 0.1, 0.2), mats.concrete);
      c.position.set(0, 0.05, sz + cz); group.add(c);
    });
  });

  /* ─── Lane markings ─── */
  const laneMat = mats.lane;
  for (let i = -70; i <= 70; i += 8) {
    if (Math.abs(i) > 10) {
      const hL = new THREE.Mesh(new THREE.BoxGeometry(4, 0.07, 0.18), laneMat);
      hL.position.set(i, 0.07, 0); group.add(hL);
      const vL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 4), laneMat);
      vL.position.set(0, 0.07, i); group.add(vL);
    }
  }

  /* ─── ROUNDABOUT ─── */
  createRoundabout(group, mats);

  /* ─── Zebra crossings ─── */
  const zebraMat = new THREE.MeshStandardMaterial({ color: '#f0e8d8' });
  [{ x: 0, z: 10 }, { x: 0, z: -10 }, { x: 10, z: 0 }, { x: -10, z: 0 }].forEach(pos => {
    const isH = pos.x === 0;
    for (let i = -3; i <= 3; i += 1.4) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(isH ? 0.9 : 2.5, 0.08, isH ? 2.5 : 0.9), zebraMat
      );
      stripe.position.set(pos.x + (isH ? i : 0), 0.05, pos.z + (isH ? 0 : i));
      group.add(stripe);
    }
  });

  /* ─── Traffic signals ─── */
  createTrafficSignals(group);

  /* ─── Bus stands ─── */
  createBusStands(group, mats);

  /* ─── Street lamps ─── */
  createLampposts(group);

  /* ─── Trees along sidewalks ─── */
  const treeSpots = [];
  for (let i = -60; i <= 60; i += 14) {
    if (Math.abs(i) > 10) {
      treeSpots.push([i, -6.5], [i, 6.5], [-6.5, i], [6.5, i]);
    }
  }

  const validSpots = treeSpots.filter(([tx, tz]) => {
    for (const b of SAMPLE_BUILDINGS) {
      const p = b.scenePosition;
      const w = b.w || (b.type === 'railway' ? 24 : 16);
      const d = b.d || (b.type === 'railway' ? 12 : 12);
      if (Math.abs(tx - p.x) < (w / 2 + 1) && Math.abs(tz - p.z) < (d / 2 + 1)) {
        return false;
      }
    }
    return true;
  });

  validSpots.forEach(([tx, tz]) => addProceduralTree(group, tx, tz, 0.8 + Math.random() * 0.4));

  return group;
}

/* ═══════════════════════════════════════════════════════════════════
   ROUNDABOUT — ring road + landscaped center island
   ═══════════════════════════════════════════════════════════════════ */

function createRoundabout(group, mats) {
  // Ring road (flat ring lying on XZ)
  const ringGeo = new THREE.RingGeometry(5, 9, 48);
  ringGeo.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, mats.road);
  ring.position.y = 0.05;
  ring.receiveShadow = true;
  group.add(ring);

  // Lane marking circle
  const markGeo = new THREE.RingGeometry(6.8, 7.0, 48);
  markGeo.rotateX(-Math.PI / 2);
  const markMat = new THREE.MeshStandardMaterial({ color: '#f0e8d8' });
  const markMesh = new THREE.Mesh(markGeo, markMat);
  markMesh.position.set(0, 0.06, 0);
  group.add(markMesh);

  // Outer edge marking
  const outerGeo = new THREE.RingGeometry(8.85, 9.0, 48);
  outerGeo.rotateX(-Math.PI / 2);
  const outerMesh = new THREE.Mesh(outerGeo, markMat);
  outerMesh.position.set(0, 0.06, 0);
  group.add(outerMesh);

  // Raised center island
  const islandMat = new THREE.MeshStandardMaterial({ color: C.grass, roughness: 0.9 });
  const island = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.3, 48), islandMat);
  island.position.y = 0.15; island.receiveShadow = true; group.add(island);

  // Stone curb around island
  const curbGeo = new THREE.TorusGeometry(5, 0.12, 8, 48);
  curbGeo.rotateX(Math.PI / 2);
  const curb = new THREE.Mesh(curbGeo, mats.concrete);
  curb.position.y = 0.3; group.add(curb);

  // Fountain — base
  const fBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.4, 24), mats.concrete);
  fBase.position.y = 0.5; group.add(fBase);

  // Fountain — water pool
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.35, 24), mats.water);
  pool.position.y = 0.52; group.add(pool);

  // Fountain — tier 2
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 0.6, 16), mats.concrete);
  tier2.position.y = 0.9; group.add(tier2);

  // Fountain — spout
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 1.0, 8), mats.concrete);
  spout.position.y = 1.4; group.add(spout);

  // Flower beds in a ring around fountain
  const flowerColors = ['#e85d75', '#f0a030', '#d4e040', '#e080c0', '#ff8866'];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const r = 3.0 + Math.random() * 0.8;
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.18 + Math.random() * 0.1, 6, 6),
      new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length] })
    );
    flower.position.set(Math.cos(a) * r, 0.38, Math.sin(a) * r);
    group.add(flower);
  }

  // Small ornamental trees on the island
  addProceduralTree(group, 1.8, 1.5, 1.1);
  addProceduralTree(group, -1.8, -1.5, 0.9);
}

/* ═══════════════════════════════════════════════════════════════════
   TRAFFIC SIGNALS
   ═══════════════════════════════════════════════════════════════════ */

function createTrafficSignals(group) {
  const poleMat = new THREE.MeshStandardMaterial({ color: '#3a3a3a', metalness: 0.5 });
  const redMat  = new THREE.MeshBasicMaterial({ color: '#ff3333' });
  const yelMat  = new THREE.MeshBasicMaterial({ color: '#ffdd33' });
  const grnMat  = new THREE.MeshBasicMaterial({ color: '#33dd55' });

  [[10, 10], [-10, 10], [10, -10], [-10, -10]].forEach(([px, pz]) => {
    // Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6), poleMat);
    pole.position.set(px, 2.25, pz); pole.castShadow = true; group.add(pole);

    // Housing
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.35), poleMat);
    box.position.set(px, 4.1, pz); group.add(box);

    // Lights
    const dx = px > 0 ? 0.18 : -0.18;
    const r = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), redMat);
    r.position.set(px + dx, 4.45, pz); group.add(r);
    const y = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), yelMat);
    y.position.set(px + dx, 4.1, pz); group.add(y);
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), grnMat);
    g.position.set(px + dx, 3.75, pz); group.add(g);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   BUS STANDS
   ═══════════════════════════════════════════════════════════════════ */

function createBusStands(group, mats) {
  const standMat = new THREE.MeshStandardMaterial({ color: '#b8a890', metalness: 0.6, roughness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#a8c8e8', transparent: true, opacity: 0.35 });

  [[-15, -6], [15, -6], [-15, 6], [15, 6]].forEach(([bx, bz]) => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 2), standMat);
    base.position.set(bx, 0.1, bz); group.add(base);

    const back = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 0.1), glassMat);
    back.position.set(bx, 1.35, bz + (bz > 0 ? 0.9 : -0.9)); group.add(back);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.2, 2.5), standMat);
    roof.position.set(bx, 2.6, bz); group.add(roof);

    // Support poles
    [-2.8, 2.8].forEach(ox => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5), standMat);
      p.position.set(bx + ox, 1.35, bz - (bz > 0 ? 0.9 : -0.9)); group.add(p);
    });

    // Bench
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.1, 0.7),
      new THREE.MeshStandardMaterial({ color: '#8a6d4a' })
    );
    bench.position.set(bx, 0.55, bz); group.add(bench);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   LAMPPOSTS — warm glow aesthetic
   ═══════════════════════════════════════════════════════════════════ */

function createLampposts(group) {
  const poleMat = new THREE.MeshStandardMaterial({ color: '#4a4a4a', metalness: 0.5, roughness: 0.4 });
  const lampMat = new THREE.MeshStandardMaterial({
    color: '#ffd78f', emissive: '#ffa040', emissiveIntensity: 0.35,
  });

  const spots = [];
  for (let i = -55; i <= 55; i += 22) {
    if (Math.abs(i) > 10) {
      spots.push([i, -6.2], [i, 6.2]);
    }
  }

  spots.forEach(([x, z]) => {
    // Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.8, 6), poleMat);
    pole.position.set(x, 1.9, z); pole.castShadow = true; group.add(pole);

    // Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), poleMat);
    arm.position.set(x + (z > 0 ? -0.35 : 0.35), 3.8, z); group.add(arm);

    // Lamp housing
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), lampMat);
    lamp.position.set(x + (z > 0 ? -0.6 : 0.6), 3.7, z); group.add(lamp);
  });
}
