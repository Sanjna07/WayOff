import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════
   PROCEDURAL TREE — recursive branching with leaf clusters
   ═══════════════════════════════════════════════════════════════════ */

const _barkMat = new THREE.MeshStandardMaterial({ color: '#5a3a1a', roughness: 0.85 });

const _leafMats = [
  new THREE.MeshStandardMaterial({ color: '#2d6a4f', roughness: 0.6, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: '#3a8a5a', roughness: 0.6, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: '#4a7a48', roughness: 0.65, flatShading: true }),
];

const _up = new THREE.Vector3(0, 1, 0);

function growBranch(group, origin, direction, length, radius, depth, config, leafMat) {
  const endPoint = origin.clone().add(direction.clone().multiplyScalar(length));

  const topRadius = radius * config.radiusDecay;
  const geo = new THREE.CylinderGeometry(topRadius, radius, length, 6);
  geo.translate(0, length / 2, 0);

  const mesh = new THREE.Mesh(geo, _barkMat);
  mesh.position.copy(origin);
  mesh.quaternion.setFromUnitVectors(_up, direction);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  // Terminal — add leaf clusters
  if (depth >= config.maxDepth) {
    const sz = (0.35 + Math.random() * 0.25) * config.scale;
    const leafGeo = new THREE.DodecahedronGeometry(sz, 1);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.copy(endPoint);
    leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    leaf.castShadow = true;
    group.add(leaf);
    return;
  }

  // Branch into 2-3 children
  const numBranches = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numBranches; i++) {
    const axis = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();

    const angle = config.splitAngle + (Math.random() - 0.5) * 0.3;
    const childDir = direction.clone().applyAxisAngle(axis, angle).normalize();
    // Slight gravitational droop on outer branches
    childDir.y -= 0.04 * depth;
    childDir.normalize();

    growBranch(
      group, endPoint, childDir,
      length * config.lengthDecay, topRadius,
      depth + 1, config, leafMat
    );
  }
}

/**
 * Add a procedural tree at (x, z) in the parent group.
 * @param {THREE.Group} parent
 * @param {number} x
 * @param {number} z
 * @param {number} scale  — 1.0 ≈ 3-4 unit tall tree
 */
export function addProceduralTree(parent, x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const config = {
    maxDepth: 3,
    trunkLength: 1.4 * scale + Math.random() * 0.3 * scale,
    trunkRadius: 0.07 * scale + Math.random() * 0.02 * scale,
    lengthDecay: 0.68 + Math.random() * 0.06,
    radiusDecay: 0.6 + Math.random() * 0.08,
    splitAngle: 0.45 + Math.random() * 0.2,
    scale,
  };

  const leafMat = _leafMats[Math.floor(Math.random() * _leafMats.length)];

  growBranch(
    group,
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1, 0),
    config.trunkLength, config.trunkRadius,
    0, config, leafMat
  );

  parent.add(group);
  return group;
}
