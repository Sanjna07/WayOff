import React from 'react';
import { Building2 } from 'lucide-react';
import { getStatusMeta } from '../constants/statusTheme';

/**
 * Flat status indicator: small solid dot and plain text. No pills, no glow.
 */
const StatusIndicator = ({ status }) => {
  const meta = getStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap ${meta.text}`}>
      <span className={`w-2 h-2 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
};

/**
 * Definition-list row for the record: quiet label left, value right.
 */
const Field = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-rule last:border-b-0">
    <dt className="text-xs text-ink-muted">{label}</dt>
    <dd className="text-sm text-ink text-right tabular-nums">{value}</dd>
  </div>
);

/**
 * FloorDetails Component
 *
 * Cadastral record of title: parcel header, selected level details and the
 * schedule of floors. This panel is the data of record and carries the most
 * visual weight in the layout.
 */
const FloorDetails = ({ selectedFloor, selectedBuilding, onFloorSelect }) => {
  if (!selectedBuilding) {
    return (
      <div className="bg-sheet border border-rule border-t-2 border-t-navy p-6 text-center min-h-[300px] flex flex-col items-center justify-center">
        <Building2 className="w-8 h-8 text-ink-faint mb-2" aria-hidden="true" />
        <h3 className="font-heading text-sm text-navy">No parcel selected</h3>
        <p className="text-xs text-ink-muted mt-1">Select a parcel from the map or the parcel list.</p>
      </div>
    );
  }

  const isUnderground = selectedFloor?.type === 'underground';
  const undergroundSelected =
    selectedFloor && selectedBuilding.underground && selectedFloor.ulpin === selectedBuilding.underground.ulpin;

  return (
    <section className="bg-sheet border border-rule border-t-2 border-t-navy" aria-label="Cadastral record">
      {/* Record header */}
      <div className="px-4 pt-4 pb-3 border-b border-rule">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-ink-muted">Record of title</span>
          <span className="text-xs text-ink tabular-nums">{selectedBuilding.parcelId}</span>
        </div>
        <h2 className="font-heading text-lg text-navy mt-0.5">
          {selectedBuilding.name || selectedBuilding.parcelId}
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">{selectedBuilding.address}</p>
      </div>

      {/* Selected level details */}
      <div className="px-4 py-3 border-b border-rule">
        {selectedFloor ? (
          <>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-ink">
                {isUnderground
                  ? `Subterranean level (${selectedFloor.levels || 1} ${(selectedFloor.levels || 1) > 1 ? 'levels' : 'level'})`
                  : `Floor ${selectedFloor.floorNumber}`}
              </h3>
              {!isUnderground && <StatusIndicator status={selectedFloor.status} />}
            </div>
            <dl>
              <Field label="ULPIN reference" value={selectedFloor.ulpin} />
              {isUnderground ? (
                <Field label="Sub-structure type" value={selectedFloor.undergroundType} />
              ) : (
                <Field label="Registered owner" value={selectedFloor.owner} />
              )}
              {selectedFloor.height && <Field label="Ceiling height" value={`${selectedFloor.height} m`} />}
            </dl>
          </>
        ) : (
          <p className="text-xs text-ink-muted">
            Select a floor in the 3D view or from the schedule below to inspect ownership and ULPIN registry data.
          </p>
        )}
      </div>

      {/* Schedule of floors */}
      <div className="px-4 py-3">
        <h3 className="text-xs text-ink-muted mb-2">
          Schedule of floors &middot; {selectedBuilding.floors?.length || 0} levels
        </h3>
        <div className="max-h-[300px] overflow-y-auto">
          <ul className="divide-y divide-rule border-t border-b border-rule">
            {Array.isArray(selectedBuilding.floors) &&
              [...selectedBuilding.floors].reverse().map((floor) => {
                const isSelected = selectedFloor && selectedFloor.ulpin === floor.ulpin;
                const meta = getStatusMeta(floor.status);
                return (
                  <li key={floor.ulpin}>
                    <button
                      onClick={() =>
                        onFloorSelect({
                          type: 'floor',
                          ...floor,
                          parcelId: selectedBuilding.parcelId
                        })
                      }
                      aria-pressed={isSelected}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left text-xs border-l-2 ${meta.edge} ${
                        isSelected ? 'bg-gold-tint' : 'bg-sheet hover:bg-paper'
                      } focus-visible:outline focus-visible:outline-navy`}
                    >
                      <div className="min-w-0">
                        <div className="text-ink font-medium truncate">
                          Floor {floor.floorNumber} &middot; {floor.owner}
                        </div>
                        <div className="text-[11px] text-ink-muted tabular-nums">{floor.ulpin}</div>
                      </div>
                      <StatusIndicator status={floor.status} />
                    </button>
                  </li>
                );
              })}

            {selectedBuilding.underground && (
              <li>
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
                  aria-pressed={Boolean(undergroundSelected)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left text-xs border-l-2 border-l-ink-faint ${
                    undergroundSelected ? 'bg-gold-tint' : 'bg-sheet hover:bg-paper'
                  } focus-visible:outline focus-visible:outline-navy`}
                >
                  <div className="min-w-0">
                    <div className="text-ink font-medium">Subterranean level</div>
                    <div className="text-[11px] text-ink-muted tabular-nums">
                      {selectedBuilding.underground.ulpin}
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-muted text-right max-w-[45%]">
                    {selectedBuilding.underground.type}
                  </span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FloorDetails;
