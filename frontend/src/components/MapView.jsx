import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Helper component to automatically fit Map bounds around all building footprints
 */
const MapBoundsFitter = ({ buildings }) => {
  const map = useMap();

  useMemo(() => {
    if (!buildings || buildings.length === 0) return;

    const allLatSockets = [];
    const allLngSockets = [];

    buildings.forEach((b) => {
      if (Array.isArray(b.footprint)) {
        b.footprint.forEach(([lng, lat]) => {
          allLatSockets.push(lat);
          allLngSockets.push(lng);
        });
      }
    });

    if (allLatSockets.length > 0) {
      const minLat = Math.min(...allLatSockets);
      const maxLat = Math.max(...allLatSockets);
      const minLng = Math.min(...allLngSockets);
      const maxLng = Math.max(...allLngSockets);

      map.fitBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng]
        ],
        { padding: [50, 50] }
      );
    }
  }, [buildings, map]);

  return null;
};

/**
 * MapView Component
 * 
 * Renders a 2D interactive OpenStreetMap parcel map using Leaflet and react-leaflet.
 * 
 * Props:
 * - buildings: Array of building objects with footprint: [[lng, lat], ...]
 * - selectedParcelId: String parcelId of the currently active building parcel
 * - onSelectBuilding: Callback function (parcelId) => void triggered when user clicks a parcel polygon
 * 
 * Note on Coordinates:
 * Data contract defines footprint as [longitude, latitude].
 * Leaflet Polygon requires [latitude, longitude].
 * We map [lng, lat] => [lat, lng] inside this component.
 */
const MapView = ({ buildings = [], selectedParcelId, onSelectBuilding }) => {
  // Center default coordinates around Ghaziabad / Delhi NCR region if buildings list is empty
  const defaultCenter = [28.6605, 77.4505];
  const defaultZoom = 16;

  // Function to convert data footprint [[lng, lat], ...] to Leaflet format [[lat, lng], ...]
  const getLeafletPositions = (footprint) => {
    if (!Array.isArray(footprint)) return [];
    return footprint.map(([lng, lat]) => [lat, lng]);
  };

  // Helper to check if building has any disputed floors
  const hasDisputedFloor = (building) => {
    if (!building || !Array.isArray(building.floors)) return false;
    return building.floors.some((f) => f.status === 'disputed');
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: '100%', minHeight: '450px' }}
      >
        {/* OpenStreetMap Tile Layer - 100% Free, No API key required */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Auto fit map bounds to encompass all building footprints */}
        <MapBoundsFitter buildings={buildings} />

        {/* Render building footprint polygons */}
        {buildings.map((building) => {
          const positions = getLeafletPositions(building.footprint);
          const isSelected = selectedParcelId === building.parcelId;
          const isDisputed = hasDisputedFloor(building);

          // Color polygon based on status: Red if disputed, Blue/Emerald if registered
          const strokeColor = isSelected ? '#f59e0b' : isDisputed ? '#ef4444' : '#3b82f6';
          const fillColor = isSelected ? '#fbbf24' : isDisputed ? '#f87171' : '#60a5fa';

          return (
            <Polygon
              key={building.parcelId}
              positions={positions}
              pathOptions={{
                color: strokeColor,
                fillColor: fillColor,
                fillOpacity: isSelected ? 0.6 : 0.4,
                weight: isSelected ? 4 : 2,
                dashArray: isDisputed ? '4, 4' : null
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectBuilding) {
                    onSelectBuilding(building.parcelId);
                  }
                }
              }}
            >
              <Tooltip sticky direction="top" opacity={0.9} className="custom-leaflet-tooltip">
                <div className="font-medium text-xs">
                  <div className="font-bold text-slate-900">{building.name || building.parcelId}</div>
                  <div className="text-slate-700">Parcel ID: {building.parcelId}</div>
                  <div className="text-slate-600 font-semibold mt-0.5">
                    {building.floors?.length || 0} Floors | Status:{' '}
                    <span className={isDisputed ? 'text-red-600' : 'text-blue-600'}>
                      {isDisputed ? 'Contains Dispute' : 'Registered'}
                    </span>
                  </div>
                </div>
              </Tooltip>

              <Popup>
                <div className="p-1 max-w-[220px]">
                  <div className="font-bold text-sm text-slate-900">{building.name || building.parcelId}</div>
                  <div className="text-xs text-slate-600 mb-2">{building.address}</div>

                  <div className="bg-slate-100 p-2 rounded text-xs space-y-1">
                    <div><span className="font-semibold">Parcel ID:</span> {building.parcelId}</div>
                    <div><span className="font-semibold">Floors:</span> {building.floors?.length || 0} Above-ground</div>
                    {building.underground && (
                      <div><span className="font-semibold">Underground:</span> {building.underground.levels} Level ({building.underground.type})</div>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectBuilding && onSelectBuilding(building.parcelId)}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded shadow transition-colors"
                  >
                    Inspect 3D Building →
                  </button>
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-slate-700/60 shadow-xl z-[400] pointer-events-none">
        <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">2D Parcel Legend</h4>
        <div className="flex flex-col gap-1 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-blue-500/70 border border-blue-400 inline-block" />
            <span>Standard Parcel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-red-500/70 border border-red-400 border-dashed inline-block" />
            <span>Parcel with Dispute</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-amber-400/80 border-2 border-amber-500 inline-block" />
            <span>Selected Parcel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
