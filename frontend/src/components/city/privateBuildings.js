import * as THREE from 'three';
import { STATUS_COLORS, RESIDENTIAL_PALETTES, C } from './constants.js';
import { addProceduralTree } from './proceduralTree.js';

/* ═══════════════════════════════════════════════════════════════════
   PRIVATE BUILDINGS
   Residential · Hospital · School · Skyscraper · Commercial / Mall
   ═══════════════════════════════════════════════════════════════════ */

export function createPrivateBuildings(buildings, scene, mats, allMeshes, buildingMeta) {
  buildings.filter(b => !b.isPublic).forEach(b => {
    const p = b.scenePosition;
    const group = new THREE.Group();
    group.position.set(p.x, 0, p.z);
    scene.add(group);

    // Driveway to nearest secondary road
    addDriveway(scene, p, mats);

    // Plaza / parking area
    const plazaMat = new THREE.MeshStandardMaterial({ color: '#928a7c', roughness: 0.95 });
    const plazaW = (p.w || 10) + 8, plazaD = (p.d || 8) + 8;
    const plaza = new THREE.Mesh(new THREE.BoxGeometry(plazaW, 0.04, plazaD), plazaMat);
    plaza.position.set(0, 0.02, 0); plaza.receiveShadow = true; group.add(plaza);

    // Corner trees
    [[plazaW / 2 - 1, plazaD / 2 - 1], [-plazaW / 2 + 1, plazaD / 2 - 1],
     [plazaW / 2 - 1, -plazaD / 2 + 1], [-plazaW / 2 + 1, -plazaD / 2 + 1]].forEach(([tx, tz]) => {
      if (Math.random() > 0.3) addProceduralTree(group, tx, tz, 0.7 + Math.random() * 0.4);
    });

    const bMeta = [];
    let totalHeight = p.h || 10;

    if (b.style === 'residential') {
      totalHeight = buildResidential(b, p, group, allMeshes, bMeta, mats);
    } else if (b.type === 'hospital') {
      totalHeight = buildHospital(b, p, group, allMeshes, bMeta, mats);
    } else if (b.type === 'school') {
      totalHeight = buildSchool(b, p, group, allMeshes, bMeta, mats);
    } else if (b.style === 'skyscraper') {
      totalHeight = buildSkyscraper(b, p, group, allMeshes, bMeta, mats);
    } else {
      totalHeight = buildCommercial(b, p, group, allMeshes, bMeta, mats);
    }

    buildingMeta.set(b.parcelId, {
      position: p, totalHeight, group, meta: bMeta, isPublic: false, bData: b,
    });
  });
}

