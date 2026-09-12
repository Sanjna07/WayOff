import * as THREE from 'three';
import { C } from './constants.js';
import { addProceduralTree } from './proceduralTree.js';

/* ═══════════════════════════════════════════════════════════════════
   PUBLIC BUILDINGS — Park · Railway · Town Hall
   Full interiors designed for FPS walk-through
   ═══════════════════════════════════════════════════════════════════ */

export function createPublicBuildings(buildings, scene, mats, allMeshes, buildingMeta) {
  buildings.filter(b => b.isPublic && b.type !== 'bus_stop').forEach(b => {
    const p = b.scenePosition;
    const group = new THREE.Group();
    group.position.set(p.x, 0, p.z);
    scene.add(group);

    // Driveways connecting to secondary roads
    if (b.type !== 'railway') {
      const driveMat = new THREE.MeshStandardMaterial({ color: '#6a6558', roughness: 0.95 });
      const nearZ = [-45, 40].reduce((pr, c) => Math.abs(c - p.z) < Math.abs(pr - p.z) ? c : pr);
      const len = Math.abs(p.z - nearZ);
      if (len > 1 && Math.abs(p.x) > 6) {
        const drive = new THREE.Mesh(new THREE.BoxGeometry(4, 0.038, len), driveMat);
        drive.position.set(p.x, 0.038, (p.z + nearZ) / 2);
        drive.receiveShadow = true;
        scene.add(drive);
      }
    }

    const bMeta = [];
    let currentY = 0;

    if (b.type === 'park') {
      currentY = buildPark(b, p, group, allMeshes, bMeta, mats);
    } else if (b.type === 'railway') {
      currentY = buildRailway(b, p, group, allMeshes, bMeta, mats);
    } else if (b.type === 'town_hall') {
      currentY = buildTownHall(b, p, group, allMeshes, bMeta, mats);
    }

    buildingMeta.set(b.parcelId, {
      position: p, totalHeight: currentY, group, meta: bMeta, isPublic: true, bData: b,
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   PARK — winding paths, fountain, pond, gazebo, hedges, benches
   ═══════════════════════════════════════════════════════════════════ */

function buildPark(b, p, group, allMeshes, bMeta, mats) {
  const parkMat  = new THREE.MeshStandardMaterial({ color: '#72a84a', roughness: 0.9 });
  const pathMat  = new THREE.MeshStandardMaterial({ color: '#c8bca0' });
  const hedgeMat = new THREE.MeshStandardMaterial({ color: '#1a5c28' });
  const woodMat  = new THREE.MeshStandardMaterial({ color: '#5c3015' });

  // Base grass
  const base = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 16), parkMat);
  base.position.y = 0.1; base.receiveShadow = true;
  base.userData = { parcelId: b.parcelId, ulpin: b.floors[0].ulpin, type: 'floor', height: 0.2 };
  group.add(base);
  allMeshes.push(base);
  bMeta.push({ mesh: base, isRoof: false, floorLevel: 1 });

  // ── Perimeter hedges ──
  const hedgeSpec = [
    { s: [16, 0.9, 0.5], p: [0, 0.45, 7.75] },
    { s: [16, 0.9, 0.5], p: [0, 0.45, -7.75] },
    { s: [0.5, 0.9, 15], p: [7.75, 0.45, 0] },
    { s: [0.5, 0.9, 15], p: [-7.75, 0.45, 0] },
  ];
  hedgeSpec.forEach(({ s, p: pos }) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(...s), hedgeMat);
    h.position.set(...pos); group.add(h);
    bMeta.push({ mesh: h, isRoof: false, floorLevel: 1 });
  });

  // Gate openings (gaps in front hedge)
  const gate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.1), new THREE.MeshStandardMaterial({ color: '#8a6d4a', metalness: 0.5 }));
  gate.position.set(-1.0, 0.6, 7.75); group.add(gate);
  const gate2 = gate.clone(); gate2.position.x = 1.0; group.add(gate2);

  // ── Paths (cross + circle center) ──
  const path1 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.22, 2.2), pathMat);
  path1.position.y = 0.11; path1.receiveShadow = true; group.add(path1);
  const path2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 16), pathMat);
  path2.position.y = 0.11; path2.receiveShadow = true; group.add(path2);
  const centerPlaza = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.23, 32), pathMat);
  centerPlaza.position.y = 0.115; centerPlaza.receiveShadow = true; group.add(centerPlaza);

  // ── Multi-tiered fountain ──
  const concMat = mats.concrete;
  const waterMat = mats.water;

  const fBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.4, 32), concMat);
  fBase.position.y = 0.2; group.add(fBase);
  bMeta.push({ mesh: fBase, isRoof: false, floorLevel: 1 });

  const fW1 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.42, 32), waterMat);
  fW1.position.y = 0.21; group.add(fW1);
  bMeta.push({ mesh: fW1, isRoof: false, floorLevel: 1 });

  const fT2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.8, 16), concMat);
  fT2.position.y = 0.6; group.add(fT2);
  bMeta.push({ mesh: fT2, isRoof: false, floorLevel: 1 });

  const fW2 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.85, 16), waterMat);
  fW2.position.y = 0.62; group.add(fW2);
  bMeta.push({ mesh: fW2, isRoof: false, floorLevel: 1 });

  const fSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 1.5), concMat);
  fSpout.position.y = 0.95; group.add(fSpout);
  bMeta.push({ mesh: fSpout, isRoof: false, floorLevel: 1 });

  // ── Pond with stepping-stone bridge ──
  const pondMat = new THREE.MeshStandardMaterial({ color: '#4ab8d0', transparent: true, opacity: 0.7, roughness: 0.1 });
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.15, 24), pondMat);
  pond.position.set(-4.5, 0.12, -4.5); group.add(pond);
  bMeta.push({ mesh: pond, isRoof: false, floorLevel: 1 });

  // Stepping stones across the pond
  for (let i = -1.5; i <= 1.5; i += 1) {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 8), concMat);
    stone.position.set(-4.5 + i, 0.22, -4.5); group.add(stone);
    bMeta.push({ mesh: stone, isRoof: false, floorLevel: 1 });
  }

  // ── Gazebo ──
  const gazeboX = 4.5, gazeboZ = -4.5;
  // Base platform
  const gBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.2, 6), woodMat);
  gBase.position.set(gazeboX, 0.3, gazeboZ); group.add(gBase);
  bMeta.push({ mesh: gBase, isRoof: false, floorLevel: 1 });

  // Pillars
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = gazeboX + Math.cos(a) * 1.5;
    const pz = gazeboZ + Math.sin(a) * 1.5;
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2), woodMat);
    pil.position.set(px, 1.4, pz); group.add(pil);
    bMeta.push({ mesh: pil, isRoof: false, floorLevel: 1 });
  }

  // Gazebo roof
  const gRoof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.0, 6), new THREE.MeshStandardMaterial({ color: '#8a3a1a' }));
  gRoof.position.set(gazeboX, 2.9, gazeboZ); group.add(gRoof);
  bMeta.push({ mesh: gRoof, isRoof: false, floorLevel: 1 });

  // ── Trees (procedural) ──
  const treePos = [
    [-5, -5], [-3, -6], [-6, -3], [5, 5], [3, 6], [6, 3],
    [-5, 5], [-3, 6], [-6, 3], [5, -5], [3, -6], [6, -3],
  ];
  treePos.forEach(([tx, tz]) => {
    const tree = addProceduralTree(group, tx, tz, 0.6 + Math.random() * 0.3);
    bMeta.push({ mesh: tree, isRoof: false, floorLevel: 1 });
  });

  // ── Flower beds along paths ──
  const flowerColors = ['#e85d75', '#f0a030', '#e080c0', '#d4e040', '#ff8866'];
  [[-5.5, 1.5], [5.5, 1.5], [-5.5, -1.5], [5.5, -1.5], [1.5, 5.5], [1.5, -5.5], [-1.5, 5.5], [-1.5, -5.5]].forEach(([fx, fz]) => {
    for (let i = 0; i < 5; i++) {
      const f = new THREE.Mesh(
        new THREE.SphereGeometry(0.12 + Math.random() * 0.08, 6, 6),
        new THREE.MeshStandardMaterial({ color: flowerColors[(i + Math.floor(fx * 10)) % flowerColors.length] })
      );
      f.position.set(fx + (Math.random() - 0.5) * 1.5, 0.25, fz + (Math.random() - 0.5) * 1.5);
      group.add(f);
    }
  });

  // ── Benches ──
  [[-3.5, 0], [3.5, 0], [0, 3.5], [0, -3.5]].forEach(([bx, bz], idx) => {
    const bg = new THREE.Group();
    bg.position.set(bx, 0.3, bz);
    if (idx > 1) bg.rotation.y = Math.PI / 2;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.45), woodMat);
    bg.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.08), woodMat);
    back.position.set(0, 0.27, -0.18); bg.add(back);

    // Legs
    [[-0.6, 0.15], [0.6, 0.15]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), new THREE.MeshStandardMaterial({ color: '#333' }));
      leg.position.set(lx, -0.2, lz); bg.add(leg);
    });

    group.add(bg);
    bg.children.forEach(c => bMeta.push({ mesh: c, isRoof: false, floorLevel: 1 }));
  });

  return 3;
}

