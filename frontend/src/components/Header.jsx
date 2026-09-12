import React from 'react';
import { Box, ChevronDown } from 'lucide-react';

/**
 * Header — sleek glass navigation bar.
 * Floating over the 3D city scene with modern branding and parcel selector.
 */
const Header = ({ buildings = [], selectedParcelId, onSelectBuilding }) => {
  return (
    <header className="glass-strong sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy to-navy-deep flex items-center justify-center shadow-lg shadow-navy/20">
            <Box className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold text-ink tracking-tight">
              WayOff
            </h1>
            <p className="text-[11px] text-ink-faint font-medium">
              3D Land Registry
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          {/* Parcel quick-select */}
          <div className="relative">
            <select
              value={selectedParcelId || ''}
              onChange={(e) => onSelectBuilding(e.target.value)}
              className="appearance-none bg-sheet/60 text-ink text-xs font-medium pl-3 pr-8 py-2 rounded-lg border border-rule-strong hover:border-navy/40 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/30 cursor-pointer transition-all duration-200 min-w-[220px]"
            >
              <option value="" disabled>Select parcel…</option>
              {buildings.map((b) => (
                <option key={b.parcelId} value={b.parcelId}>
                  {b.parcelId} — {b.name?.split('(')[0]?.trim() || 'Parcel'}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint pointer-events-none" />
          </div>

          {/* Status pills */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-navy" />
              Registered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-maroon" />
              Disputed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ink-faint" />
              Vacant
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