/* ─── Driveway helper ─── */
function addDriveway(scene, p, mats) {
  const driveMat = new THREE.MeshStandardMaterial({ color: '#6a6558', roughness: 0.95 });
  const nearZ = [-45, 40].reduce((prev, c) => Math.abs(c - p.z) < Math.abs(prev - p.z) ? c : prev);
  const len = Math.abs(p.z - nearZ);
  if (len > 1 && Math.abs(p.x) > 6) {
    const drive = new THREE.Mesh(new THREE.BoxGeometry(4, 0.038, len), driveMat);
    drive.position.set(p.x, 0.038, (p.z + nearZ) / 2);
    drive.receiveShadow = true;
    scene.add(drive);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   RESIDENTIAL — detailed multi-floor with windows, balconies, canopy
   ═══════════════════════════════════════════════════════════════════ */

function buildResidential(b, p, group, allMeshes, bMeta, mats) {
  const boxW = 10, boxD = 8;

  const hash = b.parcelId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const palette = RESIDENTIAL_PALETTES[hash % RESIDENTIAL_PALETTES.length];

  const localStatus = { ...STATUS_COLORS, registered: palette };
  const UNDERGROUND = { wall: '#7d7568', edge: '#5f5848' };

  const glassMat = new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: 0.15, metalness: 0.5, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  const railMat = mats.railing;

  // Plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(boxW + 1.2, 0.3, boxD + 1.2), mats.slab);
  plinth.position.set(0, 0.15, 0); plinth.receiveShadow = true; group.add(plinth);

  let curY = 0.3;

  if (b.floors && Array.isArray(b.floors)) {
    b.floors.forEach((floor, fi) => {
      const fH = 3.2;
      const statusKey = String(floor.status || 'registered').toLowerCase();
      const pal = localStatus[statusKey] || localStatus.registered;

      const wallMat = new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 0.75, metalness: 0.05, side: THREE.DoubleSide });

      const fGeo = new THREE.BoxGeometry(boxW, fH, boxD);
      const fMesh = new THREE.Mesh(fGeo, wallMat);
      fMesh.castShadow = true; fMesh.receiveShadow = true;
      fMesh.position.set(0, curY + fH / 2, 0);
      fMesh.userData = { parcelId: b.parcelId, type: 'floor', ulpin: floor.ulpin };

      // Slab band
      const slabBand = new THREE.Mesh(new THREE.BoxGeometry(boxW + 0.45, 0.22, boxD + 0.45), mats.slab);
      slabBand.position.y = -fH / 2 + 0.11;
      fMesh.add(slabBand);

      // Windows
      const winH = fH * 0.42;
      const winY = fH * 0.06;
      const isGround = fi === 0;
      const frontXs = isGround ? [-3.4, 3.4] : [-3.4, -1.15, 1.15, 3.4];

      [1, -1].forEach(zSign => {
        const xs = zSign === 1 ? frontXs : [-3.4, -1.15, 1.15, 3.4];
        xs.forEach(x => {
          const win = new THREE.Mesh(new THREE.BoxGeometry(1.5, winH, 0.07), glassMat);
          win.position.set(x, winY, zSign * (boxD / 2 + 0.035));
          fMesh.add(win);
          const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.09), mats.concrete);
          lintel.position.set(x, winY + winH / 2 + 0.07, zSign * (boxD / 2 + 0.035));
          fMesh.add(lintel);
        });
      });

      // Side windows
      [1, -1].forEach(xSign => {
        [-2.4, 0, 2.4].forEach(z => {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.07, winH, 1.4), glassMat);
          win.position.set(xSign * (boxW / 2 + 0.035), winY, z);
          fMesh.add(win);
        });
      });

      // Balconies (upper floors)
      if (!isGround) {
        [-2.3, 2.3].forEach(x => {
          const bFloor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.05), mats.slab);
          bFloor.position.set(x, -fH / 2 + 0.12, boxD / 2 + 0.52); fMesh.add(bFloor);
          const railF = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.65, 0.05), railMat);
          railF.position.set(x, -fH / 2 + 0.5, boxD / 2 + 1.02); fMesh.add(railF);
          [-1.28, 1.28].forEach(sx => {
            const railS = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.65, 1.05), railMat);
            railS.position.set(x + sx, -fH / 2 + 0.5, boxD / 2 + 0.52); fMesh.add(railS);
          });
        });

        // AC unit on side wall
        const panelMat = new THREE.MeshStandardMaterial({ color: '#c0c5d0', roughness: 0.5, side: THREE.DoubleSide });
        const ac = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.8), panelMat);
        ac.position.set(boxW / 2 + 0.13, -fH / 4, 1.5); fMesh.add(ac);
      } else {
        // Ground floor door
        const doorH = Math.min(fH * 0.72, 2.7);
        const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, doorH, 0.1), glassMat);
        door.position.set(0, -fH / 2 + doorH / 2, boxD / 2 + 0.05); fMesh.add(door);
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 1.5), mats.slab);
        canopy.position.set(0, -fH / 2 + doorH + 0.15, boxD / 2 + 0.7); fMesh.add(canopy);

        // Entrance pillars
        [-1.4, 1.4].forEach(ex => {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, doorH + 0.3), mats.concrete);
          pillar.position.set(ex, -fH / 2 + (doorH + 0.3) / 2, boxD / 2 + 0.7); fMesh.add(pillar);
        });
      }

      group.add(fMesh);
      allMeshes.push(fMesh);
      bMeta.push({ mesh: fMesh, floorLevel: fi + 1 });
      curY += fH;
    });
  }

  // Roof details
  const roofY = curY;
  [1, -1].forEach(zSign => {
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(boxW + 0.45, 0.5, 0.18), mats.concrete);
    parapet.position.set(0, roofY + 0.25, zSign * (boxD / 2 + 0.13)); group.add(parapet);
  });
  [1, -1].forEach(xSign => {
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, boxD + 0.45), mats.concrete);
    parapet.position.set(xSign * (boxW / 2 + 0.13), roofY + 0.25, 0); group.add(parapet);
  });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.25, 20), new THREE.MeshStandardMaterial({ color: '#e0d8c8' }));
  tank.position.set(-boxW / 4, roofY + 0.65, -boxD / 4); group.add(tank);
  const mach = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.25, 1.9), mats.concrete);
  mach.position.set(boxW / 4, roofY + 0.625, boxD / 5); group.add(mach);

  return curY;
}