/* ═══════════════════════════════════════════════════════════════════
   RAILWAY — platforms, tracks, train, overbridge, arch roof
   ═══════════════════════════════════════════════════════════════════ */

function buildRailway(b, p, group, allMeshes, bMeta, mats) {
  const platformMat = new THREE.MeshStandardMaterial({ color: '#c8bea8' });
  const steelMat    = new THREE.MeshStandardMaterial({ color: '#5a6a7a', metalness: 0.6 });
  const trainMat    = new THREE.MeshStandardMaterial({ color: '#0e8acc', metalness: 0.5, roughness: 0.2 });
  const tileMat     = new THREE.MeshStandardMaterial({ color: '#f0ebe0' });
  const safetyMat   = new THREE.MeshStandardMaterial({ color: '#d4a020' });
  const wallMat     = new THREE.MeshStandardMaterial({ color: '#8a9aaa' });
  const benchMat    = new THREE.MeshStandardMaterial({ color: '#2a3040' });
  const glassMat    = mats.glass;

  const f1 = b.floors[0];
  const f2 = b.floors[1];

  // ── Platform A ──
  const baseA = new THREE.Mesh(new THREE.BoxGeometry(24, 0.8, 6), platformMat);
  baseA.position.set(0, 0.4, 6); baseA.receiveShadow = true;
  baseA.userData = { parcelId: b.parcelId, ulpin: f1.ulpin, type: 'floor', height: f1.height };
  group.add(baseA); allMeshes.push(baseA);
  bMeta.push({ mesh: baseA, isRoof: false, floorLevel: 1 });

  // ── Platform B ──
  const baseB = new THREE.Mesh(new THREE.BoxGeometry(24, 0.8, 6), platformMat);
  baseB.position.set(0, 0.4, -6); baseB.receiveShadow = true;
  baseB.userData = { parcelId: b.parcelId, ulpin: f1.ulpin, type: 'floor', height: f1.height };
  group.add(baseB); allMeshes.push(baseB);
  bMeta.push({ mesh: baseB, isRoof: false, floorLevel: 1 });

  // ── Indoor details (tiled floors, safety lines, etc.) ──
  // Platform floor overlays
  const pFA = new THREE.Mesh(new THREE.BoxGeometry(23.8, 0.05, 5.8), tileMat);
  pFA.position.set(0, 0.82, 6); group.add(pFA);
  bMeta.push({ mesh: pFA, isRoof: false, floorLevel: 1, showInIndoor: true });

  const pFB = new THREE.Mesh(new THREE.BoxGeometry(23.8, 0.05, 5.8), tileMat);
  pFB.position.set(0, 0.82, -6); group.add(pFB);
  bMeta.push({ mesh: pFB, isRoof: false, floorLevel: 1, showInIndoor: true });

  // Safety lines at platform edges
  const lineA = new THREE.Mesh(new THREE.BoxGeometry(23.8, 0.06, 0.3), safetyMat);
  lineA.position.set(0, 0.82, 3.2); group.add(lineA);
  bMeta.push({ mesh: lineA, isRoof: false, floorLevel: 1, showInIndoor: true });

  const lineB = new THREE.Mesh(new THREE.BoxGeometry(23.8, 0.06, 0.3), safetyMat);
  lineB.position.set(0, 0.82, -3.2); group.add(lineB);
  bMeta.push({ mesh: lineB, isRoof: false, floorLevel: 1, showInIndoor: true });

  // Ticketing turnstiles
  const gateGeo = new THREE.BoxGeometry(0.3, 1, 1.2);
  for (let x = -2; x <= 2; x += 1.2) {
    const gate = new THREE.Mesh(gateGeo, wallMat);
    gate.position.set(x, 1.3, 7.5); group.add(gate);
    bMeta.push({ mesh: gate, isRoof: false, floorLevel: 1, showInIndoor: true });
  }

  // Departure board
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.6, 0.2), new THREE.MeshStandardMaterial({ color: '#1a2030' }));
  board.position.set(-6, 2.0, 8); group.add(board);
  bMeta.push({ mesh: board, isRoof: false, floorLevel: 1, showInIndoor: true });

  // Board text panel (green indicator)
  const indicator = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.3, 0.05), new THREE.MeshBasicMaterial({ color: '#00cc44' }));
  indicator.position.set(-6, 2.0, 8.11); group.add(indicator);
  bMeta.push({ mesh: indicator, isRoof: false, floorLevel: 1, showInIndoor: true });

  // Platform number signs
  [[-10, 6], [-10, -6]].forEach(([sx, sz], i) => {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.15),
      new THREE.MeshStandardMaterial({ color: '#1a3a6a' })
    );
    sign.position.set(sx, 2.2, sz); group.add(sign);
    bMeta.push({ mesh: sign, isRoof: false, floorLevel: 1, showInIndoor: true });
  });

  // Vending machines
  [8, -8].forEach(sz => {
    const vm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.6),
      new THREE.MeshStandardMaterial({ color: '#d45050' })
    );
    vm.position.set(10, 1.7, sz); group.add(vm);
    bMeta.push({ mesh: vm, isRoof: false, floorLevel: 1, showInIndoor: true });
  });

  // Seating rows
  for (const z of [5, 7]) {
    for (const x of [-8, 6, 8]) {
      const rg = new THREE.Group(); rg.position.set(x, 1.0, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.6), benchMat); rg.add(base);
      for (let i = -0.75; i <= 0.75; i += 0.5) {
        const div = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.6), benchMat);
        div.position.set(i, 0.15, 0); rg.add(div);
      }
      group.add(rg);
      rg.children.forEach(c => bMeta.push({ mesh: c, isRoof: false, floorLevel: 1, showInIndoor: true }));
    }
  }

  // Ticketing building shell (hidden in indoor mode)
  const tck = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 5), mats.concrete);
  tck.position.set(0, 2.3, 6.5); tck.castShadow = true; group.add(tck);
  bMeta.push({ mesh: tck, isRoof: false, floorLevel: 1, hideInIndoor: true });

  // ── Tracks with ballast ──
  const mapLeft = 20, mapRight = 75;
  const localStart = mapLeft - p.x;
  const localEnd = mapRight - p.x;
  const trackW = mapRight - mapLeft;
  const trackC = (mapRight + mapLeft) / 2 - p.x;

  // Ballast bed
  const ballast = new THREE.Mesh(
    new THREE.BoxGeometry(trackW, 0.08, 3.5),
    new THREE.MeshStandardMaterial({ color: '#6a5a4a', roughness: 1 })
  );
  ballast.position.set(trackC, 0.04, 0); group.add(ballast);
  bMeta.push({ mesh: ballast, isRoof: false, floorLevel: 1, showInIndoor: true });

  const railGeo = new THREE.BoxGeometry(trackW, 0.1, 0.1);
  const r1 = new THREE.Mesh(railGeo, steelMat); r1.position.set(trackC, 0.12, 1); group.add(r1);
  const r2 = new THREE.Mesh(railGeo, steelMat); r2.position.set(trackC, 0.12, -1); group.add(r2);

  // Sleepers
  const sleeperGeo = new THREE.BoxGeometry(0.3, 0.06, 3);
  const sleeperMat = new THREE.MeshStandardMaterial({ color: '#3f2e1e' });
  for (let x = localStart; x <= localEnd; x += 1.5) {
    const slp = new THREE.Mesh(sleeperGeo, sleeperMat);
    slp.position.set(x, 0.06, 0); group.add(slp);
    bMeta.push({ mesh: slp, floorLevel: 1 });
  }

  // ── Train ──
  const trainG = new THREE.Group();
  const train = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 2.6), trainMat);
  train.position.set(0, 1.6, 0); train.castShadow = true; trainG.add(train);

  // Train windows
  for (let x = -7; x <= 7; x += 2) {
    const tw = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 2.7), glassMat);
    tw.position.set(x, 1.8, 0); trainG.add(tw);
  }

  // Train front (rounded nose)
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.6, 8, 1, false, 0, Math.PI),
    trainMat);
  nose.rotation.x = Math.PI / 2;
  nose.rotation.z = Math.PI / 2;
  nose.position.set(8.5, 1.6, 0); trainG.add(nose);

  group.add(trainG);
  trainG.children.forEach(c => bMeta.push({ mesh: c, floorLevel: 1 }));

  // ── Overbridge (Floor 2) ──
  const slabMat = mats.slab;
  const base2 = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 18), slabMat);
  base2.position.set(0, f1.height, 0); base2.castShadow = true;
  base2.userData = { parcelId: b.parcelId, ulpin: f2.ulpin, type: 'floor', height: f2.height };
  group.add(base2); allMeshes.push(base2);
  bMeta.push({ mesh: base2, isRoof: false, floorLevel: 2 });

  // Stairs
  const stairGeo = new THREE.BoxGeometry(2, f1.height, 4);
  const st1 = new THREE.Mesh(stairGeo, slabMat); st1.position.set(2, f1.height / 2, 6); group.add(st1);
  const st2 = new THREE.Mesh(stairGeo, slabMat); st2.position.set(2, f1.height / 2, -6); group.add(st2);

  // ── Arch roof ──
  const roofMat = new THREE.MeshStandardMaterial({ color: '#f0ebe0', transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  const roofGeo = new THREE.CylinderGeometry(11, 11, 24, 32, 1, true, 0, Math.PI);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.z = Math.PI / 2;
  roof.position.set(0, f1.height + f2.height, 0);
  group.add(roof);
  bMeta.push({ mesh: roof, isRoof: true, floorLevel: 3 });

  // Roof support pillars
  for (let x = -10; x <= 10; x += 10) {
    for (const z of [8, -8]) {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, f1.height + f2.height), steelMat);
      pil.position.set(x, (f1.height + f2.height) / 2, z);
      group.add(pil);
      bMeta.push({ mesh: pil, isRoof: true, floorLevel: 3 });
    }
  }

  return f1.height + f2.height + 11;
}

