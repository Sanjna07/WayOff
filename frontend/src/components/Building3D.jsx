import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Building3D Component
 * 
 * Renders a interactive 3D stacked building scene using Three.js based on the building data contract.
 * 
 * Props:
 * - building: Object containing { parcelId, footprint, floors, underground }
 * - onFloorClick: Callback function called when a floor or underground mesh is clicked, receiving (floorData)
 * - selectedFloorUlpin: String (optional) ULPIN of currently selected floor to highlight
 * 
 * Learning Three.js Key Concepts:
 * 1. Scene: The container for all 3D objects, lights, and cameras.
 * 2. Camera: Defines the view perspective into the 3D scene (PerspectiveCamera).
 * 3. Renderer: Renders the 3D scene onto an HTML <canvas> element using WebGL.
 * 4. Geometry & Material: Define the shape (BoxGeometry) and appearance (MeshStandardMaterial) of objects.
 * 5. Raycasting: Projects a ray from the mouse position into the 3D space to detect intersecting objects on click/hover.
 * 6. OrbitControls: Allows user interaction (pan, tilt, zoom) around the scene target.
 */
const Building3D = ({ building, onFloorClick, selectedFloorUlpin }) => {
  // Container div reference where Three.js canvas will be attached
  const mountRef = useRef(null);

  // References to keep track of persistent Three.js instances for interaction & cleanup
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const meshesRef = useRef([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Get current container dimensions
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // -------------------------------------------------------------------------
    // 1. SCENE SETUP
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // Dark Slate / Midnight Navy background
    scene.fog = new THREE.FogExp2('#0f172a', 0.015); // Subtle atmospheric distance fog
    sceneRef.current = scene;

    // -------------------------------------------------------------------------
    // 2. CAMERA SETUP
    // -------------------------------------------------------------------------
    // PerspectiveCamera(fov, aspect ratio, near clipping plane, far clipping plane)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Position camera diagonally elevated to look down at the building
    camera.position.set(18, 16, 24);

    // -------------------------------------------------------------------------
    // 3. RENDERER SETUP
    // -------------------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true; // Enable dynamic shadow rendering
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft realistic shadows
    rendererRef.current = renderer;

    // Append canvas element to React DOM container
    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------------------
    // 4. ORBIT CONTROLS
    // -------------------------------------------------------------------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth inertia movement
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Prevent camera from dipping too far below ground

    // -------------------------------------------------------------------------
    // 5. LIGHTING SETUP
    // -------------------------------------------------------------------------
    // Ambient Light: Soft overall illumination for scene shadows
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    // Directional Light: Sun-like directional rays creating key highlights and shadows
    const dirLight = new THREE.DirectionalLight('#ffffff', 1.2);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -10;
    scene.add(dirLight);

    // Secondary fill light for soft rim highlighting
    const fillLight = new THREE.DirectionalLight('#38bdf8', 0.4);
    fillLight.position.set(-15, 10, -15);
    scene.add(fillLight);

    // -------------------------------------------------------------------------
    // 6. GROUND PLANE & GRID HELPER
    // -------------------------------------------------------------------------
    // Ground Mesh to receive shadows from the building
    const groundGeometry = new THREE.PlaneGeometry(60, 60);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Orient plane horizontally
    ground.position.y = 0; // Ground surface baseline at Y = 0
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid Helper for spatial reference
    const gridHelper = new THREE.GridHelper(60, 30, '#475569', '#334155');
    gridHelper.position.y = 0.01; // Slightly above ground plane to prevent z-fighting depth flicker
    scene.add(gridHelper);

    // -------------------------------------------------------------------------
    // 7. BUILDING FLOOR MESH STACKING
    // -------------------------------------------------------------------------
    const interactiveMeshes = [];

    if (building) {
      // Helper function to return floor color according to contract status
      const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
          case 'disputed':
            return '#ef4444'; // Red for disputed status
          case 'vacant':
            return '#9ca3af'; // Gray for vacant status
          case 'registered':
          default:
            return '#3b82f6'; // Blue for registered status
        }
      };

      // Base footprint dimensions (defaulting to standard width/depth if footprint geometry is rectangular)
      const boxWidth = 8;
      const boxDepth = 8;

      // --- A. UNDERGROUND LEVEL (Negative Y Axis) ---
      if (building.underground) {
        const ug = building.underground;
        const ugLevels = ug.levels || 1;
        const ugHeight = ugLevels * 3.0; // Assume 3m per basement level
        const ugGeometry = new THREE.BoxGeometry(boxWidth * 0.96, ugHeight, boxDepth * 0.96);

        // Dark slate material with subtle metallic sheen
        const ugMaterial = new THREE.MeshStandardMaterial({
          color: '#334155',
          roughness: 0.6,
          metalness: 0.4,
          wireframe: false
        });

        const ugMesh = new THREE.Mesh(ugGeometry, ugMaterial);
        // Position center of underground mesh below Y = 0 baseline
        ugMesh.position.set(0, -ugHeight / 2, 0);

        // Attach custom floor metadata for raycasting interaction
        const ugUserData = {
          type: 'underground',
          ulpin: ug.ulpin,
          levels: ug.levels,
          undergroundType: ug.type,
          parcelId: building.parcelId
        };
        ugMesh.userData = ugUserData;

        // Wireframe cage for subterranean visualization effect
        const wireGeo = new THREE.WireframeGeometry(ugGeometry);
        const wireMat = new THREE.LineBasicMaterial({ color: '#64748b', linewidth: 1 });
        const wireframe = new THREE.LineSegments(wireGeo, wireMat);
        ugMesh.add(wireframe);

        scene.add(ugMesh);
        interactiveMeshes.push(ugMesh);
      }

      // --- B. ABOVE-GROUND FLOORS (Stacked Bottom-to-Top along Positive Y Axis) ---
      if (Array.isArray(building.floors)) {
        let currentY = 0; // Cumulative Y position tracker

        building.floors.forEach((floor) => {
          const floorHeight = floor.height || 3.0;
          const floorGeometry = new THREE.BoxGeometry(boxWidth, floorHeight, boxDepth);

          const baseColor = getStatusColor(floor.status);
          const isSelected = selectedFloorUlpin && selectedFloorUlpin === floor.ulpin;

          const floorMaterial = new THREE.MeshStandardMaterial({
            color: isSelected ? '#fbbf24' : baseColor, // Highlight yellow if selected
            roughness: 0.4,
            metalness: 0.1,
            emissive: isSelected ? '#d97706' : '#000000',
            emissiveIntensity: isSelected ? 0.3 : 0
          });

          const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
          floorMesh.castShadow = true;
          floorMesh.receiveShadow = true;

          // Y coordinate of box center is currentY + half of floor height
          floorMesh.position.set(0, currentY + floorHeight / 2, 0);

          // Store floor data payload directly in Three.js mesh.userData for Raycasting
          floorMesh.userData = {
            type: 'floor',
            floorNumber: floor.floorNumber,
            height: floor.height,
            ulpin: floor.ulpin,
            owner: floor.owner,
            status: floor.status,
            parcelId: building.parcelId
          };

          // Floor separation outline slab for clear architectural definition
          const slabGeometry = new THREE.BoxGeometry(boxWidth + 0.3, 0.15, boxDepth + 0.3);
          const slabMaterial = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 });
          const slabMesh = new THREE.Mesh(slabGeometry, slabMaterial);
          slabMesh.position.y = -floorHeight / 2 + 0.075;
          floorMesh.add(slabMesh);

          scene.add(floorMesh);
          interactiveMeshes.push(floorMesh);

          // Increment currentY by floor height for next level stack
          currentY += floorHeight;
        });

        // Position orbit controls target to center of building height
        controls.target.set(0, currentY / 2, 0);
        controls.update();
      }
    }

    meshesRef.current = interactiveMeshes;

    // -------------------------------------------------------------------------
    // 8. RAYCASTING & INTERACTION HANDLERS
    // -------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerClick = (event) => {
      // Calculate pointer position in normalized device coordinates (-1 to +1)
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update raycaster ray from camera through pointer position
      raycaster.setFromCamera(mouse, camera);

      // Intersect ray against building floor meshes
      const intersects = raycaster.intersectObjects(meshesRef.current, false);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        if (clickedMesh && clickedMesh.userData && onFloorClick) {
          // Trigger React callback with clicked floor's userData payload
          onFloorClick(clickedMesh.userData);
        }
      }
    };

    // Change cursor style on mouse hover over interactive floor boxes
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
    // 9. ANIMATION LOOP
    // -------------------------------------------------------------------------
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update(); // Required if damping is enabled
      renderer.render(scene, camera);
    };
    animate();

    // -------------------------------------------------------------------------
    // 10. RESIZE OBSERVER (Handles responsive viewport changes)
    // -------------------------------------------------------------------------
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // -------------------------------------------------------------------------
    // 11. CLEANUP ON UNMOUNT
    // -------------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animationFrameId);

      domElement.removeEventListener('click', handlePointerClick);
      domElement.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();

      // Dispose interactive meshes, geometries, materials
      interactiveMeshes.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });

      // Dispose ground plane & lights
      groundGeometry.dispose();
      groundMaterial.dispose();
      controls.dispose();

      // Dispose renderer & remove canvas DOM node
      renderer.dispose();
      if (domElement && domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    };
  }, [building, selectedFloorUlpin, onFloorClick]);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Floating Scene Controls & Status Legend Overlay */}
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-700/60 shadow-lg pointer-events-none">
        <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">3D Controls & Legend</h4>
        <div className="flex flex-col gap-1.5 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-500 shadow-sm shadow-blue-500/50 inline-block" />
            <span>Registered Floor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-500 shadow-sm shadow-red-500/50 inline-block" />
            <span>Disputed Floor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-gray-400 shadow-sm shadow-gray-400/50 inline-block" />
            <span>Vacant Floor</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-3 h-3 rounded bg-slate-700 border border-slate-500 inline-block" />
            <span>Underground Level</span>
          </div>
        </div>
      </div>

      {/* Helper text overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-800 text-[11px] text-slate-400 pointer-events-none flex items-center gap-2">
        <span>💡 Left-click + Drag to rotate | Right-click to pan | Scroll to zoom | Click floor for details</span>
      </div>
    </div>
  );
};

export default Building3D;
