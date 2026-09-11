import React from 'react';
import { Map, Box, Columns, Building } from 'lucide-react';

/**
 * Header Component
 * 
 * Top bar navigation with View Mode selector (2D Map, 3D Building, Split View)
 * and Building Parcel quick dropdown switcher.
 */
const Header = ({
  viewMode,
  setViewMode,
  buildings = [],
  selectedParcelId,
  onSelectBuilding
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
              GeoBuilding 3D Stack
              <span className="text-[10px] uppercase font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                OSM + Three.js
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive 2D Parcel Map & 3D Vertically Stacked Floor Visualizer
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {/* Parcel Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold">Active Parcel:</span>
            <select
              value={selectedParcelId || ''}
              onChange={(e) => onSelectBuilding(e.target.value)}
              className="bg-transparent text-slate-200 font-mono font-medium focus:outline-none cursor-pointer"
            >
              {buildings.map((b) => (
                <option key={b.parcelId} value={b.parcelId} className="bg-slate-900 text-slate-200">
                  {b.parcelId} - {b.name || 'Building'}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher Buttons */}
          <div className="bg-slate-950/80 p-1 rounded-lg border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="View 2D Parcel Map"
            >
              <Map className="w-3.5 h-3.5" />
              <span>2D Map</span>
            </button>

            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === '3d'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="View 3D Stacked Building Scene"
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Building</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="View Split 2D Map + 3D Building side by side"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
