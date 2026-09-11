import React, { useState } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import Building3D from './components/Building3D';
import FloorDetails from './components/FloorDetails';
import { SAMPLE_BUILDINGS } from './data/sampleBuildings';

/**
 * App Main Component
 * 
 * Manages view state (2D Map, 3D Building, or Split View), selected building parcel,
 * and raycast-selected floor state.
 * 
 * Props & Data Flow Architecture:
 * - Data Contract: All data originates from `SAMPLE_BUILDINGS` (or API call in future).
 * - `MapView` receives `buildings` list and `onSelectBuilding(parcelId)`.
 * - `Building3D` receives active `building` object and `onFloorClick(floorData)`.
 * - `FloorDetails` receives selected floor payload and building summary.
 */
function App() {
  // Available view modes: 'split' (2D Map + 3D Building side by side), 'map' (2D full), '3d' (3D full)
  const [viewMode, setViewMode] = useState('split');

  // Currently selected building parcel ID (default to first parcel in sample dataset)
  const [selectedParcelId, setSelectedParcelId] = useState(SAMPLE_BUILDINGS[0]?.parcelId || '');

  // Currently selected floor payload from Raycasting or list click
  const [selectedFloor, setSelectedFloor] = useState(null);

  // Active building object resolved from selectedParcelId
  const activeBuilding = SAMPLE_BUILDINGS.find((b) => b.parcelId === selectedParcelId) || SAMPLE_BUILDINGS[0];

  // Callback when user selects a building parcel from Map or dropdown
  const handleSelectBuilding = (parcelId) => {
    setSelectedParcelId(parcelId);
    setSelectedFloor(null); // Reset floor selection on building switch
  };

  // Callback when user clicks a floor in the 3D scene (Raycasting event)
  const handleFloorClick = (floorData) => {
    setSelectedFloor(floorData);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        buildings={SAMPLE_BUILDINGS}
        selectedParcelId={selectedParcelId}
        onSelectBuilding={handleSelectBuilding}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visualizers Area (Map and/or 3D Scene) */}
        <div className={`space-y-6 ${viewMode === 'split' ? 'lg:col-span-8' : 'lg:col-span-8'}`}>
          {/* VIEW MODE: SPLIT VIEW (Side-by-Side 2D Map & 3D Building) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                  <span>🗺️ 2D OpenStreetMap Parcel View</span>
                  <span className="text-[10px] text-slate-500 font-mono">Leaflet Tiles</span>
                </div>
                <div className="h-[480px]">
                  <MapView
                    buildings={SAMPLE_BUILDINGS}
                    selectedParcelId={selectedParcelId}
                    onSelectBuilding={handleSelectBuilding}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                  <span>🏢 3D Stacked Floor Scene</span>
                  <span className="text-[10px] text-slate-500 font-mono">Three.js WebGL</span>
                </div>
                <div className="h-[480px]">
                  <Building3D
                    building={activeBuilding}
                    onFloorClick={handleFloorClick}
                    selectedFloorUlpin={selectedFloor?.ulpin}
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE: 2D MAP FULL VIEW */}
          {viewMode === 'map' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                <span>🗺️ 2D OpenStreetMap Parcel View (Full View)</span>
              </div>
              <div className="h-[620px]">
                <MapView
                  buildings={SAMPLE_BUILDINGS}
                  selectedParcelId={selectedParcelId}
                  onSelectBuilding={(parcelId) => {
                    handleSelectBuilding(parcelId);
                    // Switch to 3D view after clicking building parcel if desired
                  }}
                />
              </div>
            </div>
          )}

          {/* VIEW MODE: 3D BUILDING FULL VIEW */}
          {viewMode === '3d' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                <span>🏢 3D Stacked Floor Scene (Full Interactive View)</span>
              </div>
              <div className="h-[620px]">
                <Building3D
                  building={activeBuilding}
                  onFloorClick={handleFloorClick}
                  selectedFloorUlpin={selectedFloor?.ulpin}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Inspector Panel */}
        <div className="lg:col-span-4 sticky top-24">
          <FloorDetails
            selectedBuilding={activeBuilding}
            selectedFloor={selectedFloor}
            onFloorSelect={setSelectedFloor}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          GeoBuilding 3D Stack &copy; 2026. Built with Vite, React, Three.js, and Leaflet (OpenStreetMap). No API keys required.
        </p>
      </footer>
    </div>
  );
}

export default App;
