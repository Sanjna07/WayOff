import React from 'react';
import { Map, Box, Columns, Shield } from 'lucide-react';

const VIEW_MODES = [
  { id: 'split', label: 'Split view', Icon: Columns },
  { id: '3d', label: '3D building', Icon: Box },
  { id: 'map', label: '2D map', Icon: Map }
];

/**
 * Header Component
 *
 * Minimal institutional header: department strip, registry title,
 * parcel selector and flat segmented view switcher.
 */
const Header = ({
  viewMode,
  setViewMode,
  buildings = [],
  selectedParcelId,
  onSelectBuilding
}) => {
  const totalParcels = buildings.length;
  const disputedCount = buildings.filter((b) => b.floors?.some((f) => f.status === 'disputed')).length;

  return (
    <header className="bg-sheet border-b border-rule sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Emblem and registry title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-rule-strong bg-navy-tint flex items-center justify-center text-navy">
            <Shield className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-lg leading-tight text-navy">
              WayOff <span className="text-ink-muted font-body text-sm">&middot; Cadastral Land Parcel Registry</span>
            </h1>
            <p className="text-xs text-ink-muted">
              भूकर भूखंड पंजी &middot; Vertical property records (ULPIN) &middot; WGS 84 / EPSG:4326 &middot; {totalParcels} parcels on record &middot; {disputedCount} with title under dispute
            </p>
          </div>
        </div>

        {/* Parcel selector and view switcher */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-muted">Parcel</span>
            <select
              value={selectedParcelId || ''}
              onChange={(e) => onSelectBuilding(e.target.value)}
              className="border border-rule-strong bg-sheet text-ink text-sm px-2 py-1.5 focus:outline-none focus:border-navy cursor-pointer max-w-[280px]"
            >
              {buildings.map((b) => (
                <option key={b.parcelId} value={b.parcelId}>
                  {b.parcelId} &mdash; {b.name || 'Parcel'}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center border border-rule-strong" role="group" aria-label="View mode">
            {VIEW_MODES.map(({ id, label, Icon }, index) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                aria-pressed={viewMode === id}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-rule-strong ${index > 0 ? 'border-l' : ''} ${
                  viewMode === id
                    ? 'bg-navy text-white'
                    : 'bg-sheet text-ink-muted hover:text-navy hover:bg-navy-tint'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
