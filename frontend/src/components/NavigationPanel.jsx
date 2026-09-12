import React from 'react';

const NavigationPanel = ({ buildings, navStart, navEnd, setNavStart, setNavEnd }) => {
  return (
    <div className="absolute top-4 left-4 w-[280px] glass rounded-xl border border-rule p-4 shadow-lg pointer-events-auto z-10">
      <h2 className="text-sm font-semibold text-ink mb-3">Navigation</h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1 uppercase tracking-wider">From</label>
          <select 
            value={navStart} 
            onChange={(e) => setNavStart(e.target.value)}
            className="w-full bg-paper/50 border border-rule rounded-md px-2 py-1.5 text-xs text-ink focus:outline-none focus:border-navy"
          >
            <option value="">Select starting point...</option>
            {buildings.map(b => (
              <option key={b.parcelId} value={b.parcelId}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1 uppercase tracking-wider">To</label>
          <select 
            value={navEnd} 
            onChange={(e) => setNavEnd(e.target.value)}
            className="w-full bg-paper/50 border border-rule rounded-md px-2 py-1.5 text-xs text-ink focus:outline-none focus:border-navy"
          >
            <option value="">Select destination...</option>
            {buildings.map(b => (
              <option key={b.parcelId} value={b.parcelId}>{b.name}</option>
            ))}
          </select>
        </div>
        
        {navStart && navEnd && navStart === navEnd && (
            <div className="text-xs text-red-500 mt-2">Start and End cannot be the same.</div>
        )}
      </div>
    </div>
  );
};

export default NavigationPanel;
