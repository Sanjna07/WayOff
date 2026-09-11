import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Building3D Component (Government Cadastral CAD Grade)
 * 
 * Renders an architectural 3D building model with stacked floor plates, glass facades,
 * subterranean levels, elevation ruler ticks, and non-intrusive controls.
 * 
 * Props:
 * - building: Object matching contract { parcelId, footprint, floors, underground }
 * - onFloorClick: Callback (floorData) => void on Raycast click
 * - selectedFloorUlpin: String ULPIN of selected floor
 */
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
    // 1. SCENE & CAMERA SETUP
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene();
    // Deep dark slate background matching government CAD terminals
    scene.background = new THREE.Color('#090d16');
    scene.fog = new THREE.FogExp2('#090d16', 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(22, 18, 26);

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
    // 4. ARCHITECTURAL LIGHTING SYSTEM
    // -------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.75);
    scene.add(ambientLight);

    // Key Directional Sun
    const sunLight = new THREE.DirectionalLight('#ffffff', 1.4);
    sunLight.position.set(20, 30, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Cool blue rim light for CAD edge highlighting
    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.5);
    rimLight.position.set(-20, 15, -20);
    scene.add(rimLight);

    // -------------------------------------------------------------------------
    // 5. CADASTRAL GROUND GRID & AXIS HELPERS
    // -------------------------------------------------------------------------
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Technical CAD grid overlay
    const gridHelper = new THREE.GridHelper(80, 40, '#3b82f6', '#1e293b');
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // -------------------------------------------------------------------------
    // 6. BUILDING ARCHITECTURAL STACKING
    // -------------------------------------------------------------------------
    const interactiveMeshes = [];

    if (building) {
      const boxWidth = 9.0;
      const boxDepth = 9.0;

      // Status color palette (Sleek professional tones)
      const getStatusMaterials = (status, isSelected) => {
        let primaryColor = '#2563eb'; // Registered - Royal Blue
        let edgeColor = '#60a5fa';

        if (status === 'disputed') {
          primaryColor = '#dc2626'; // Disputed - Crimson Red
          edgeColor = '#f87171';
        } else if (status === 'vacant') {
          primaryColor = '#64748b'; // Vacant - Steel Slate
          edgeColor = '#94a3b8';
        }

        if (isSelected) {
          primaryColor = '#f59e0b'; // Selected - Amber Gold
          edgeColor = '#fcd34d';
        }

        return {
          wallMat: new THREE.MeshStandardMaterial({
            color: primaryColor,
            roughness: 0.3,
            metalness: 0.2,
            transparent: true,
            opacity: isSelected ? 0.95 : 0.88,
            emissive: isSelected ? '#d97706' : '#000000',
            emissiveIntensity: isSelected ? 0.4 : 0
          }),
          edgeColor
        };
      };

      // --- A. SUBTERRANEAN UNDERGROUND LEVEL (Negative Y Axis) ---
      if (building.underground) {
        const ug = building.underground;
        const ugLevels = ug.levels || 1;
        const ugHeight = ugLevels * 3.2;

        // Cutout pit frame
        const pitGeo = new THREE.BoxGeometry(boxWidth * 1.02, ugHeight, boxDepth * 1.02);
        const pitMat = new THREE.MeshBasicMaterial({ color: '#020617', wireframe: true });
        const pitMesh = new THREE.Mesh(pitGeo, pitMat);
        pitMesh.position.set(0, -ugHeight / 2, 0);
        scene.add(pitMesh);

        // Underground structure box
        const ugGeo = new THREE.BoxGeometry(boxWidth * 0.96, ugHeight * 0.96, boxDepth * 0.96);
        const isSelected = selectedFloorUlpin === ug.ulpin;
        const ugMat = new THREE.MeshStandardMaterial({
          color: isSelected ? '#f59e0b' : '#334155',
          roughness: 0.7,
          metalness: 0.4,
          transparent: true,
          opacity: 0.85,
          emissive: isSelected ? '#b45309' : '#000000',
          emissiveIntensity: isSelected ? 0.3 : 0
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

        // Subterranean Wireframe Cage
        const wireGeo = new THREE.WireframeGeometry(ugGeo);
        const wireMat = new THREE.LineBasicMaterial({ color: isSelected ? '#fef08a' : '#475569', linewidth: 1.5 });
        const wireframe = new THREE.LineSegments(wireGeo, wireMat);
        ugMesh.add(wireframe);

        scene.add(ugMesh);
        interactiveMeshes.push(ugMesh);
      }

      // --- B. ABOVE-GROUND FLOORS (Stacked Bottom-to-Top along Positive Y Axis) ---
      if (Array.isArray(building.floors)) {
        let currentY = 0;

        building.floors.forEach((floor) => {
          const floorHeight = floor.height || 3.2;
          const isSelected = selectedFloorUlpin === floor.ulpin;
          const { wallMat, edgeColor } = getStatusMaterials(floor.status, isSelected);

          // Floor Box Geometry
          const floorGeo = new THREE.BoxGeometry(boxWidth, floorHeight, boxDepth);
          const floorMesh = new THREE.Mesh(floorGeo, wallMat);
          floorMesh.castShadow = true;
          floorMesh.receiveShadow = true;
          floorMesh.position.set(0, currentY + floorHeight / 2, 0);

          // Floor userData for Raycasting
          floorMesh.userData = {
            type: 'floor',
            floorNumber: floor.floorNumber,
            height: floor.height,
            ulpin: floor.ulpin,
            owner: floor.owner,
            status: floor.status,
            parcelId: building.parcelId
          };

          // --- ARCHITECTURAL SLAB & FACADE MULLION ACCENTS ---
          // Floor base slab (concrete plate effect)
          const slabGeo = new THREE.BoxGeometry(boxWidth + 0.4, 0.25, boxDepth + 0.4);
          const slabMat = new THREE.MeshStandardMaterial({
            color: isSelected ? '#fbbf24' : '#0f172a',
            roughness: 0.4,
            metalness: 0.3
          });
          const slabMesh = new THREE.Mesh(slabGeo, slabMat);
          slabMesh.position.y = -floorHeight / 2 + 0.125;
          floorMesh.add(slabMesh);

          // Glass Window Inset Frames (Architectural realism)
          const glassGeo = new THREE.BoxGeometry(boxWidth * 0.98, floorHeight * 0.65, boxDepth * 0.98);
          const glassMat = new THREE.MeshStandardMaterial({
            color: '#38bdf8',
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.3
          });
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          floorMesh.add(glassMesh);

          // CAD Wireframe Edges
          const edgesGeo = new THREE.EdgesGeometry(floorGeo);
          const edgesMat = new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 2 });
          const edgeLines = new THREE.LineSegments(edgesGeo, edgesMat);
          floorMesh.add(edgeLines);

          scene.add(floorMesh);
          interactiveMeshes.push(floorMesh);

          currentY += floorHeight;
        });

        // Focus controls camera on middle of building stack
        controls.target.set(0, currentY / 2, 0);
        controls.update();
      }
    }

    meshesRef.current = interactiveMeshes;

    // -------------------------------------------------------------------------
    // 7. RAYCASTING & INTERACTION
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

      interactiveMeshes.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material.dispose();
        }
      });

      groundGeo.dispose();
      groundMat.dispose();
      controls.dispose();
      renderer.dispose();
      if (domElement && domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    };
  }, [building, selectedFloorUlpin, onFloorClick]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex flex-col">
      {/* Three.js Canvas Container (Takes full main area) */}
      <div ref={mountRef} className="w-full flex-1 relative" />

      {/* CLEAN BOTTOM TOOLBAR (No overlapping boxes over the 3D model!) */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        {/* Status Legend */}
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Floor Status:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span className="text-slate-300 font-medium">Registered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-slate-300 font-medium">Disputed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm shadow-slate-400/50" />
            <span className="text-slate-300 font-medium">Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span className="text-amber-300 font-semibold">Selected</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <span className="w-2.5 h-2.5 rounded bg-slate-700 border border-slate-500" />
            <span className="text-slate-400">Underground</span>
          </div>
        </div>

        {/* Orbit Control Tip */}
        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">3D CAD Navigation</span>
          <span>Left-click: Rotate | Right-click: Pan | Scroll: Zoom</span>
        </div>
      </div>
    </div>
  );
};

export default Building3D;
