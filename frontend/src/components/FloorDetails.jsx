import React from 'react';
import { Layers, ShieldCheck, ShieldAlert, Building2, User, Key, Ruler, ArrowDown } from 'lucide-react';

/**
 * FloorDetails Component
 * 
 * Sidebar / Inspector panel displaying detailed information about a selected floor
 * or building parcel based on the data contract.
 */
const FloorDetails = ({ selectedFloor, selectedBuilding, onFloorSelect }) => {
  if (!selectedBuilding) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-6 border border-slate-800 text-slate-400 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Building2 className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-300 mb-1">No Parcel Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Click a parcel polygon on the map or select a building to inspect its 3D floor geometry.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Disputed
          </span>
        );
      case 'vacant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Building2 className="w-3.5 h-3.5 text-slate-400" /> Vacant
          </span>
        );
      case 'registered':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Registered
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-5 border border-slate-800 text-slate-100 flex flex-col gap-5 shadow-xl">
      {/* Parcel Overview Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            Parcel Overview
          </span>
          <span className="text-xs font-mono text-slate-400">{selectedBuilding.parcelId}</span>
        </div>
        <h2 className="text-lg font-bold text-slate-100">{selectedBuilding.name || selectedBuilding.parcelId}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{selectedBuilding.address}</p>
      </div>

      {/* Selected Floor Inspector Details */}
      {selectedFloor ? (
        <div className="bg-slate-950/80 rounded-lg p-4 border border-amber-500/30 shadow-inner space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              {selectedFloor.type === 'underground' ? (
                <ArrowDown className="w-4 h-4 text-purple-400" />
              ) : (
                <Layers className="w-4 h-4 text-amber-400" />
              )}
              <h3 className="font-bold text-sm text-slate-200">
                {selectedFloor.type === 'underground'
                  ? `Underground Level (${selectedFloor.levels || 1} Sub-Floor)`
                  : `Floor #${selectedFloor.floorNumber}`}
              </h3>
            </div>
            {selectedFloor.type !== 'underground' && getStatusBadge(selectedFloor.status)}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1 mb-1">
                <Key className="w-3 h-3 text-slate-400" /> ULPIN Code
              </div>
              <div className="font-mono text-slate-200 font-semibold">{selectedFloor.ulpin}</div>
            </div>

            {selectedFloor.type === 'underground' ? (
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1 mb-1">
                  <Building2 className="w-3 h-3 text-slate-400" /> Facility Type
                </div>
                <div className="text-slate-200 font-semibold">{selectedFloor.undergroundType}</div>
              </div>
            ) : (
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-slate-400" /> Registered Owner
                </div>
                <div className="text-slate-200 font-semibold">{selectedFloor.owner}</div>
              </div>
            )}

            {selectedFloor.height && (
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800 col-span-2 flex items-center justify-between">
                <div className="text-slate-400 text-xs flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-blue-400" /> Ceiling Height
                </div>
                <div className="font-bold text-slate-200">{selectedFloor.height} Meters</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/40 rounded-lg p-3.5 border border-slate-800/60 text-xs text-slate-400 text-center">
          💡 Click any floor mesh in 3D view to inspect individual floor ULPIN and ownership details.
        </div>
      )}

      {/* Stacked Floor List Navigation */}
      <div>
        <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
          <span>Building Stack ({selectedBuilding.floors?.length || 0} Floors)</span>
        </h4>
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
          {/* Top-to-Bottom floor ordering in list view for intuitive stack representation */}
          {Array.isArray(selectedBuilding.floors) &&
            [...selectedBuilding.floors].reverse().map((floor) => {
              const isSelected = selectedFloor && selectedFloor.ulpin === floor.ulpin;
              return (
                <button
                  key={floor.ulpin}
                  onClick={() =>
                    onFloorSelect({
                      type: 'floor',
                      ...floor,
                      parcelId: selectedBuilding.parcelId
                    })
                  }
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all text-left ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 font-semibold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-300">
                      F{floor.floorNumber}
                    </span>
                    <div>
                      <div className="font-medium">{floor.owner}</div>
                      <div className="text-[10px] font-mono text-slate-400">{floor.ulpin}</div>
                    </div>
                  </div>
                  {getStatusBadge(floor.status)}
                </button>
              );
            })}

          {/* Underground Level Option */}
          {selectedBuilding.underground && (
            <button
              onClick={() =>
                onFloorSelect({
                  type: 'underground',
                  ulpin: selectedBuilding.underground.ulpin,
                  levels: selectedBuilding.underground.levels,
                  undergroundType: selectedBuilding.underground.type,
                  parcelId: selectedBuilding.parcelId
                })
              }
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all text-left ${
                selectedFloor && selectedFloor.ulpin === selectedBuilding.underground.ulpin
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 font-semibold'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-bold text-[10px] text-purple-400">
                  UG
                </span>
                <div>
                  <div className="font-medium text-slate-300">Underground Level</div>
                  <div className="text-[10px] font-mono text-slate-400">{selectedBuilding.underground.ulpin}</div>
                </div>
              </div>
              <span className="text-[10px] bg-slate-800 text-purple-300 px-2 py-0.5 rounded border border-slate-700">
                {selectedBuilding.underground.type}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloorDetails;
