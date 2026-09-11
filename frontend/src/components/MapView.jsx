import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from 'react-leaflet';
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
        { padding: [60, 60] }
      );
    }
  }, [buildings, map]);

  return null;
};

/**
 * MapView Component (Government GIS Cadastral View)
 * 
 * Renders an interactive OpenStreetMap 2D parcel footprint map using Leaflet.
 * Clean layout with zero intrusive floating box overlays covering map tiles.
 * 
 * Props:
 * - buildings: Array of building objects with footprint [[lng, lat], ...]
 * - selectedParcelId: String parcelId of active parcel
 * - onSelectBuilding: Callback (parcelId) => void
 */
const MapView = ({ buildings = [], selectedParcelId, onSelectBuilding }) => {
  const defaultCenter = [28.6605, 77.4505];
  const defaultZoom = 16;

  // Convert contract [[lng, lat]...] to Leaflet [[lat, lng]...]
  const getLeafletPositions = (footprint) => {
    if (!Array.isArray(footprint)) return [];
    return footprint.map(([lng, lat]) => [lat, lng]);
  };

  const hasDisputedFloor = (building) => {
    if (!building || !Array.isArray(building.floors)) return false;
    return building.floors.some((f) => f.status === 'disputed');
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex flex-col">
      {/* Leaflet Map Canvas */}
      <div className="w-full flex-1 relative z-0">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ height: '100%', minHeight: '450px' }}
        >
          {/* Free OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <MapBoundsFitter buildings={buildings} />

          {/* Footprint Polygons */}
          {buildings.map((building) => {
            const positions = getLeafletPositions(building.footprint);
            const isSelected = selectedParcelId === building.parcelId;
            const isDisputed = hasDisputedFloor(building);

            const strokeColor = isSelected ? '#f59e0b' : isDisputed ? '#dc2626' : '#2563eb';
            const fillColor = isSelected ? '#fbbf24' : isDisputed ? '#ef4444' : '#3b82f6';

            return (
              <Polygon
                key={building.parcelId}
                positions={positions}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: isSelected ? 0.65 : 0.4,
                  weight: isSelected ? 4 : 2,
                  dashArray: isDisputed ? '5, 5' : null
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectBuilding) {
                      onSelectBuilding(building.parcelId);
                    }
                  }
                }}
              >
                <Tooltip sticky direction="top" opacity={0.95} className="custom-leaflet-tooltip">
                  <div className="p-1 text-xs">
                    <div className="font-bold text-slate-900">{building.parcelId}</div>
                    <div className="text-slate-700 font-medium">{building.name}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {building.floors?.length || 0} Floors |{' '}
                      <span className={isDisputed ? 'text-red-600 font-bold' : 'text-blue-600 font-bold'}>
                        {isDisputed ? '⚠️ Dispute Status' : '✓ Registered'}
                      </span>
                    </div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>

      {/* CLEAN BOTTOM CADASTRAL TOOLBAR (No floating overlapping boxes on map!) */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        {/* Cadastral Legend */}
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Parcel Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500/70 border border-blue-400" />
            <span className="text-slate-300 font-medium">Standard Parcel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500/70 border border-red-400 border-dashed" />
            <span className="text-slate-300 font-medium">Disputed Parcel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400 border-2 border-amber-500" />
            <span className="text-amber-300 font-semibold">Active Parcel</span>
          </div>
        </div>

        {/* Spatial Coordinate Standard Badge */}
        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">EPSG:4326 (WGS 84)</span>
          <span>Click any parcel to inspect in 3D</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
