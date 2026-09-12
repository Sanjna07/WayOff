import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CityScene from './components/CityScene';
import FloorDetails from './components/FloorDetails';
import { SAMPLE_BUILDINGS } from './data/sampleBuildings';
import NavigationPanel from './components/NavigationPanel';

function App() {
  const [selectedParcelId, setSelectedParcelId] = useState('');
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [indoorMode, setIndoorMode] = useState(false);
  
  const [navStart, setNavStart] = useState('');
  const [navEnd, setNavEnd] = useState('');
  const [streetView, setStreetView] = useState(false);

  const activeBuilding = SAMPLE_BUILDINGS.find((b) => b.parcelId === selectedParcelId) || null;

  useEffect(() => {
    const handleEnterIndoor = (e) => {
      // Keep selected building and floor, just set mode
      setIndoorMode(true);
    };
    window.addEventListener('enter-indoor', handleEnterIndoor);
    return () => window.removeEventListener('enter-indoor', handleEnterIndoor);
  }, []);

  const handleSelectBuilding = (parcelId) => {
    setSelectedParcelId(parcelId);
    setSelectedFloor(null);
    setIndoorMode(false);
  };

  const handleFloorClick = (floorData) => {
    setSelectedFloor(floorData);
  };

  const handleExitBuilding = () => {
    setIndoorMode(false);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-paper">
      <Header
        buildings={SAMPLE_BUILDINGS}
        selectedParcelId={selectedParcelId}
        onSelectBuilding={handleSelectBuilding}
      />

      {/* Main viewport */}
      <main className="flex-1 relative overflow-hidden">
        {/* 3D City fills entire area */}
        <div className="absolute inset-0">
          <CityScene
            buildings={SAMPLE_BUILDINGS}
            selectedParcelId={selectedParcelId}
            selectedFloorUlpin={selectedFloor?.ulpin || ''}
            indoorMode={indoorMode}
            onSelectBuilding={handleSelectBuilding}
            onFloorClick={handleFloorClick}
            onExitBuilding={handleExitBuilding}
            navStart={navStart}
            navEnd={navEnd}
            streetView={streetView}
          />
        </div>

        {!indoorMode && (
          <NavigationPanel 
            buildings={SAMPLE_BUILDINGS}
            navStart={navStart}
            navEnd={navEnd}
            setNavStart={setNavStart}
            setNavEnd={setNavEnd}
          />
        )}

        {/* Floating FloorDetails panel (hide in indoor mode, or adapt it) */}
        {!indoorMode && (
            <div className="absolute top-4 right-4 bottom-4 w-[360px] max-h-full overflow-y-auto pointer-events-none">
              <div className="pointer-events-auto">
                <FloorDetails
                  selectedBuilding={activeBuilding}
                  selectedFloor={selectedFloor}
                  onFloorSelect={handleFloorClick}
                />
              </div>
            </div>
        )}
        
        {indoorMode && (
          <div className="absolute bottom-6 right-[380px] pointer-events-auto">
            <button 
              onClick={handleExitBuilding}
              className="glass hover:bg-sheet/60 text-ink px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-rule hover:border-navy/50 shadow-lg"
            >
              Return to City View
            </button>
          </div>
        )}

        {/* Floating hints and controls (bottom left) */}
        <div className="absolute bottom-4 left-4 flex gap-4 pointer-events-none">
          <div className="glass rounded-xl px-4 py-2.5 text-[11px] text-ink-muted">
            {indoorMode ? (
              <><span className="text-ink-faint">WASD</span> walk · <span className="text-ink-faint">Drag</span> look around</>
            ) : streetView ? (
              <><span className="text-ink-faint">WASD</span> walk · <span className="text-ink-faint">Drag</span> look around · <span className="text-ink-faint">Esc</span> exit</>
            ) : (
              <><span className="text-ink-faint">WASD</span> move · <span className="text-ink-faint">Drag</span> rotate · <span className="text-ink-faint">Scroll</span> zoom · <span className="text-ink-faint">Right-drag</span> pan</>
            )}
          </div>
          {!indoorMode && (
              <button 
                onClick={() => setStreetView(!streetView)}
                className="pointer-events-auto glass hover:bg-sheet/60 text-ink px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-rule shadow-lg flex items-center gap-2"
              >
                {streetView ? 'Exit Street View' : 'Enter Street View'}
              </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