/* ═══════════════════════════════════════════════════════════════════
   HOSPITAL — H-shape with canopy + helipad
   ═══════════════════════════════════════════════════════════════════ */

function buildHospital(b, p, group, allMeshes, bMeta, mats) {
  const wingMat = new THREE.MeshStandardMaterial({ color: '#d8c8b0', roughness: 0.7, side: THREE.DoubleSide });
  let curY = 0;

  b.floors.forEach((f, i) => {
    const isTop = i === b.floors.length - 1;
    const mGeo = new THREE.BoxGeometry(p.w, f.height, p.d * 0.4);
    const main = new THREE.Mesh(mGeo, wingMat);
    main.position.set(0, curY + f.height / 2, 0); main.castShadow = true;
    main.userData = { parcelId: b.parcelId, ulpin: f.ulpin, type: 'floor', height: f.height };

    const lGeo = new THREE.BoxGeometry(p.w * 0.3, f.height, p.d);
    const leftW = new THREE.Mesh(lGeo, wingMat);
    leftW.position.set(-p.w / 2 + p.w * 0.15, curY + f.height / 2, 0); leftW.castShadow = true;
    leftW.userData = { parcelId: b.parcelId, ulpin: f.ulpin, type: 'floor', height: f.height };

    const rightW = new THREE.Mesh(lGeo, wingMat);
    rightW.position.set(p.w / 2 - p.w * 0.15, curY + f.height / 2, 0); rightW.castShadow = true;
    rightW.userData = { parcelId: b.parcelId, ulpin: f.ulpin, type: 'floor', height: f.height };

    const fGroup = new THREE.Group();
    fGroup.add(main, leftW, rightW);

    // Canopy on ground floor
    if (i === 0) {
      const can = new THREE.Mesh(
        new THREE.BoxGeometry(p.w * 0.4, 0.5, p.d * 0.4),
        new THREE.MeshStandardMaterial({ color: '#f0ebe0' })
      );
      can.position.set(0, f.height * 0.8, p.d / 2 + p.d * 0.2); can.castShadow = true; fGroup.add(can);

      // Red cross
      const crossMat = new THREE.MeshStandardMaterial({ color: '#dc2626' });
      const cH = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.15), crossMat);
      cH.position.set(0, f.height / 2, p.d * 0.2 + 0.08); fGroup.add(cH);
      const cV = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.15), crossMat);
      cV.position.set(0, f.height / 2, p.d * 0.2 + 0.08); fGroup.add(cV);
    }

    // Helipad on top
    if (isTop) {
      const helipad = new THREE.Mesh(new THREE.CylinderGeometry(p.d * 0.3, p.d * 0.3, 0.2, 16), new THREE.MeshStandardMaterial({ color: '#ef4444' }));
      helipad.position.set(0, f.height / 2 + 0.1, 0); fGroup.add(helipad);
    }

    fGroup.userData = { parcelId: b.parcelId, ulpin: f.ulpin, type: 'floor', height: f.height };
    group.add(fGroup);
    allMeshes.push(main, leftW, rightW);
    bMeta.push({ mesh: fGroup, isRoof: isTop, floorLevel: f.floorNumber });
    curY += f.height;
  });

  return curY;
}

/* ═══════════════════════════════════════════════════════════════════
   SCHOOL — L-shape with playground + flagpole
   ═══════════════════════════════════════════════════════════════════ */

