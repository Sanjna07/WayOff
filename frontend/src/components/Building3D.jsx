import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Building3D Component
 *
 * Renders an architectural apartment-block model on a light survey backdrop:
 * concrete facade, window bays, balconies, entrance canopy, roof plant and
 * landscaped ground. Each floor remains an individually selectable volume -
 * the raycasting, userData contract, callbacks and orbit controls are
 * unchanged from the original implementation.
 *
 * Props:
 * - building: Object matching contract { parcelId, footprint, floors, underground }
 * - onFloorClick: Callback (floorData) => void on Raycast click
 * - selectedFloorUlpin: String ULPIN of selected floor
 */

// Muted institutional palette for facade tinting by title status
const STATUS_COLORS = {
  registered: { wall: '#8ea3c2', edge: '#54688c' },
  disputed: { wall: '#b3655c', edge: '#84413a' },
  vacant: { wall: '#b6b0a3', edge: '#847e6f' },
  selected: { wall: '#c9a24a', edge: '#8a6d2f' }
};

const CONCRETE = '#d9d3c7';
const SLAB = '#c3bdaf';
const GLASS = '#33415c';
const RAILING = '#7c8894';

const Building3D = ({ building, onFloorClick, selectedFloorUlpin }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const meshesRef = useRef([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // -------------------------------------------------------------------------
    // 1. SCENE & CAMERA SETUP (light survey backdrop)
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9edf2');
    scene.fog = new THREE.FogExp2('#e9edf2', 0.0085);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(24, 15, 28);

    // -------------------------------------------------------------------------
    // 2. RENDERER SETUP
    // -------------------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------------------
    // 3. CONTROLS SETUP
    // -------------------------------------------------------------------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.08; // Allow slight sub-ground tilt for underground inspection

    // -------------------------------------------------------------------------
    // 4. DAYLIGHT LIGHTING SYSTEM
    // -------------------------------------------------------------------------
    const hemiLight = new THREE.HemisphereLight('#f6f9fc', '#cfc9bb', 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fff5e6', 1.5);
    sunLight.position.set(22, 32, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 35;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight('#dfe8f2', 0.35);
    fillLight.position.set(-20, 15, -20);
    scene.add(fillLight);

    // -------------------------------------------------------------------------
    // 5. GROUND, PAVEMENT & SURVEY GRID
    // -------------------------------------------------------------------------
    const groundGeo = new THREE.PlaneGeometry(90, 90);
    const groundMat = new THREE.MeshStandardMaterial({ color: '#d7d3c8', roughness: 0.95, metalness: 0.0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(90, 45, '#aab3bf', '#c8ccd2');
    gridHelper.position.y = 0.012;
    scene.add(gridHelper);

    // -------------------------------------------------------------------------
    // 6. BUILDING ARCHITECTURAL STACKING
    // -------------------------------------------------------------------------
    const interactiveMeshes = [];
    const boxWidth = 10.0;
    const boxDepth = 8.0;

    // Shared decoration materials (children of floor meshes; raycast is
    // non-recursive so decorations never intercept clicks)
    const slabMat = new THREE.MeshStandardMaterial({ color: SLAB, roughness: 0.85, metalness: 0.02 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: CONCRETE, roughness: 0.9, metalness: 0.0 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: GLASS,
      roughness: 0.15,
      metalness: 0.55,
      transparent: true,
      opacity: 0.92
    });
    const railingMat = new THREE.MeshStandardMaterial({ color: RAILING, roughness: 0.5, metalness: 0.5 });

    if (building) {
      // Plinth under the whole building
      const plinthGeo = new THREE.BoxGeometry(boxWidth + 1.2, 0.3, boxDepth + 1.2);
      const plinth = new THREE.Mesh(plinthGeo, slabMat);
      plinth.position.set(0, 0.15, 0);
      plinth.receiveShadow = true;
      scene.add(plinth);

      const baseY = 0.3; // floors start on top of the plinth

      // --- A. SUBTERRANEAN UNDERGROUND LEVEL (Negative Y Axis) ---
      if (building.underground) {
        const ug = building.underground;
        const ugLevels = ug.levels || 1;
        const ugHeight = ugLevels * 3.2;

        // Cutout pit frame
        const pitGeo = new THREE.BoxGeometry(boxWidth * 1.02, ugHeight, boxDepth * 1.02);
        const pitMat = new THREE.MeshBasicMaterial({ color: '#9aa2ad', wireframe: true });
        const pitMesh = new THREE.Mesh(pitGeo, pitMat);
        pitMesh.position.set(0, -ugHeight / 2, 0);
        scene.add(pitMesh);

        // Underground structure box
        const ugGeo = new THREE.BoxGeometry(boxWidth * 0.96, ugHeight * 0.96, boxDepth * 0.96);
        const isSelected = selectedFloorUlpin === ug.ulpin;
        const ugMat = new THREE.MeshStandardMaterial({
          color: isSelected ? STATUS_COLORS.selected.wall : '#7d8590',
          roughness: 0.7,
          metalness: 0.2,
          transparent: true,
          opacity: 0.9,
          emissive: isSelected ? '#8a6d2f' : '#000000',
          emissiveIntensity: isSelected ? 0.25 : 0
        });

        const ugMesh = new THREE.Mesh(ugGeo, ugMat);
        ugMesh.position.set(0, -ugHeight / 2, 0);
        ugMesh.userData = {
          type: 'underground',
          ulpin: ug.ulpin,
          levels: ug.levels,
          undergroundType: ug.type,
          parcelId: building.parcelId
        };

        const wireGeo = new THREE.WireframeGeometry(ugGeo);
        const wireMat = new THREE.LineBasicMaterial({
          color: isSelected ? STATUS_COLORS.selected.edge : '#5f6874',
          linewidth: 1.5
        });
        const wireframe = new THREE.LineSegments(wireGeo, wireMat);
        ugMesh.add(wireframe);

        scene.add(ugMesh);
        interactiveMeshes.push(ugMesh);
      }

      // --- B. ABOVE-GROUND FLOORS (Stacked Bottom-to-Top along Positive Y Axis) ---
      if (Array.isArray(building.floors)) {
        let currentY = baseY;

        building.floors.forEach((floor, floorIndex) => {
          const floorHeight = floor.height || 3.2;
          const isSelected = selectedFloorUlpin === floor.ulpin;
          const statusKey = String(floor.status || 'registered').toLowerCase();
          const palette = isSelected
            ? STATUS_COLORS.selected
            : STATUS_COLORS[statusKey] || STATUS_COLORS.registered;

          const wallMat = new THREE.MeshStandardMaterial({
            color: palette.wall,
            roughness: 0.75,
            metalness: 0.05,
            emissive: isSelected ? '#8a6d2f' : '#000000',
            emissiveIntensity: isSelected ? 0.22 : 0
          });

          // Interactive floor volume
          const floorGeo = new THREE.BoxGeometry(boxWidth, floorHeight, boxDepth);
          const floorMesh = new THREE.Mesh(floorGeo, wallMat);
          floorMesh.castShadow = true;
          floorMesh.receiveShadow = true;
          floorMesh.position.set(0, currentY + floorHeight / 2, 0);

          floorMesh.userData = {
            type: 'floor',
            floorNumber: floor.floorNumber,
            height: floor.height,
            ulpin: floor.ulpin,
            owner: floor.owner,
            status: floor.status,
            parcelId: building.parcelId
          };

          // --- Floor slab band ---
          const slabGeo = new THREE.BoxGeometry(boxWidth + 0.45, 0.22, boxDepth + 0.45);
          const slabMesh = new THREE.Mesh(slabGeo, slabMat);
          slabMesh.position.y = -floorHeight / 2 + 0.11;
          floorMesh.add(slabMesh);

          // --- Window bays ---
          const winH = floorHeight * 0.42;
          const winYOffset = floorHeight * 0.06;
          const isGroundFloor = floorIndex === 0;

          // Front & back facades (z axis)
          const frontXs = isGroundFloor ? [-3.4, 3.4] : [-3.4, -1.15, 1.15, 3.4];
          [1, -1].forEach((zSign) => {
            const xs = zSign === 1 ? frontXs : [-3.4, -1.15, 1.15, 3.4];
            xs.forEach((x) => {
              const winGeo = new THREE.BoxGeometry(1.5, winH, 0.07);
              const win = new THREE.Mesh(winGeo, glassMat);
              win.position.set(x, winYOffset, zSign * (boxDepth / 2 + 0.035));
              floorMesh.add(win);

              // Thin concrete window surround
              const lintelGeo = new THREE.BoxGeometry(1.7, 0.1, 0.09);
              const lintel = new THREE.Mesh(lintelGeo, concreteMat);
              lintel.position.set(x, winYOffset + winH / 2 + 0.07, zSign * (boxDepth / 2 + 0.035));
              floorMesh.add(lintel);
            });
          });

          // Side facades (x axis)
          [1, -1].forEach((xSign) => {
            [-2.4, 0, 2.4].forEach((z) => {
              const winGeo = new THREE.BoxGeometry(0.07, winH, 1.4);
              const win = new THREE.Mesh(winGeo, glassMat);
              win.position.set(xSign * (boxWidth / 2 + 0.035), winYOffset, z);
              floorMesh.add(win);
            });
          });

          // --- Balconies on upper floors (front facade) ---
          if (!isGroundFloor) {
            [-2.3, 2.3].forEach((x) => {
              const balconyFloorGeo = new THREE.BoxGeometry(2.6, 0.12, 1.05);
              const balconyFloor = new THREE.Mesh(balconyFloorGeo, slabMat);
              balconyFloor.position.set(x, -floorHeight / 2 + 0.12, boxDepth / 2 + 0.52);
              balconyFloor.castShadow = true;
              floorMesh.add(balconyFloor);

              const railFrontGeo = new THREE.BoxGeometry(2.6, 0.65, 0.05);
              const railFront = new THREE.Mesh(railFrontGeo, railingMat);
              railFront.position.set(x, -floorHeight / 2 + 0.5, boxDepth / 2 + 1.02);
              floorMesh.add(railFront);

              [-1.28, 1.28].forEach((sideX) => {
                const railSideGeo = new THREE.BoxGeometry(0.05, 0.65, 1.05);
                const railSide = new THREE.Mesh(railSideGeo, railingMat);
                railSide.position.set(x + sideX, -floorHeight / 2 + 0.5, boxDepth / 2 + 0.52);
                floorMesh.add(railSide);
              });
            });
          }

          // --- Ground floor entrance ---
          if (isGroundFloor) {
            const doorH = Math.min(floorHeight * 0.72, 2.7);
            const doorGeo = new THREE.BoxGeometry(2.4, doorH, 0.1);
            const door = new THREE.Mesh(doorGeo, glassMat);
            door.position.set(0, -floorHeight / 2 + doorH / 2, boxDepth / 2 + 0.05);
            floorMesh.add(door);

            const canopyGeo = new THREE.BoxGeometry(3.4, 0.14, 1.5);
            const canopy = new THREE.Mesh(canopyGeo, slabMat);
            canopy.position.set(0, -floorHeight / 2 + doorH + 0.15, boxDepth / 2 + 0.7);
            canopy.castShadow = true;
            floorMesh.add(canopy);
          }

          // --- Crisp architectural edges ---
          const edgesGeo = new THREE.EdgesGeometry(floorGeo);
          const edgesMat = new THREE.LineBasicMaterial({ color: palette.edge, linewidth: 2 });
          const edgeLines = new THREE.LineSegments(edgesGeo, edgesMat);
          floorMesh.add(edgeLines);

          scene.add(floorMesh);
          interactiveMeshes.push(floorMesh);

          currentY += floorHeight;
        });

        // --- C. ROOF PLANT (parapet, water tank, machine room) ---
        const roofY = currentY;

        [1, -1].forEach((zSign) => {
          const parapetGeo = new THREE.BoxGeometry(boxWidth + 0.45, 0.5, 0.18);
          const parapet = new THREE.Mesh(parapetGeo, concreteMat);
          parapet.position.set(0, roofY + 0.25, zSign * (boxDepth / 2 + 0.13));
          scene.add(parapet);
        });
        [1, -1].forEach((xSign) => {
          const parapetGeo = new THREE.BoxGeometry(0.18, 0.5, boxDepth + 0.45);
          const parapet = new THREE.Mesh(parapetGeo, concreteMat);
          parapet.position.set(xSign * (boxWidth / 2 + 0.13), roofY + 0.25, 0);
          scene.add(parapet);
        });

        const tankGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.25, 20);
        const tankMat = new THREE.MeshStandardMaterial({ color: '#e8e4da', roughness: 0.6, metalness: 0.1 });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(-boxWidth / 4, roofY + 0.65, -boxDepth / 4);
        tank.castShadow = true;
        scene.add(tank);

        const machineRoomGeo = new THREE.BoxGeometry(2.6, 1.25, 1.9);
        const machineRoom = new THREE.Mesh(machineRoomGeo, concreteMat);
        machineRoom.position.set(boxWidth / 4, roofY + 0.625, boxDepth / 5);
        machineRoom.castShadow = true;
        scene.add(machineRoom);

        // Focus controls camera on middle of building stack
        controls.target.set(0, currentY / 2, 0);
        controls.update();
      }

      // --- D. LANDSCAPE: entrance path, hedges & trees ---
      const pathGeo = new THREE.BoxGeometry(2.6, 0.04, 5.5);
      const pathMat = new THREE.MeshStandardMaterial({ color: '#cbc6b9', roughness: 0.95 });
      const path = new THREE.Mesh(pathGeo, pathMat);
      path.position.set(0, 0.02, boxDepth / 2 + 3.4);
      path.receiveShadow = true;
      scene.add(path);

      const hedgeMat = new THREE.MeshStandardMaterial({ color: '#8b9a70', roughness: 0.95 });
      [-2.2, 2.2].forEach((x) => {
        const hedgeGeo = new THREE.BoxGeometry(1.8, 0.45, 0.55);
        const hedge = new THREE.Mesh(hedgeGeo, hedgeMat);
        hedge.position.set(x, 0.225, boxDepth / 2 + 1.6);
        hedge.castShadow = true;
        scene.add(hedge);
      });

      const trunkMat = new THREE.MeshStandardMaterial({ color: '#8a6f52', roughness: 0.9 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: '#7f9367', roughness: 0.9 });
      [
        [boxWidth / 2 + 4.5, boxDepth / 2 + 3.5],
        [-boxWidth / 2 - 4.5, boxDepth / 2 + 2.5],
        [boxWidth / 2 + 3.5, -boxDepth / 2 - 3.5],
        [-boxWidth / 2 - 3.5, -boxDepth / 2 - 4.0]
      ].forEach(([x, z]) => {
        const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.3, 8);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 0.65, z);
        trunk.castShadow = true;
        scene.add(trunk);

        const foliageGeo = new THREE.SphereGeometry(0.95, 12, 12);
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.set(x, 1.85, z);
        foliage.castShadow = true;
        scene.add(foliage);
      });
    }

    meshesRef.current = interactiveMeshes;

    // -------------------------------------------------------------------------
    // 7. RAYCASTING & INTERACTION (unchanged)
    // -------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(meshesRef.current, false);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        if (clickedMesh && clickedMesh.userData && onFloorClick) {
          onFloorClick(clickedMesh.userData);
        }
      }
    };

    const handlePointerMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(meshesRef.current, false);

      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
      } else {
        renderer.domElement.style.cursor = 'default';
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handlePointerClick);
    domElement.addEventListener('pointermove', handlePointerMove);

    // -------------------------------------------------------------------------
    // 8. ANIMATION LOOP
    // -------------------------------------------------------------------------
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // -------------------------------------------------------------------------
    // 9. RESIZE OBSERVER
    // -------------------------------------------------------------------------
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // -------------------------------------------------------------------------
    // 10. CLEANUP
    // -------------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('click', handlePointerClick);
      domElement.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });

      controls.dispose();
      renderer.dispose();
      if (domElement && domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    };
  }, [building, selectedFloorUlpin, onFloorClick]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-sheet border border-rule overflow-hidden flex flex-col">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full flex-1 relative" />

      {/* Quiet bottom toolbar */}
      <div className="bg-paper border-t border-rule px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs text-ink-muted z-10">
        {/* Status legend - colors match the facade palette */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-ink">Floor status</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8ea3c2]" aria-hidden="true" />
            <span>Registered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#b3655c]" aria-hidden="true" />
            <span>Disputed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#b6b0a3]" aria-hidden="true" />
            <span>Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#c9a24a]" aria-hidden="true" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#7d8590]" aria-hidden="true" />
            <span>Underground</span>
          </div>
        </div>

        <span>Drag to rotate &middot; right-drag to pan &middot; scroll to zoom</span>
      </div>
    </div>
  );
};

export default Building3D;
