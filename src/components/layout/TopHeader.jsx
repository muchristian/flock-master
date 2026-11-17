import ThemeToggle from '../widgets/ThemeToggle.jsx';

// Sticky content header with breadcrumb, page title and quick actions.
// Solid background (no backdrop blur) so text never overlaps content.
export default function TopHeader({ breadcrumb, title, onLogExpense, onRecordSale, onLoadDemo }) {
  return (
    <header className="bg-surface border-b border-line px-4 md:px-6 py-4 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-10">
      <div className="min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600">
          {breadcrumb}
        </span>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-content truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onRecordSale}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-content-muted transition hover:border-accent-500 hover:text-content"
        >
          <i className="fa-solid fa-cart-plus" />
          <span>Record Sale</span>
        </button>
        <button
          onClick={onLogExpense}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
        >
          <i className="fa-solid fa-plus" />
          <span>Log Expense</span>
        </button>
        <button
          onClick={onLoadDemo}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-content-muted transition hover:border-emerald-500 hover:text-content"
        >
          <i className="fa-solid fa-wand-magic-sparkles" />
          <span className="hidden sm:inline">Load Demo Data</span>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
