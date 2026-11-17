import StatCard from '../widgets/StatCard.jsx';
import ExpenseChart from '../charts/ExpenseChart.jsx';
import FlockChart from '../charts/FlockChart.jsx';
import { dashboardTotals, recentActivity } from '../../lib/metrics.js';
import { formatMoney, formatNumber, formatDate } from '../../lib/helpers.js';

const ACTIVITY_ICON = {
  sale: { icon: 'fa-cart-shopping', cls: 'bg-accent-100 text-accent-700' },
  expense: { icon: 'fa-receipt', cls: 'bg-rose-100 text-rose-700' },
  log: { icon: 'fa-calendar-check', cls: 'bg-emerald-100 text-emerald-800' },
};

export default function DashboardView({ farmData, storage }) {
  const totals = dashboardTotals(farmData);
  const activity = recentActivity(farmData, 8);
  const profitPositive = totals.netProfit >= 0;

  const canSaveToDisk = storage?.supportsDirectoryPicker;
  const savingToDisk = !!storage?.isDiskBackend;

  return (
    <div className="space-y-6">
      {/* Where-is-my-data banner */}
      {storage && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            savingToDisk
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <i className={`fa-solid ${savingToDisk ? 'fa-circle-check' : 'fa-triangle-exclamation'} mt-0.5`} />
            <div className="min-w-0">
              <p className="font-semibold">
                {savingToDisk ? 'Your data is saved on this computer' : 'Your data is saved in browser storage'}
              </p>
              <p className="text-xs break-all opacity-90">
                Location: <span className="font-mono">{storage.getLocation ? storage.getLocation() : storage.backendLabel}</span>
              </p>
              {!savingToDisk && (
                <p className="text-xs opacity-80 mt-0.5">
                  Click “Save to Documents” so your farm-data folder appears in Documents.
                </p>
              )}
            </div>
          </div>
          {canSaveToDisk && !savingToDisk && (
            <button
              onClick={storage.onSaveToDocuments}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
            >
              <i className="fa-solid fa-folder-open mr-1.5" />
              Save to Documents
            </button>
          )}
        </div>
      )}

      {/* Global metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Live Flock"
          value={formatNumber(totals.totalFlock)}
          hint={`${totals.activeBatches} Active Batches`}
          icon="fa-solid fa-egg"
          iconWrap="bg-amber-100 border-amber-200 text-amber-800"
        />
        <StatCard
          label="Total Farm Revenue"
          value={formatMoney(totals.totalRevenue)}
          valueClass="text-emerald-600"
          hint="From All Batches"
          hintClass="text-emerald-600 font-medium"
          icon="fa-solid fa-hand-holding-dollar"
          iconWrap="bg-emerald-100 border-emerald-200 text-emerald-800"
        />
        <StatCard
          label="Total Farm Expenses"
          value={formatMoney(totals.totalExpenses)}
          valueClass="text-rose-600"
          hint="Feeds, Tools & Ops"
          hintClass="text-rose-600 font-medium"
          icon="fa-solid fa-receipt"
          iconWrap="bg-rose-100 border-rose-200 text-rose-800"
        />
        <StatCard
          label="Net Farm Profit"
          value={formatMoney(totals.netProfit)}
          valueClass={profitPositive ? 'text-content' : 'text-rose-600'}
          hint="Revenue - Expenses"
          icon="fa-solid fa-scale-balanced"
          iconWrap="bg-accent-100 border-accent-200 text-accent-700"
        />
      </div>

      {/* Charts breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-content text-base tracking-tight">Category Expense Allocation</h3>
            <span className="text-xs text-content-faint">RWF</span>
          </div>
          <div className="h-64 relative">
            <ExpenseChart expenses={farmData.expenses} />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-content text-base tracking-tight">Live Birds per Batch</h3>
            <span className="text-xs text-content-faint">Headcount</span>
          </div>
          <div className="h-64 relative">
            <FlockChart batches={farmData.batches} sales={farmData.sales} expenses={farmData.expenses} />
          </div>
        </div>
      </div>

      {/* Recent activity feed */}
      <div className="card p-5">
        <h3 className="font-bold text-content text-base mb-4 flex items-center space-x-2 tracking-tight">
          <i className="fa-solid fa-clock-rotate-left text-emerald-600" />
          <span>Recent Farm Stream</span>
        </h3>
        <div className="divide-y divide-line">
          {activity.length === 0 && (
            <div className="text-center py-6 text-content-faint text-sm">No recent activity found.</div>
          )}
          {activity.map((item) => {
            const meta = ACTIVITY_ICON[item.type] || ACTIVITY_ICON.log;
            return (
              <div key={item.id} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${meta.cls}`}>
                    <i className={`fa-solid ${meta.icon} text-xs`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-content truncate">{item.text}</p>
                    <p className="text-[11px] text-content-faint">{formatDate(item.when)}</p>
                  </div>
                </div>
                {item.amount !== 0 && (
                  <span className={`text-sm font-semibold shrink-0 ${item.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.amount > 0 ? '+' : ''}
                    {formatMoney(item.amount)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
