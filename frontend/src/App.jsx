import React, { useState } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import Building3D from './components/Building3D';
import FloorDetails from './components/FloorDetails';
import { SAMPLE_BUILDINGS } from './data/sampleBuildings';

/**
 * App Main Component (Government Cadastral Grade)
 */
function App() {
  const [viewMode, setViewMode] = useState('split');
  const [selectedParcelId, setSelectedParcelId] = useState(SAMPLE_BUILDINGS[0]?.parcelId || '');
  const [selectedFloor, setSelectedFloor] = useState(null);

  const activeBuilding = SAMPLE_BUILDINGS.find((b) => b.parcelId === selectedParcelId) || SAMPLE_BUILDINGS[0];

  const handleSelectBuilding = (parcelId) => {
    setSelectedParcelId(parcelId);
    setSelectedFloor(null);
  };

  const handleFloorClick = (floorData) => {
    setSelectedFloor(floorData);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Official Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        buildings={SAMPLE_BUILDINGS}
        selectedParcelId={selectedParcelId}
        onSelectBuilding={handleSelectBuilding}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Spatial Visualizer Viewports Area */}
        <div className="lg:col-span-8 space-y-4">
          {/* VIEW MODE: SPLIT VIEW (50/50 2D Map & 3D Building) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-400 px-1">
                  <span>🗺️ 2D CADASTRAL PARCEL MAP</span>
                  <span className="text-[10px] text-slate-500">Leaflet GIS Engine</span>
                </div>
                <div className="h-[520px]">
                  <MapView
                    buildings={SAMPLE_BUILDINGS}
                    selectedParcelId={selectedParcelId}
                    onSelectBuilding={handleSelectBuilding}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-400 px-1">
                  <span>🏢 3D VERTICAL FLOOR ELEVATION</span>
                  <span className="text-[10px] text-slate-500">Three.js WebGL Engine</span>
                </div>
                <div className="h-[520px]">
                  <Building3D
                    building={activeBuilding}
                    onFloorClick={handleFloorClick}
                    selectedFloorUlpin={selectedFloor?.ulpin}
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE: 2D CADASTRAL MAP FULL VIEW */}
          {viewMode === 'map' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-400 px-1">
                <span>🗺️ 2D CADASTRAL PARCEL MAP (FULL VIEWPORT)</span>
              </div>
              <div className="h-[640px]">
                <MapView
                  buildings={SAMPLE_BUILDINGS}
                  selectedParcelId={selectedParcelId}
                  onSelectBuilding={handleSelectBuilding}
                />
              </div>
            </div>
          )}

          {/* VIEW MODE: 3D BUILDING FULL VIEW */}
          {viewMode === '3d' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-400 px-1">
                <span>🏢 3D VERTICAL FLOOR ELEVATION (FULL VIEWPORT)</span>
              </div>
              <div className="h-[640px]">
                <Building3D
                  building={activeBuilding}
                  onFloorClick={handleFloorClick}
                  selectedFloorUlpin={selectedFloor?.ulpin}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cadastral Inspector Sidebar */}
        <div className="lg:col-span-4 sticky top-20">
          <FloorDetails
            selectedBuilding={activeBuilding}
            selectedFloor={selectedFloor}
            onFloorSelect={setSelectedFloor}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-6 text-center text-xs text-slate-500 font-mono">
        <p>
          Government of India Land Revenue Cadastral Portal &bull; ULPIN Integrated 3D Framework &bull; Open Source Engine (No Mapbox / API Keys)
        </p>
      </footer>
    </div>
  );
}

export default App;
