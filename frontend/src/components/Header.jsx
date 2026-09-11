import React from 'react';
import { Map, Box, Columns, Shield, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Header Component (Government Cadastral Registry Grade)
 * 
 * Official Header with View Mode Switchers and Parcel Selector
 */
const Header = ({
  viewMode,
  setViewMode,
  buildings = [],
  selectedParcelId,
  onSelectBuilding
}) => {
  const activeBuilding = buildings.find((b) => b.parcelId === selectedParcelId);
  const totalParcels = buildings.length;
  const disputedCount = buildings.filter((b) => b.floors?.some((f) => f.status === 'disputed')).length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Government Emblem & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center text-blue-400 shadow-inner">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                NATIONAL CADASTRAL 3D & 2D LAND PARCEL REGISTRY
              </h1>
              <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                ULPIN SYSTEM v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Department of Land Resources & Urban Development | WGS84 Spatial Framework
            </p>
          </div>
        </div>

        {/* Status Counter Metrics & Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Parcels:</span>
              <span className="text-slate-200 font-bold">{totalParcels}</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-400">Disputes:</span>
              <span className="text-red-400 font-bold">{disputedCount}</span>
            </div>
          </div>

          {/* Active Parcel Selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Parcel ID:</span>
            <select
              value={selectedParcelId || ''}
              onChange={(e) => onSelectBuilding(e.target.value)}
              className="bg-transparent text-blue-400 font-mono font-bold focus:outline-none cursor-pointer"
            >
              {buildings.map((b) => (
                <option key={b.parcelId} value={b.parcelId} className="bg-slate-900 text-slate-200 font-mono">
                  {b.parcelId} — {b.name || 'Parcel'}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="bg-slate-950 p-1 rounded border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>

            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === '3d'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Building</span>
            </button>

            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>2D Cadastral Map</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
