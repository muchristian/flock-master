// A single KPI card used in the dashboard metrics grid.
export default function StatCard({ label, value, valueClass = 'text-content', hint, hintClass = 'text-content-faint', icon, iconWrap = 'bg-surface-sunken border-line text-content-muted' }) {
  return (
    <div className="card p-5 flex items-center justify-between transition-colors hover:border-emerald-500/50">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-content-faint uppercase tracking-[0.12em]">{label}</p>
        <h3 className={`text-2xl font-extrabold tracking-tight mt-1 truncate ${valueClass}`}>{value}</h3>
        {hint && <p className={`text-xs mt-1 ${hintClass}`}>{hint}</p>}
      </div>
      {icon && (
        <div className={`shrink-0 h-12 w-12 rounded-xl border flex items-center justify-center text-xl ${iconWrap}`}>
          <i className={icon} />
        </div>
      )}
    </div>
  );
}
