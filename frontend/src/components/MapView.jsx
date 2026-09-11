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
 * MapView Component
 *
 * Renders an interactive OpenStreetMap 2D parcel footprint map using Leaflet.
 * Map render logic is unchanged; only the surrounding chrome is styled to the
 * institutional theme.
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
    <div className="relative w-full h-full min-h-[500px] bg-sheet border border-rule overflow-hidden flex flex-col">
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
                    <div className="font-semibold text-ink">{building.parcelId}</div>
                    <div className="text-ink-muted">{building.name}</div>
                    <div className="text-[11px] mt-0.5">
                      {building.floors?.length || 0} floors &middot;{' '}
                      <span className={isDisputed ? 'text-maroon font-semibold' : 'text-navy'}>
                        {isDisputed ? 'Title under dispute' : 'Registered'}
                      </span>
                    </div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>

      {/* Quiet bottom toolbar */}
      <div className="bg-paper border-t border-rule px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs text-ink-muted">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-ink">Legend</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#3b82f6]/50 border border-[#2563eb]" aria-hidden="true" />
            <span>Registered parcel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#ef4444]/50 border border-dashed border-[#dc2626]" aria-hidden="true" />
            <span>Disputed parcel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#fbbf24]/70 border border-[#f59e0b]" aria-hidden="true" />
            <span>Active parcel</span>
          </div>
        </div>

        <span>EPSG:4326 (WGS 84) &middot; Select a parcel to inspect in 3D</span>
      </div>
    </div>
  );
};

export default MapView;
