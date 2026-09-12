import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════
   INTERACTION — raycasting, hover glow, click handling
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.Mesh[]} allMeshes
 * @param {Map} buildingMeta
 * @param {object} callbacks
 *   - onSelectBuilding(parcelId)
 *   - onFloorClick(userData)
 *   - onExitBuilding()
 *   - enterBuilding(parcelId)
 *   - exitIndoor(parcelId)
 *   - isIndoorMode()   → boolean
 *   - getCurrentUlpin() → string
 *   - prevParcelRef     → { current }
 * @returns {() => void} cleanup
 */
export function setupInteraction(renderer, camera, allMeshes, buildingMeta, callbacks) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredMesh = null;
  const pointerDownPos = new THREE.Vector2();

  const onPointerDown = (e) => {
    pointerDownPos.set(e.clientX, e.clientY);
  };

  const onPointerUp = (e) => {
    const dist = Math.abs(e.clientX - pointerDownPos.x) + Math.abs(e.clientY - pointerDownPos.y);
    if (dist > 5) return; // drag — not a click

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(allMeshes, false);

    if (hits.length > 0) {
      const m = hits[0].object;
      const pid = m.userData.parcelId;
      const b = buildingMeta.get(pid);
      if (!b) return;

      if (callbacks.isIndoorMode()) return;

      callbacks.prevParcelRef.current = pid;
      callbacks.onSelectBuilding?.(pid);

      if (m.userData.type === 'floor') {
        const floor = b.bData?.floors?.find?.(f => f.ulpin === m.userData.ulpin);
        const isRent = floor && String(floor.status).toLowerCase() === 'for_rent';
        if (b.isPublic || isRent) {
          callbacks.onFloorClick?.(m.userData);
        }
      }

      callbacks.enterBuilding(pid);
    } else if (!callbacks.isIndoorMode()) {
      callbacks.onExitBuilding?.();
      callbacks.exitIndoor(null);
    }
  };

  const onPointerMove = (e) => {
    if (callbacks.isIndoorMode()) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(allMeshes, false);

    const currentUlpin = callbacks.getCurrentUlpin();

    if (hoveredMesh && (!hits.length || hits[0].object !== hoveredMesh)) {
      if (hoveredMesh.userData.ulpin !== currentUlpin) {
        hoveredMesh.material.emissive?.set('#000000');
      }
      hoveredMesh = null;
    }

    if (hits.length > 0) {
      renderer.domElement.style.cursor = 'pointer';
      const m = hits[0].object;
      if (m.userData.ulpin !== currentUlpin) {
        m.material.emissive?.set('#ffffff');
        m.material.emissiveIntensity = 0.15;
        hoveredMesh = m;
      }
    } else {
      renderer.domElement.style.cursor = 'default';
    }
  };

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointermove', onPointerMove);

  return () => {
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('pointerup', onPointerUp);
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
  };
}
