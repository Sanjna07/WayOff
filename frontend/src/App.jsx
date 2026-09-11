import React, { useState } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import Building3D from './components/Building3D';
import FloorDetails from './components/FloorDetails';
import { SAMPLE_BUILDINGS } from './data/sampleBuildings';

/**
 * Quiet panel heading with a hairline rule. Serif title, muted note.
 */
const PanelHeader = ({ title, note }) => (
  <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
    <h2 className="font-heading text-sm text-navy">{title}</h2>
    {note && <span className="text-xs text-ink-faint">{note}</span>}
  </div>
);

/**
 * App Main Component
 *
 * National cadastral registry workspace: 2D parcel map, 3D vertical
 * elevation and the cadastral record panel.
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
    <div className="min-h-screen bg-paper text-ink flex flex-col selection:bg-navy selection:text-white">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        buildings={SAMPLE_BUILDINGS}
        selectedParcelId={selectedParcelId}
        onSelectBuilding={handleSelectBuilding}
      />

      {/* Main workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Spatial viewers */}
        <div className="lg:col-span-8 space-y-5">
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <PanelHeader title="Cadastral parcel map (2D)" note="OpenStreetMap &middot; Leaflet" />
                <div className="h-[520px]">
                  <MapView
                    buildings={SAMPLE_BUILDINGS}
                    selectedParcelId={selectedParcelId}
                    onSelectBuilding={handleSelectBuilding}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <PanelHeader title="Vertical floor elevation (3D)" note="Three.js viewer" />
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

          {viewMode === 'map' && (
            <div className="flex flex-col gap-2">
              <PanelHeader title="Cadastral parcel map (2D)" note="OpenStreetMap &middot; Leaflet" />
              <div className="h-[640px]">
                <MapView
                  buildings={SAMPLE_BUILDINGS}
                  selectedParcelId={selectedParcelId}
                  onSelectBuilding={handleSelectBuilding}
                />
              </div>
            </div>
          )}

          {viewMode === '3d' && (
            <div className="flex flex-col gap-2">
              <PanelHeader title="Vertical floor elevation (3D)" note="Three.js viewer" />
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

        {/* Cadastral record panel - the data of record */}
        <div className="lg:col-span-4 lg:sticky lg:top-32 lg:border-l lg:border-rule lg:pl-6">
          <FloorDetails
            selectedBuilding={activeBuilding}
            selectedFloor={selectedFloor}
            onFloorSelect={setSelectedFloor}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-rule py-3 px-6 text-center text-xs text-ink-faint">
        <p>
          WayOff &middot; Cadastral Land Parcel Registry &middot; ULPIN integrated 3D framework &middot; WGS 84 (EPSG:4326)
        </p>
      </footer>
    </div>
  );
}

export default App;
