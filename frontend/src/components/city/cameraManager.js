import * as THREE from 'three';
import { OV_POS, OV_TAR } from './constants.js';

/* ═══════════════════════════════════════════════════════════════════
   CAMERA MANAGER
   Animation · FPS controls · Indoor transitions · Route drawing
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @param {THREE.PerspectiveCamera} camera
 * @param {OrbitControls} controls
 * @param {object} deps
 *   - buildingMeta: Map
 *   - cityProps: THREE.Group
 *   - allMeshes: Mesh[]
 *   - scene: THREE.Scene
 */
export function createCameraManager(camera, controls, deps) {
  const { buildingMeta, cityProps, allMeshes, scene } = deps;

  /* ─── FPS state ─── */
  const fps = {
    active: false,
    yaw: 0,
    pitch: 0,
    isDragging: false,
    prevX: 0, prevY: 0,
    sensitivity: 0.002,
    eyeHeight: 2,
    euler: new THREE.Euler(0, 0, 0, 'YXZ'),
  };

  /* ─── Animation state ─── */
  const anim = { active: false, tPos: new THREE.Vector3(), tTar: new THREE.Vector3() };

  /* ─── Opacity fading ─── */
  const fadingMeshes = [];

  /* ─── WASD keys ─── */
  const keys = { w: false, a: false, s: false, d: false };

  /* ─── Internal state ─── */
  let currentIndoorBuilding = null;
  let currentSelectedUlpin = '';
  let routeMesh = null;

  /* ═══════ Public API ═══════ */

  function animateCamera(tPos, tTar) {
    anim.tPos.copy(tPos);
    anim.tTar.copy(tTar);
    anim.active = true;
    controls.enabled = false;
  }

  function setMeshVisibility(mesh, targetOpacity) {
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m, idx) => {
      let activeMat = m;
      if (!activeMat.userData.clonedForFading) {
        activeMat = activeMat.clone();
        activeMat.userData.clonedForFading = true;
        activeMat.userData.origTransparent = activeMat.transparent;
        if (Array.isArray(mesh.material)) {
          mesh.material[idx] = activeMat;
        } else {
          mesh.material = activeMat;
        }
      }
      activeMat.transparent = true;
      activeMat.needsUpdate = true;
      // Deduplicate
      for (let i = fadingMeshes.length - 1; i >= 0; i--) {
        if (fadingMeshes[i].mat === activeMat) fadingMeshes.splice(i, 1);
      }
      fadingMeshes.push({ mat: activeMat, target: targetOpacity });
    });
  }

  function applySelection(ulpin) {
    currentSelectedUlpin = ulpin || '';
    allMeshes.forEach(m => {
      if (m.userData.type === 'floor' && m.material.emissive) {
        const isSel = Boolean(ulpin) && m.userData.ulpin === ulpin;
        m.material.emissive.set(isSel ? '#b45309' : '#000000');
        m.material.emissiveIntensity = isSel ? 0.3 : 0;
      }
    });
  }

  function enterBuilding(parcelId) {
    if (currentIndoorBuilding) return;
    const b = buildingMeta.get(parcelId);
    if (!b) return;
    const { position: bp, totalHeight: h, isPublic } = b;
    if (isPublic) {
      animateCamera(
        new THREE.Vector3(bp.x + 18, h * 0.8 + 5, bp.z + 25),
        new THREE.Vector3(bp.x, h * 0.35, bp.z)
      );
    } else {
      animateCamera(
        new THREE.Vector3(bp.x + 35, Math.max(h + 10, 30), bp.z + 35),
        new THREE.Vector3(bp.x, h * 0.5, bp.z)
      );
    }
  }

  function transitionIndoor(parcelId, ulpin) {
    const b = buildingMeta.get(parcelId);
    if (!b) return;
    currentIndoorBuilding = parcelId;

    // Find target floor
    let targetLvl = 1;
    let targetMesh = null;
    b.meta.forEach(m => {
      if (m.mesh.userData?.ulpin === ulpin) {
        targetLvl = m.floorLevel;
        targetMesh = m.mesh;
      }
    });

    // Show / hide for indoor cutaway
    b.meta.forEach(m => {
      if (m.showInIndoor) {
        setMeshVisibility(m.mesh, m.floorLevel === targetLvl ? 1.0 : 0.0);
      } else if (m.isRoof || m.floorLevel > targetLvl || m.hideInIndoor) {
        setMeshVisibility(m.mesh, 0.0);
      } else {
        setMeshVisibility(m.mesh, 1.0);
      }
    });

    // Hide rest of city
    if (cityProps) cityProps.visible = false;
    buildingMeta.forEach((val, key) => {
      if (key !== parcelId) val.group.visible = false;
    });

    const bp = b.position;
    const fy = targetMesh?.position?.y ?? 2;
    const eyeY = fy + 1.7;

    // Activate FPS for public building indoor walk-around
    fps.active = true;
    fps.eyeHeight = eyeY;
    controls.enabled = false;

    // Set initial yaw facing into the building
    const dir = new THREE.Vector3(0, 0, -1); // face inward
    fps.yaw = Math.atan2(-dir.x, -dir.z);
    fps.pitch = 0;

    animateCamera(
      new THREE.Vector3(bp.x + 2, eyeY, bp.z + 3),
      new THREE.Vector3(bp.x, eyeY, bp.z)
    );
  }

  function exitIndoor(parcelId) {
    if (currentIndoorBuilding) {
      const b = buildingMeta.get(currentIndoorBuilding);
      if (b) {
        b.meta.forEach(m => {
          if (m.showInIndoor) {
            setMeshVisibility(m.mesh, 0.0);
          } else {
            setMeshVisibility(m.mesh, 1.0);
          }
        });
      }
      currentIndoorBuilding = null;

      // Deactivate FPS
      fps.active = false;
      fps.isDragging = false;
      controls.enabled = true;

      // Restore city
      if (cityProps) cityProps.visible = true;
      buildingMeta.forEach(val => { val.group.visible = true; });

      if (parcelId) {
        enterBuilding(parcelId);
      } else {
        animateCamera(OV_POS.clone(), OV_TAR.clone());
      }
    } else if (!parcelId) {
      animateCamera(OV_POS.clone(), OV_TAR.clone());
    }
  }

  function toggleStreetView(active) {
    if (active) {
      const streetPos = new THREE.Vector3(0, fps.eyeHeight, 20);
      const streetTarget = new THREE.Vector3(0, fps.eyeHeight, 0);
      animateCamera(streetPos, streetTarget);

      const dir = new THREE.Vector3().subVectors(streetTarget, streetPos).normalize();
      fps.yaw = Math.atan2(-dir.x, -dir.z);
      fps.pitch = 0;
      fps.active = true;
      controls.enabled = false;
    } else {
      fps.active = false;
      fps.isDragging = false;
      controls.enabled = true;
      controls.maxPolarAngle = Math.PI / 2 - 0.02;
      controls.minPolarAngle = 0;
      animateCamera(OV_POS.clone(), OV_TAR.clone());
    }
  }

  /* ─── Route drawing ─── */
  function drawRoute(startId, endId) {
    if (routeMesh) {
      scene.remove(routeMesh);
      routeMesh.geometry.dispose();
      routeMesh.material.dispose();
      routeMesh = null;
    }
    if (!startId || !endId || startId === endId) return;

    const startB = buildingMeta.get(startId);
    const endB = buildingMeta.get(endId);
    if (!startB || !endB) return;

    const sx = startB.position.x, sz = startB.position.z;
    const ex = endB.position.x, ez = endB.position.z;

    const points = [new THREE.Vector3(sx, 0.5, sz)];
    const getNearZ = z => [-45, 40].reduce((p, c) => Math.abs(c - z) < Math.abs(p - z) ? c : p);
    const ssz = getNearZ(sz), esz = getNearZ(ez);

    if (Math.abs(sx) > 6) points.push(new THREE.Vector3(sx, 0.5, ssz));

    if ((ssz < 0 && esz > 0) || (ssz > 0 && esz < 0)) {
      points.push(new THREE.Vector3(0, 0.5, ssz < 0 ? -10 : 10));
      points.push(new THREE.Vector3(5, 0.5, ssz < 0 ? -5 : 5));
      points.push(new THREE.Vector3(7, 0.5, 0));
      points.push(new THREE.Vector3(5, 0.5, ssz < 0 ? 5 : -5));
      points.push(new THREE.Vector3(0, 0.5, ssz < 0 ? 10 : -10));
    } else {
      points.push(new THREE.Vector3(0, 0.5, ssz));
    }

    points.push(new THREE.Vector3(0, 0.5, esz));
    if (Math.abs(ex) > 6) points.push(new THREE.Vector3(ex, 0.5, esz));
    points.push(new THREE.Vector3(ex, 0.5, ez));

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0);
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.3, 8, false);
    const mat = new THREE.MeshStandardMaterial({ color: '#d4823a', emissive: '#c06020', emissiveIntensity: 0.7 });
    routeMesh = new THREE.Mesh(tubeGeo, mat);
    scene.add(routeMesh);
  }

  /* ═══════ Per-frame update ═══════ */
  const _moveDir = new THREE.Vector3();
  const _right = new THREE.Vector3();

  function update() {
    const anyKey = keys.w || keys.a || keys.s || keys.d;

    if (fps.active && !anim.active) {
      const walkSpeed = 0.1;
      fps.euler.set(fps.pitch, fps.yaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(fps.euler);

      if (anyKey) {
        camera.getWorldDirection(_moveDir);
        _moveDir.y = 0; _moveDir.normalize();
        _right.crossVectors(_moveDir, camera.up).normalize();

        const newPos = camera.position.clone();
        if (keys.w) newPos.addScaledVector(_moveDir,  walkSpeed);
        if (keys.s) newPos.addScaledVector(_moveDir, -walkSpeed);
        if (keys.a) newPos.addScaledVector(_right,   -walkSpeed);
        if (keys.d) newPos.addScaledVector(_right,    walkSpeed);

        let canMove = true;
        for (const [pid, b] of buildingMeta.entries()) {
          const isRent = b.bData?.floors?.some?.(f => String(f.status).toLowerCase() === 'for_rent');
          if (!b.isPublic && !isRent) {
            const w = b.bData?.w || 10;
            const d = b.bData?.d || 8;
            if (Math.abs(newPos.x - b.position.x) < (w / 2 + 1) && 
                Math.abs(newPos.z - b.position.z) < (d / 2 + 1)) {
              canMove = false; break;
            }
          }
        }
        
        if (canMove) {
          camera.position.x = newPos.x;
          camera.position.z = newPos.z;
        }
        camera.position.y = fps.eyeHeight;
      }
    } else if (!fps.active && anyKey && !anim.active) {
      const panSpeed = 0.6;
      camera.getWorldDirection(_moveDir);
      _moveDir.y = 0; _moveDir.normalize();
      _right.crossVectors(_moveDir, camera.up).normalize();

      const delta = new THREE.Vector3();
      if (keys.w) delta.addScaledVector(_moveDir,  panSpeed);
      if (keys.s) delta.addScaledVector(_moveDir, -panSpeed);
      if (keys.a) delta.addScaledVector(_right,   -panSpeed);
      if (keys.d) delta.addScaledVector(_right,    panSpeed);
      camera.position.add(delta);
      controls.target.add(delta);
    }

    // Camera lerp
    if (anim.active) {
      camera.position.lerp(anim.tPos, 0.05);
      controls.target.lerp(anim.tTar, 0.05);
      if (camera.position.distanceTo(anim.tPos) < 0.2 &&
          controls.target.distanceTo(anim.tTar) < 0.2) {
        anim.active = false;
        if (!fps.active) controls.enabled = true;
      }
    }

    // Opacity fades
    for (let i = fadingMeshes.length - 1; i >= 0; i--) {
      const fm = fadingMeshes[i];
      fm.mat.opacity += (fm.target - fm.mat.opacity) * 0.1;
      if (Math.abs(fm.mat.opacity - fm.target) < 0.01) {
        fm.mat.opacity = fm.target;
        if (fm.target === 1.0 && !fm.mat.userData.origTransparent) {
          fm.mat.transparent = false;
          fm.mat.needsUpdate = true;
        }
        fadingMeshes.splice(i, 1);
      }
    }

    // OrbitControls update
    if (!anim.active && !fps.active) {
      controls.update();
    }
  }

  /* ═══════ Event listeners (keyboard + FPS mouse) ═══════ */

  function setupListeners(domElement) {
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k in keys) { keys[k] = true; e.preventDefault(); }
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k in keys) { keys[k] = false; }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onFpsDown = (e) => {
      if (!fps.active || e.button !== 0) return;
      fps.isDragging = true;
      fps.prevX = e.clientX;
      fps.prevY = e.clientY;
    };
    const onFpsMove = (e) => {
      if (!fps.active || !fps.isDragging) return;
      fps.yaw   -= (e.clientX - fps.prevX) * fps.sensitivity;
      fps.pitch -= (e.clientY - fps.prevY) * fps.sensitivity;
      fps.pitch = Math.max(-1.48, Math.min(1.48, fps.pitch));
      fps.prevX = e.clientX;
      fps.prevY = e.clientY;
    };
    const onFpsUp = (e) => {
      if (e.button === 0) fps.isDragging = false;
    };

    domElement.addEventListener('pointerdown', onFpsDown);
    domElement.addEventListener('pointermove', onFpsMove);
    domElement.addEventListener('pointerup', onFpsUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      domElement.removeEventListener('pointerdown', onFpsDown);
      domElement.removeEventListener('pointermove', onFpsMove);
      domElement.removeEventListener('pointerup', onFpsUp);
    };
  }

  /* ═══════ Return public API ═══════ */
  return {
    fps,
    anim,
    applySelection,
    enterBuilding,
    transitionIndoor,
    exitIndoor,
    toggleStreetView,
    drawRoute,
    update,
    setupListeners,
    getCurrentUlpin: () => currentSelectedUlpin,
  };
}
