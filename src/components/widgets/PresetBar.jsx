// Preset date-filter buttons (All Time / Today / This Week / This Month).
const PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export default function PresetBar({ value, onChange, activeColor = 'bg-emerald-500', size = 'md' }) {
  const padding = size === 'sm' ? 'px-2 py-0.5 rounded' : 'px-2.5 py-1 rounded-lg';
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESETS.map((p) => {
        const active = value === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            className={`${padding} text-xs font-medium transition-colors ${
              active
                ? `${activeColor} text-white shadow-sm`
                : 'bg-surface border border-line text-content-muted hover:border-emerald-300 hover:text-emerald-600'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