function buildSchool(b, p, group, allMeshes, bMeta, mats) {
  const brickMat = new THREE.MeshStandardMaterial({ color: '#a85040', roughness: 0.8, side: THREE.DoubleSide });

  // Green field
  const field = new THREE.Mesh(
    new THREE.BoxGeometry(p.w * 0.8, 0.1, p.d * 0.8),
    new THREE.MeshStandardMaterial({ color: '#5aaa50' })
  );
  field.position.set(p.w * 0.3, 0.05, p.d * 0.3); group.add(field);

  // Flagpole
  const poleMat = new THREE.MeshStandardMaterial({ color: '#888' });
  const fp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 6), poleMat);
  fp.position.set(p.w * 0.3, 3, -p.d * 0.3); fp.castShadow = true; group.add(fp);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.05), new THREE.MeshStandardMaterial({ color: '#ff9933' }));
  flag.position.set(p.w * 0.3 + 0.6, 5.6, -p.d * 0.3); group.add(flag);

  let curY = 0;
  b.floors.forEach((f, i) => {
    const fGroup = new THREE.Group();
    const mGeo = new THREE.BoxGeometry(p.w, f.height, p.d * 0.4);
    const main = new THREE.Mesh(mGeo, brickMat);
    main.position.set(0, curY + f.height / 2, -p.d / 2 + p.d * 0.2); main.castShadow = true;
    main.userData = { parcelId: b.parcelId, ulpin: f.ulpin, type: 'floor', height: f.height };

    const lGeo = new THREE.BoxGeometry(p.w * 0.4, f.height, p.d * 0.6);
    const side = new THREE.Mesh(lGeo, brickMat);
    side.position.set(-p.w / 2 + p.w * 0.2, curY + f.height / 2, p.d * 0.1); side.castShadow = true;
    side.userData = { parcelId: b.parcelId, ulpin: f.ulpin, type: 'floor', height: f.height };

    fGroup.add(main, side);
    fGroup.userData = { parcelId: b.parcelId, ulpin: f.ulpin, type: 'floor', height: f.height };
    group.add(fGroup);
    allMeshes.push(main, side);
    bMeta.push({ mesh: fGroup, isRoof: i === b.floors.length - 1, floorLevel: f.floorNumber });
    curY += f.height;
  });

  return curY;
}

/* ═══════════════════════════════════════════════════════════════════
   SKYSCRAPER — glass tower with fins + podium
   ═══════════════════════════════════════════════════════════════════ */

function buildSkyscraper(b, p, group, allMeshes, bMeta, mats) {
  const tMat = mats.skyMat.clone();
  tMat.side = THREE.DoubleSide;
  let curY = 0;

  b.floors.forEach((f, i) => {
    const isPodium = i < 2;
    const isTop = i === b.floors.length - 1;
    const cW = isPodium ? p.w : p.w * 0.7;
    const cD = isPodium ? p.d : p.d * 0.7;

    const fMesh = new THREE.Mesh(new THREE.BoxGeometry(cW, f.height, cD), tMat);
    fMesh.position.set(0, curY + f.height / 2, 0);
    fMesh.castShadow = true;
    fMesh.userData = { parcelId: b.parcelId, ulpin: f.ulpin, type: 'floor', height: f.height };

    const fGroup = new THREE.Group();
    fGroup.add(fMesh);

    // Vertical fins on tower (above podium)
    if (!isPodium) {
      const finGeo = new THREE.BoxGeometry(0.15, f.height, cD + 0.3);
      const finMat = new THREE.MeshStandardMaterial({ color: '#a89878' });
      for (let fx = -cW / 2 + 1; fx <= cW / 2 - 1; fx += 2) {
        const fin = new THREE.Mesh(finGeo, finMat);
        fin.position.set(fx, curY + f.height / 2, 0);
        fGroup.add(fin);
      }
    }

    // Antenna on roof
    if (isTop) {
      const ant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 8, 8),
        new THREE.MeshStandardMaterial({ color: '#c8c0b0' })
      );
      ant.position.set(0, f.height / 2 + 4, 0); fGroup.add(ant);
    }

    fGroup.userData = { parcelId: b.parcelId, ulpin: f.ulpin, type: 'floor', height: f.height };
    group.add(fGroup);
    allMeshes.push(fMesh);
    bMeta.push({ mesh: fGroup, isRoof: isTop, floorLevel: f.floorNumber });
    curY += f.height;
  });

  return curY;
}

/* ═══════════════════════════════════════════════════════════════════
   COMMERCIAL / MALL — box with entrance & awning
   ═══════════════════════════════════════════════════════════════════ */

function buildCommercial(b, p, group, allMeshes, bMeta, mats) {
  const meshMat = mats.comMat.clone();
  meshMat.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), meshMat);
  mesh.position.y = p.h / 2;
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData = { parcelId: b.parcelId, type: 'floor', ulpin: b.floors[0].ulpin };
  group.add(mesh);
  allMeshes.push(mesh);

  // Entrance awning
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(p.w * 0.5, 0.15, 2),
    new THREE.MeshStandardMaterial({ color: '#b87040' })
  );
  awning.position.set(0, p.h * 0.35, p.d / 2 + 0.9);
  group.add(awning);

  // Entrance pillars
  [-p.w * 0.22, p.w * 0.22].forEach(x => {
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, p.h * 0.35), mats.concrete);
    pil.position.set(x, p.h * 0.175, p.d / 2 + 0.9);
    group.add(pil);
  });

  return p.h;
}
