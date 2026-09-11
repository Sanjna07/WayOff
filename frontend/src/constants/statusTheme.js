/**
 * Single source of truth for cadastral floor status presentation.
 * Flat, restrained indicators: a small solid dot and a thin left border.
 * No pills, no glow - this is a record system, not a dashboard.
 */
export const FLOOR_STATUS = {
  registered: {
    label: 'Registered',
    dot: 'bg-navy',
    text: 'text-navy',
    edge: 'border-l-navy'
  },
  disputed: {
    label: 'Under dispute',
    dot: 'bg-maroon',
    text: 'text-maroon',
    edge: 'border-l-maroon'
  },
  vacant: {
    label: 'Unallocated',
    dot: 'bg-ink-faint',
    text: 'text-ink-muted',
    edge: 'border-l-ink-faint'
  }
};

export const getStatusMeta = (status) =>
  FLOOR_STATUS[String(status || '').toLowerCase()] || FLOOR_STATUS.registered;

export default FLOOR_STATUS;
