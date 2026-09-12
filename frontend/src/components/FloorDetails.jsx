import React from 'react';
import { Building2, Printer, ArrowLeft } from 'lucide-react';
import { getStatusMeta } from '../constants/statusTheme';

/**
 * Pill-style status badge with subtle glow.
 */
const StatusBadge = ({ status }) => {
  const meta = getStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${meta.text}`}
      style={{ background: status === 'disputed' ? 'rgba(248,113,113,0.1)' : status === 'vacant' ? 'rgba(100,116,139,0.1)' : 'rgba(56,189,248,0.1)' }}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

/**
 * Key-value row for the record panel.
 */
const Field = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 py-2 border-b border-rule last:border-b-0">
    <dt className="text-[11px] text-ink-faint uppercase tracking-wider">{label}</dt>
    <dd className="text-xs text-ink text-right tabular-nums font-medium">{value}</dd>
  </div>
);

/**
 * FloorDetails — floating glass panel showing cadastral record data.
 * Overlays the 3D scene on the right side with modern card design.
 */
const FloorDetails = ({ selectedFloor, selectedBuilding, onFloorSelect, onBackToCity }) => {
  if (!selectedBuilding) {
    return (
      <div className="glass-strong rounded-2xl p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-navy-tint flex items-center justify-center mb-4">
          <Building2 className="w-7 h-7 text-navy" />
        </div>
        <h3 className="text-base font-semibold text-ink">Explore the City</h3>
        <p className="text-xs text-ink-muted mt-2 leading-relaxed max-w-[240px] mx-auto">
          Click on any highlighted building in the 3D scene to explore its floors, ownership, and registry data.
        </p>
        <div className="mt-5 flex justify-center gap-4 text-[11px] text-ink-faint">
          <span>🖱️ Click to enter</span>
          <span>⎋ Esc to exit</span>
        </div>
      </div>
    );
  }

  const isUnderground = selectedFloor?.type === 'underground';
  const undergroundSelected =
    selectedFloor && selectedBuilding.underground && selectedFloor.ulpin === selectedBuilding.underground.ulpin;

  return (
    <section className="glass-strong rounded-2xl overflow-hidden print-area">
      {/* Record header */}
      <div className="px-5 pt-5 pb-4 border-b border-rule">
        <div className="flex items-center justify-between gap-2 mb-2">
          {onBackToCity && (
            <button
              onClick={onBackToCity}
              className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-navy transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              City view
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] text-navy font-mono font-medium">{selectedBuilding.parcelId}</span>
            {selectedBuilding.isPublic ? (
              <button
                onClick={() => window.print()}
                className="no-print flex items-center gap-1 text-[11px] text-ink-faint hover:text-ink border border-rule rounded-lg px-2 py-1 hover:border-rule-strong transition-all"
                title="Print record"
              >
                <Printer className="w-3 h-3" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                RESTRICTED
              </span>
            )}
          </div>
        </div>
        <h2 className="text-base font-semibold text-ink leading-snug">
          {selectedBuilding.name?.split('(')[0]?.trim() || selectedBuilding.parcelId}
        </h2>
        {selectedBuilding.address && (
          <p className="text-[11px] text-ink-muted mt-1">{selectedBuilding.address}</p>
        )}

        {/* Registry metadata */}
        {(selectedBuilding.district || selectedBuilding.tehsil || selectedBuilding.surveyDate) && (
          <dl className="mt-3 border-t border-rule pt-1">
            {selectedBuilding.district && <Field label="District" value={selectedBuilding.district} />}
            {selectedBuilding.tehsil && <Field label="Tehsil" value={selectedBuilding.tehsil} />}
            {selectedBuilding.surveyDate && <Field label="Last Survey" value={selectedBuilding.surveyDate} />}
            {selectedBuilding.registrarOffice && <Field label="Registrar" value={selectedBuilding.registrarOffice} />}
          </dl>
        )}
      </div>

      {/* Selected floor detail */}
      <div className="px-5 py-4 border-b border-rule">
        {selectedFloor ? (
          <>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-ink">
                {isUnderground
                  ? `Underground (${selectedFloor.levels || 1} ${(selectedFloor.levels || 1) > 1 ? 'levels' : 'level'})`
                  : (selectedBuilding.type === 'park' ? 'Grounds' : `Floor ${selectedFloor.floorNumber}`)}
              </h3>
              {!isUnderground && <StatusBadge status={selectedFloor.status} />}
            </div>
            <dl className="mb-3">
              <Field label="ULPIN" value={selectedFloor.ulpin} />
              {isUnderground
                ? <Field label="Type" value={selectedFloor.undergroundType} />
                : <Field label="Owner" value={selectedFloor.owner} />
              }
              {selectedFloor.height && <Field label="Height" value={`${selectedFloor.height} m`} />}
            </dl>
            {selectedBuilding.isPublic && (
               <button
                 onClick={() => window.dispatchEvent(new CustomEvent('enter-indoor', { detail: { building: selectedBuilding, floor: selectedFloor } }))}
                 className="w-full bg-navy hover:bg-navy-dark text-paper font-medium text-sm py-2 rounded-lg transition-colors shadow-md"
               >
                 Enter 3D View
               </button>
            )}
          </>
        ) : (
          <p className="text-xs text-ink-muted py-1">
            {selectedBuilding.isPublic 
              ? "Click a floor in the 3D view or from the list below." 
              : "Select a unit from the list below to view its public registry data."}
          </p>
        )}
      </div>

      {/* Schedule of floors */}
      <div className="px-5 py-4">
        <h3 className="text-[11px] text-ink-faint uppercase tracking-wider mb-3">
          Floors · {selectedBuilding.floors?.length || 0} levels
        </h3>
        <div className="print-expand max-h-[280px] overflow-y-auto space-y-1.5">
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
                      parcelId: selectedBuilding.parcelId,
                    })
                  }
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs transition-all duration-200 group ${
                    isSelected
                      ? 'bg-gold-tint border border-gold/20 shadow-sm shadow-gold/5'
                      : 'bg-sheet/40 border border-transparent hover:bg-sheet/70 hover:border-rule'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-ink font-medium truncate group-hover:text-navy transition-colors">
                      F{floor.floorNumber} · {floor.owner}
                    </div>
                    <div className="text-[10px] text-ink-faint tabular-nums font-mono mt-0.5">{floor.ulpin}</div>
                  </div>
                  <StatusBadge status={floor.status} />
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
                  parcelId: selectedBuilding.parcelId,
                })
              }
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs transition-all duration-200 ${
                undergroundSelected
                  ? 'bg-gold-tint border border-gold/20'
                  : 'bg-sheet/40 border border-transparent hover:bg-sheet/70 hover:border-rule'
              }`}
            >
              <div className="min-w-0">
                <div className="text-ink font-medium">Underground</div>
                <div className="text-[10px] text-ink-faint tabular-nums font-mono mt-0.5">
                  {selectedBuilding.underground.ulpin}
                </div>
              </div>
              <span className="text-[10px] text-ink-faint text-right max-w-[40%] truncate">
                {selectedBuilding.underground.type}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default FloorDetails;
