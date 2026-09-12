import React, { useMemo, useState, useRef } from 'react';
import Map, { Source, Layer, Popup, Marker } from 'react-map-gl/maplibre';
import { User, Navigation2 } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

const PARCEL_COLORS = {
  registered: { fill: '#54688c' },
  disputed: { fill: '#84413a' },
  vacant: { fill: '#8a6d2f' }
};

export default function Map3D({ buildings = [], selectedParcelId, onSelectBuilding, onSelectFloor }) {
  const mapRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [is3D, setIs3D] = useState(true);

  // Default viewport centers around the sample buildings
  const [viewState, setViewState] = useState({
    longitude: 77.4502,
    latitude: 28.6601,
    zoom: 18,
    pitch: 60,
    bearing: 30
  });

  const toggle3D = () => {
    const newPitch = is3D ? 0 : 60;
    setIs3D(!is3D);
    if (mapRef.current) {
      mapRef.current.flyTo({ pitch: newPitch, duration: 1000 });
    }
  };

  // Convert sample buildings into a GeoJSON FeatureCollection of 3D floors
  const floorsGeoJSON = useMemo(() => {
    const features = [];

    buildings.forEach((building) => {
      let currentBase = 0;
      
      // Underground floor
      if (building.underground) {
        const ugHeight = building.underground.levels * 3; // 3m per level
        features.push({
          type: 'Feature',
          properties: {
            buildingId: building.parcelId,
            buildingName: building.name,
            floorNumber: 'UG',
            ulpin: building.underground.ulpin,
            status: 'registered',
            base_elevation: -ugHeight,
            // Gap of 0.2 to show distinct floors
            ceiling_height: -0.2,
            color: '#333333'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [building.footprint]
          }
        });
      }

      // Above ground floors
      building.floors.forEach((floor) => {
        const floorCeil = currentBase + floor.height;
        features.push({
          type: 'Feature',
          properties: {
            buildingId: building.parcelId,
            buildingName: building.name,
            floorNumber: floor.floorNumber,
            ulpin: floor.ulpin,
            owner: floor.owner,
            status: floor.status,
            base_elevation: currentBase,
            // Gap of 0.2 to show distinct floors
            ceiling_height: floorCeil - 0.2,
            color: PARCEL_COLORS[floor.status]?.fill || '#888888',
            isSelected: building.parcelId === selectedParcelId
          },
          geometry: {
            type: 'Polygon',
            coordinates: [building.footprint]
          }
        });
        currentBase = floorCeil;
      });
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }, [buildings, selectedParcelId]);

  // Road
  const roadGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { type: 'road', name: 'Metro / Main Road' },
          geometry: {
            type: 'LineString',
            // Passes by B3(0.0004), B1(0.0010), B2(0.0016)
            coordinates: [
              [77.4490, 28.6590],
              [77.4512, 28.6612]
            ]
          }
        }
      ]
    };
  }, []);

  // Route Destination 1 to 2
  const routeGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { type: 'route' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [77.4496, 28.6595], // B3
              [77.4502, 28.6601], // B1
              [77.4508, 28.6607]  // B2
            ]
          }
        }
      ]
    };
  }, []);

  const onClick = (event) => {
    const feature = event.features && event.features.find(f => f.source === 'floors');
    if (feature) {
      const { buildingId, floorNumber, ulpin, base_elevation } = feature.properties;
      
      onSelectBuilding(buildingId);
      if (onSelectFloor) {
        onSelectFloor(feature.properties);
      }

      // Smooth transition to enter the 3D building area
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [event.lngLat.lng, event.lngLat.lat],
          zoom: 20, // Very close
          pitch: 75, // Look forward
          bearing: viewState.bearing + 25, 
          duration: 2000
        });
      }
    } else {
      // Clicked outside
      onSelectBuilding('');
    }
  };

  const onHover = (event) => {
    const feature = event.features && event.features.find(f => f.source === 'floors');
    if (feature) {
      setHoverInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        ...feature.properties
      });
    } else {
      setHoverInfo(null);
    }
  };

  return (
    <div className="relative w-full h-full bg-sheet border border-rule overflow-hidden">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        interactiveLayerIds={['floors-layer']}
        onClick={onClick}
        onMouseMove={onHover}
      >
        {/* Route / Path Layer */}
        <Source id="route" type="geojson" data={routeGeoJSON}>
          <Layer
            id="route-layer"
            type="line"
            paint={{
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-dasharray': [2, 2]
            }}
          />
        </Source>

        {/* Metro / Main Road Layer */}
        <Source id="road" type="geojson" data={roadGeoJSON}>
          <Layer
            id="road-layer"
            type="line"
            paint={{
              'line-color': '#a3a3a3',
              'line-width': 12
            }}
          />
        </Source>

        {/* 3D Floors Extrusion Layer */}
        <Source id="floors" type="geojson" data={floorsGeoJSON}>
          <Layer
            id="floors-layer"
            type="fill-extrusion"
            paint={{
              'fill-extrusion-color': [
                'case',
                ['boolean', ['get', 'isSelected'], false],
                '#c9a24a', // Highlight color if building is selected
                ['get', 'color']
              ],
              'fill-extrusion-height': ['get', 'ceiling_height'],
              'fill-extrusion-base': ['get', 'base_elevation'],
              'fill-extrusion-opacity': 0.85
            }}
          />
        </Source>

        {/* Character Marker at B1 */}
        <Marker longitude={77.4501} latitude={28.6601} anchor="bottom">
          <div className="bg-navy text-white p-1 rounded-full shadow-lg border-2 border-white">
            <User className="w-4 h-4" />
          </div>
        </Marker>

        {/* Destination Marker at B2 */}
        <Marker longitude={77.4507} latitude={28.6607} anchor="bottom">
          <div className="bg-maroon text-white p-1 rounded-full shadow-lg border-2 border-white">
            <Navigation2 className="w-4 h-4" />
          </div>
        </Marker>

        {hoverInfo && (
          <Popup
            longitude={hoverInfo.longitude}
            latitude={hoverInfo.latitude}
            closeButton={false}
            className="z-50 text-xs"
            anchor="bottom"
          >
            <div className="p-2 text-ink">
              <div className="font-semibold">{hoverInfo.buildingId} - Floor {hoverInfo.floorNumber}</div>
              <div className="text-ink-muted">ULPIN: {hoverInfo.ulpin}</div>
              <div className="mt-1">
                Status:{' '}
                <span className={hoverInfo.status === 'disputed' ? 'text-maroon' : 'text-navy'}>
                  {hoverInfo.status}
                </span>
              </div>
              {hoverInfo.owner && <div>Owner: {hoverInfo.owner}</div>}
              <div>Elev: {hoverInfo.base_elevation}m to {(hoverInfo.ceiling_height + 0.2).toFixed(1)}m</div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Overlays */}
      <div className="absolute top-4 left-4 flex gap-2">
        <button 
          onClick={toggle3D}
          className="bg-white border border-rule px-3 py-1.5 rounded text-xs font-semibold shadow-sm hover:bg-slate-50 transition-colors"
        >
          {is3D ? 'Switch to 2D' : 'Switch to 3D'}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-paper/90 backdrop-blur-md p-3 border border-rule rounded shadow-sm text-xs flex flex-col gap-2 pointer-events-none">
        <span className="font-semibold text-ink">3D Registry Map</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#54688c] block rounded-sm"></span> Registered
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#84413a] block rounded-sm"></span> Disputed
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#c9a24a] block rounded-sm"></span> Selected
        </div>
        <div className="mt-1 flex items-center gap-2 border-t border-rule pt-2">
          <span className="w-3 h-0 border-t-2 border-dashed border-[#3b82f6] block"></span> Route (B1 to B2)
        </div>
      </div>
    </div>
  );
}
