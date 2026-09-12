import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { C, OV_POS, OV_TAR } from './city/constants.js';
import { createMaterials } from './city/materials.js';
import { createInfrastructure } from './city/infrastructure.js';
import { createPrivateBuildings } from './city/privateBuildings.js';
import { createPublicBuildings } from './city/publicBuildings.js';
import { setupInteraction } from './city/interaction.js';
import { createCameraManager } from './city/cameraManager.js';

/* ═══════════════════════════════════════════════════════════════════════════
   CITYSCENE — Slim React orchestrator
   Wires up modules, manages React lifecycle, and runs the render loop.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CityScene({
  buildings = [],
  selectedParcelId,
  selectedFloorUlpin,
  indoorMode,
  onSelectBuilding,
  onFloorClick,
  onExitBuilding,
  navStart,
  navEnd,
  streetView,
}) {
  const mountRef = useRef(null);
  const internalsRef = useRef(null);

  /* ── Keep callbacks fresh without re-running the scene setup ── */
  const cbRef = useRef({ onSelectBuilding, onFloorClick, onExitBuilding });
  useEffect(() => { cbRef.current = { onSelectBuilding, onFloorClick, onExitBuilding }; });

  /* ── Prop-driven side effects ── */
  const prevParcelRef = useRef(selectedParcelId);
  useEffect(() => {
    if (selectedParcelId && selectedParcelId !== prevParcelRef.current) {
      prevParcelRef.current = selectedParcelId;
      internalsRef.current?.enterBuilding?.(selectedParcelId);
    }
  }, [selectedParcelId]);

  useEffect(() => {
    internalsRef.current?.applySelection?.(selectedFloorUlpin);
    if (indoorMode && selectedFloorUlpin) {
      internalsRef.current?.transitionIndoor?.(selectedParcelId, selectedFloorUlpin);
    } else if (!indoorMode && internalsRef.current) {
      internalsRef.current?.exitIndoor?.(selectedParcelId);
    }
  }, [selectedFloorUlpin, indoorMode, selectedParcelId]);

  useEffect(() => { internalsRef.current?.drawRoute?.(navStart, navEnd); }, [navStart, navEnd]);

  const isStreetViewRef = useRef(false);
  useEffect(() => {
    isStreetViewRef.current = streetView;
    internalsRef.current?.toggleStreetView?.(streetView);
  }, [streetView]);

  /* ═══════════════════════════════════════════════════════════════════
     MAIN SCENE SETUP (runs once when buildings data arrives)
     ═══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const W = container.clientWidth || 800;
    const H = container.clientHeight || 600;

    /* ─── Scene, Camera, Renderer ─── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C.sky);
    scene.fog = new THREE.FogExp2(C.fog, 0.0035);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 500);
    camera.position.copy(OV_POS);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    /* ─── Controls ─── */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 2;
    controls.maxDistance = 120;
    controls.target.copy(OV_TAR);
    controls.update();

    /* ─── Warm Golden-Hour Lighting ─── */
    const hemi = new THREE.HemisphereLight('#ffecd2', '#c8a06e', 0.65);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight('#ffd78f', 2.0);
    sun.position.set(25, 38, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 150;
    sun.shadow.camera.left = -65;
    sun.shadow.camera.right = 65;
    sun.shadow.camera.top = 65;
    sun.shadow.camera.bottom = -65;
    sun.shadow.bias = -0.0003;
    scene.add(sun);

    const fill = new THREE.DirectionalLight('#ffd5a0', 0.35);
    fill.position.set(-30, 15, -30);
    scene.add(fill);

    const ambient = new THREE.AmbientLight('#ffecd2', 0.2);
    scene.add(ambient);

    /* ─── Materials ─── */
    const mats = createMaterials();

    /* ─── Infrastructure (Ground, Roads, Roundabout, Signals…) ─── */
    const cityProps = createInfrastructure(scene, mats);

    /* ─── Buildings ─── */
    const allMeshes = [];
    const buildingMeta = new Map();

    createPrivateBuildings(buildings, scene, mats, allMeshes, buildingMeta);
    createPublicBuildings(buildings, scene, mats, allMeshes, buildingMeta);

    /* ─── Camera Manager ─── */
    const cam = createCameraManager(camera, controls, {
      buildingMeta, cityProps, allMeshes, scene,
    });

    /* ─── Interaction ─── */
    const indoorModeRef = { current: false };
    // Keep indoorModeRef in sync — read from the latest prop via a getter
    const getIndoorMode = () => indoorModeRef.current;

    const cleanupInteraction = setupInteraction(renderer, camera, allMeshes, buildingMeta, {
      onSelectBuilding: (...a) => cbRef.current.onSelectBuilding?.(...a),
      onFloorClick: (...a) => cbRef.current.onFloorClick?.(...a),
      onExitBuilding: () => cbRef.current.onExitBuilding?.(),
      enterBuilding: cam.enterBuilding,
      exitIndoor: cam.exitIndoor,
      isIndoorMode: getIndoorMode,
      getCurrentUlpin: cam.getCurrentUlpin,
      prevParcelRef,
    });

    /* ─── Keyboard + FPS Mouse listeners ─── */
    const cleanupListeners = cam.setupListeners(renderer.domElement);

    /* ─── Expose internals to React effects ─── */
    internalsRef.current = {
      applySelection: cam.applySelection,
      enterBuilding: cam.enterBuilding,
      transitionIndoor: (...a) => { indoorModeRef.current = true; cam.transitionIndoor(...a); },
      exitIndoor: (...a) => { indoorModeRef.current = false; cam.exitIndoor(...a); },
      drawRoute: cam.drawRoute,
      toggleStreetView: cam.toggleStreetView,
    };

    /* ─── Animation Loop ─── */
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      cam.update();
      renderer.render(scene, camera);
    };
    animate();

    /* ─── Resize Observer ─── */
    const ro = new ResizeObserver(() => {
      if (container.clientWidth && container.clientHeight) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      }
    });
    ro.observe(container);

    /* ─── Cleanup ─── */
    return () => {
      cancelAnimationFrame(frameId);
      cleanupInteraction();
      cleanupListeners();
      ro.disconnect();
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
      controls.dispose();
      renderer.dispose();
    };
  }, [buildings]);

  return <div ref={mountRef} className="w-full h-full" />;
}
