# GeoBuilding 3D Stack & 2D Map Parcel Visualizer

An interactive 3D building visualizer built with **React** and **Three.js**, paired with a 2D OpenStreetMap parcel map using **Leaflet** (`react-leaflet`). 

This project requires **zero API keys**, **no Mapbox**, and **no paid services**.

---

## 📁 Directory Structure

```text
WayOff/
├── backend/               # Reserved for future REST / GraphQL API backend (currently empty)
├── frontend/              # React + Three.js + Leaflet frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Building3D.jsx   # Three.js 3D stacked floor viewer with Raycasting & lighting
│   │   │   ├── MapView.jsx      # React-Leaflet 2D OpenStreetMap parcel footprint map
│   │   │   ├── FloorDetails.jsx # Inspector panel for selected floors & ULPIN details
│   │   │   └── Header.jsx       # Navigation bar & View Mode toggles (2D, 3D, Split View)
│   │   ├── data/
│   │   │   └── sampleBuildings.js # Hardcoded mock dataset conforming to Data Contract
│   │   ├── App.jsx              # Main view switcher & state manager
│   │   ├── index.css            # Tailwind CSS styling & dark mode system
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md              # Project documentation & backend integration guide
```

---

## 📋 Data Contract Specification

All components consume building datasets following this strict JSON schema (`src/data/sampleBuildings.js`):

```json
{
  "parcelId": "UP-GZB-0001",
  "name": "Raj Nagar Heights",
  "footprint": [
    [77.45, 28.66],
    [77.451, 28.66],
    [77.451, 28.661],
    [77.45, 28.661]
  ],
  "floors": [
    {
      "floorNumber": 1,
      "height": 3.2,
      "ulpin": "UP-GZB-0001-F1",
      "owner": "Ramesh Kumar",
      "status": "registered"
    },
    {
      "floorNumber": 2,
      "height": 3.2,
      "ulpin": "UP-GZB-0001-F2",
      "owner": "Sita Devi",
      "status": "disputed"
    },
    {
      "floorNumber": 3,
      "height": 3.2,
      "ulpin": "UP-GZB-0001-F3",
      "owner": "Unallocated",
      "status": "vacant"
    }
  ],
  "underground": {
    "levels": 1,
    "ulpin": "UP-GZB-0001-UG1",
    "type": "parking"
  }
}
```

### Key Contract Rules:
1. **`footprint`**: Array of `[longitude, latitude]` pairs forming a closed 2D polygon (4+ points). `MapView.jsx` handles conversion from `[lng, lat]` to Leaflet's required `[lat, lng]`.
2. **`floors`**: Array ordered bottom-to-top. Stacked vertically in Three.js along the Y-axis using cumulative floor `height` values.
3. **`status`**: Can be `"registered"` (Blue), `"disputed"` (Red), or `"vacant"` (Gray).
4. **`underground`**: Separate object rendered below ground level (negative Y-axis) with its own level depth, ULPIN, and type.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+) & npm

### 2. Run Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🎨 Component Highlights

### 1. `Building3D.jsx`
- Pure **Three.js** WebGL scene with OrbitControls (rotate, pan, zoom).
- Dynamic vertical stacking of `BoxGeometry` floor meshes based on cumulative heights.
- Subterranean underground level geometry rendered at negative Y coordinates.
- **Raycasting**: Mouse clicks on floor boxes trigger the `onFloorClick(floorData)` prop.
- Proper WebGL memory disposal and DOM cleanup on React unmount.
- Annotated inline comments for Three.js learners.

### 2. `MapView.jsx`
- 2D parcel mapping using **Leaflet** & **OpenStreetMap** tile servers (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- Parcel polygons with dispute status stroke styling.
- `onSelectBuilding(parcelId)` prop callback when clicking parcel polygons.

### 3. View Modes (`App.jsx`)
- **Split View**: 2D Map and 3D Building visualizers side by side.
- **2D Map**: Expanded 2D GIS map.
- **3D Building**: Expanded 3D WebGL building scene.

---

## 🔌 Future Backend Integration Guide

When ready to connect a real backend (e.g., Python FastAPI / Express / Django in `backend/`):

1. **Keep Component Internals Intact**: `Building3D`, `MapView`, and `FloorDetails` expect props conforming to the Data Contract above.
2. **Replace Data Fetching in `App.jsx`**:
   Replace the hardcoded `SAMPLE_BUILDINGS` import in `App.jsx` with a `useEffect` API fetch call:
   ```javascript
   // Example API replacement in App.jsx
   const [buildings, setBuildings] = useState([]);

   useEffect(() => {
     fetch('http://localhost:8000/api/parcels')
       .then(res => res.json())
       .then(data => setBuildings(data));
   }, []);
   ```