/* ═══════════════════════════════════════════════════════════════════
   TOWN HALL — pillars, dome, marble interior, podium, seating
   ═══════════════════════════════════════════════════════════════════ */

function buildTownHall(b, p, group, allMeshes, bMeta, mats) {
  const concMat = mats.concrete;
  const slabMat = mats.slab;
  const f1 = b.floors[0], f2 = b.floors[1], f3 = b.floors[2];

  // Plinth steps
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 14), slabMat);
  plinth.position.y = 0.3; plinth.receiveShadow = true; group.add(plinth);

  // Entrance steps
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 1), concMat);
    step.position.set(0, 0.1 + i * 0.2, 7.5 + i * 0.5); group.add(step);
  }

  // ── Floors F1-F3 ──
  const wallColor = new THREE.MeshStandardMaterial({ color: '#d8c8b0', roughness: 0.7, side: THREE.DoubleSide });
  let floorY = 0.6;
  [f1, f2, f3].forEach((f, i) => {
    const fm = new THREE.Mesh(new THREE.BoxGeometry(16, f.height, 12), wallColor);
    fm.position.y = floorY + f.height / 2;
    fm.userData = { parcelId: b.parcelId, ulpin: f.ulpin, type: 'floor', height: f.height };
    group.add(fm); allMeshes.push(fm);
    bMeta.push({ mesh: fm, isRoof: false, floorLevel: i + 1 });
    floorY += f.height;
  });

  // ── Interior details (visible in indoor mode) ──
  const woodDark  = new THREE.MeshStandardMaterial({ color: '#3a1a03' });
  const woodLight = new THREE.MeshStandardMaterial({ color: '#9a4a10' });
  const carpetMat = new THREE.MeshStandardMaterial({ color: '#8a1a1a' });
  const plantMat  = new THREE.MeshStandardMaterial({ color: '#1a6a30' });
  const floorMat  = new THREE.MeshStandardMaterial({ color: '#ece5d8' });
  const brassMat  = new THREE.MeshStandardMaterial({ color: '#d4a030', metalness: 0.8, roughness: 0.2 });

  // Marble floor
  const tFloor = new THREE.Mesh(new THREE.BoxGeometry(15.8, 0.05, 11.8), floorMat);
  tFloor.position.set(0, 0.625, 0); group.add(tFloor);
  bMeta.push({ mesh: tFloor, isRoof: false, floorLevel: 1, showInIndoor: true });

  // Red carpet from entrance to podium
  const carpet = new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 10), carpetMat);
  carpet.position.set(0, 0.66, 1); group.add(carpet);
  bMeta.push({ mesh: carpet, isRoof: false, floorLevel: 1, showInIndoor: true });

  // Mayor's podium
  const podiumBase = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 3), woodDark);
  podiumBase.position.set(0, 0.75, -4); group.add(podiumBase);
  bMeta.push({ mesh: podiumBase, isRoof: false, floorLevel: 1, showInIndoor: true });

  // Main desk
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.8), woodLight);
  desk.position.set(0, 1.3, -4); group.add(desk);
  bMeta.push({ mesh: desk, isRoof: false, floorLevel: 1, showInIndoor: true });

  // Flagpoles behind podium
  for (const x of [-2, 2]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2), brassMat);
    pole.position.set(x, 1.9, -5); group.add(pole);
    bMeta.push({ mesh: pole, isRoof: false, floorLevel: 1, showInIndoor: true });
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), carpetMat);
    flag.position.set(x + 0.4, 2.5, -5); group.add(flag);
    bMeta.push({ mesh: flag, isRoof: false, floorLevel: 1, showInIndoor: true });
  }

  // Trophy / display case
  const caseMat = new THREE.MeshStandardMaterial({ color: '#c8a060', metalness: 0.3, transparent: true, opacity: 0.7 });
  const trophy = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.6), caseMat);
  trophy.position.set(-6.5, 1.2, 0); group.add(trophy);
  bMeta.push({ mesh: trophy, isRoof: false, floorLevel: 1, showInIndoor: true });

  // Wall paintings / decorations
  const paintMat = new THREE.MeshStandardMaterial({ color: '#6a4a2a' });
  [[-7.8, -2], [-7.8, 2]].forEach(([wx, wz]) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 1.8), paintMat);
    frame.position.set(wx, 2.0, wz); group.add(frame);
    bMeta.push({ mesh: frame, isRoof: false, floorLevel: 1, showInIndoor: true });
  });

  // Assembly seating
  for (let z = -1; z <= 4; z += 1.5) {
    for (const x of [-4, -2.5, 2.5, 4]) {
      const sg = new THREE.Group(); sg.position.set(x, 0.85, z);
      if (x < 0) sg.rotation.y = 0.2;
      if (x > 0) sg.rotation.y = -0.2;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.5), woodDark); sg.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.1), woodDark);
      back.position.set(0, 0.3, -0.2); sg.add(back);
      group.add(sg);
      sg.children.forEach(c => bMeta.push({ mesh: c, isRoof: false, floorLevel: 1, showInIndoor: true }));
    }
  }

  // Indoor corridor pillars
  for (const x of [-5, 5]) {
    for (const z of [-3, 0, 3]) {
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, f1.height), concMat);
      p2.position.set(x, 0.6 + f1.height / 2, z); group.add(p2);
      bMeta.push({ mesh: p2, isRoof: false, floorLevel: 1, showInIndoor: true });
    }
  }

  // Potted plants at corners
  for (const x of [-6, 6]) {
    for (const z of [-4, 4]) {
      const pb = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.6), woodDark);
      pb.position.set(x, 0.9, z); group.add(pb);
      bMeta.push({ mesh: pb, isRoof: false, floorLevel: 1, showInIndoor: true });
      const pt = new THREE.Mesh(new THREE.SphereGeometry(0.8), plantMat);
      pt.position.set(x, 1.8, z); group.add(pt);
      bMeta.push({ mesh: pt, isRoof: false, floorLevel: 1, showInIndoor: true });
    }
  }

  // ── Exterior pillars (front facade) ──
  const totalBuildingH = f1.height + f2.height + f3.height;
  for (let x = -7.5; x <= 7.5; x += 3) {
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, totalBuildingH), concMat);
    pil.position.set(x, 0.6 + totalBuildingH / 2, 6.5);
    pil.castShadow = true; group.add(pil);
    bMeta.push({ mesh: pil, isRoof: false, floorLevel: 4 });
  }

  // ── Roof: pediment + dome ──
  const roofY = 0.6 + totalBuildingH;
  const pediment = new THREE.Mesh(new THREE.BoxGeometry(16.5, 2, 12.5), concMat);
  pediment.position.set(0, roofY + 1, 0); group.add(pediment);
  bMeta.push({ mesh: pediment, isRoof: true, floorLevel: 4 });

  const dome = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 16),
    new THREE.MeshStandardMaterial({ color: '#d4a030' }));
  dome.position.set(0, roofY + 3, 0); group.add(dome);
  bMeta.push({ mesh: dome, isRoof: true, floorLevel: 4 });

  return roofY + 6;
}
