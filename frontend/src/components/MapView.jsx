import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';


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

const PARCEL_COLORS = {
  registered: { stroke: '#54688c', fill: '#8ea3c2' },
  disputed: { stroke: '#84413a', fill: '#b3655c' },
  selected: { stroke: '#8a6d2f', fill: '#c9a24a' }
};


const MapView = ({ buildings = [], selectedParcelId, onSelectBuilding }) => {
  const defaultCenter = [28.6605, 77.4505];
  const defaultZoom = 16;
  const [tilesLoading, setTilesLoading] = useState(true);

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
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            eventHandlers={{
              loading: () => setTilesLoading(true),
              load: () => setTilesLoading(false)
            }}
          />

          <MapBoundsFitter buildings={buildings} />

          {buildings.map((building) => {
            const positions = getLeafletPositions(building.footprint);
            const isSelected = selectedParcelId === building.parcelId;
            const isDisputed = hasDisputedFloor(building);

            const palette = isSelected
              ? PARCEL_COLORS.selected
              : isDisputed
                ? PARCEL_COLORS.disputed
                : PARCEL_COLORS.registered;

            return (
              <Polygon
                key={building.parcelId}
                positions={positions}
                pathOptions={{
                  color: palette.stroke,
                  fillColor: palette.fill,
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

        {tilesLoading && (
          <div className="absolute inset-0 z-[1000] pointer-events-none bg-paper/70 flex items-center justify-center">
            <span className="text-xs text-ink-muted">Loading map tiles&hellip;</span>
          </div>
        )}
      </div>

      <div className="bg-paper border-t border-rule px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs text-ink-muted">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-ink">Legend</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#8ea3c2]/60 border border-[#54688c]" aria-hidden="true" />
            <span>Registered parcel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#b3655c]/60 border border-dashed border-[#84413a]" aria-hidden="true" />
            <span>Disputed parcel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#c9a24a]/80 border border-[#8a6d2f]" aria-hidden="true" />
            <span>Active parcel</span>
          </div>
        </div>

        <span>EPSG:4326 (WGS 84) &middot; Select a parcel to inspect in 3D</span>
      </div>
    </div>
  );
};

export default MapView;
