import React from 'react';
import { Layers, ShieldCheck, ShieldAlert, Building2, User, Key, Ruler, ArrowDown, FileText } from 'lucide-react';

/**
 * FloorDetails Component (Government Inspector Card Grade)
 * 
 * Cadastral Land Parcel & Vertical Stack Inspector
 */
const FloorDetails = ({ selectedFloor, selectedBuilding, onFloorSelect }) => {
  if (!selectedBuilding) {
    return (
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-800 text-slate-400 text-center flex flex-col items-center justify-center min-h-[350px]">
        <Building2 className="w-10 h-10 text-slate-600 mb-2" />
        <h3 className="text-sm font-bold text-slate-300">No Parcel Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select a parcel from the map or dropdown.</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800 uppercase tracking-wider">
            <ShieldAlert className="w-3 h-3 text-red-400" /> Disputed Title
          </span>
        );
      case 'vacant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider">
            <Building2 className="w-3 h-3 text-slate-400" /> Unallocated
          </span>
        );
      case 'registered':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-950 text-blue-400 border border-blue-800 uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3 text-blue-400" /> Registered
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 text-slate-100 flex flex-col gap-4 shadow-lg">
      {/* Official Cadastral Header */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
            Cadastral Record
          </span>
          <span className="text-xs font-mono font-bold text-slate-400">{selectedBuilding.parcelId}</span>
        </div>
        <h2 className="text-base font-bold text-slate-100">{selectedBuilding.name || selectedBuilding.parcelId}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{selectedBuilding.address}</p>
      </div>

      {/* Selected Floor Inspector Details */}
      {selectedFloor ? (
        <div className="bg-slate-950 rounded p-3.5 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              {selectedFloor.type === 'underground' ? (
                <ArrowDown className="w-4 h-4 text-purple-400" />
              ) : (
                <Layers className="w-4 h-4 text-amber-400" />
              )}
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                {selectedFloor.type === 'underground'
                  ? `Subterranean Level (${selectedFloor.levels || 1} Level)`
                  : `Floor Level #${selectedFloor.floorNumber}`}
              </h3>
            </div>
            {selectedFloor.type !== 'underground' && getStatusBadge(selectedFloor.status)}
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                <Key className="w-3 h-3 text-slate-400" /> ULPIN Reference
              </div>
              <div className="font-mono text-slate-100 font-bold">{selectedFloor.ulpin}</div>
            </div>

            {selectedFloor.type === 'underground' ? (
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                  <Building2 className="w-3 h-3 text-slate-400" /> Sub-Structure Type
                </div>
                <div className="text-slate-100 font-semibold">{selectedFloor.undergroundType}</div>
              </div>
            ) : (
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-slate-400" /> Registered Owner
                </div>
                <div className="text-slate-100 font-semibold">{selectedFloor.owner}</div>
              </div>
            )}

            {selectedFloor.height && (
              <div className="bg-slate-900 p-2 rounded border border-slate-800 col-span-2 flex items-center justify-between">
                <div className="text-slate-400 text-xs flex items-center gap-1 font-medium">
                  <Ruler className="w-3.5 h-3.5 text-blue-400" /> Floor Ceiling Height
                </div>
                <div className="font-mono font-bold text-slate-200">{selectedFloor.height} Meters</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/60 rounded p-3 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>Click any 3D floor box or stack item below to inspect title ownership and ULPIN registry data.</span>
        </div>
      )}

      {/* Vertical Floor Stack List */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
          <span>Vertical Cadastral Stack ({selectedBuilding.floors?.length || 0} Levels)</span>
        </div>
        <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
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
                  className={`w-full flex items-center justify-between p-2.5 rounded border text-xs transition-all text-left ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-[10px] text-slate-300">
                      L{floor.floorNumber}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">{floor.owner}</div>
                      <div className="text-[10px] font-mono text-slate-400">{floor.ulpin}</div>
                    </div>
                  </div>
                  {getStatusBadge(floor.status)}
                </button>
              );
            })}

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
              className={`w-full flex items-center justify-between p-2.5 rounded border text-xs transition-all text-left ${
                selectedFloor && selectedFloor.ulpin === selectedBuilding.underground.ulpin
                  ? 'bg-purple-500/20 border-purple-500 text-purple-200 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-[10px] text-purple-400">
                  UG
                </span>
                <div>
                  <div className="font-semibold text-slate-300">Subterranean Level</div>
                  <div className="text-[10px] font-mono text-slate-400">{selectedBuilding.underground.ulpin}</div>
                </div>
              </div>
              <span className="text-[10px] bg-slate-900 text-purple-300 px-2 py-0.5 rounded border border-slate-800">
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
