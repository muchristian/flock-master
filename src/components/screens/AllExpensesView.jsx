import { useMemo, useState } from 'react';
import PresetBar from '../widgets/PresetBar.jsx';
import TableToolbar from '../widgets/TableToolbar.jsx';
import Pagination from '../widgets/Pagination.jsx';
import { EXPENSE_CATEGORIES, ALL_BATCHES, ALL_BATCHES_LABEL } from '../../lib/constants.js';
import { formatMoney, formatDate, inDateRange, presetRange, sortAndPaginate } from '../../lib/helpers.js';

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'category', label: 'Category' },
  { value: 'desc', label: 'Description' },
  { value: 'amount', label: 'Amount' },
];

export default function AllExpensesView({ farmData, onAddExpense, onEdit, onDelete }) {
  const [preset, setPreset] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const batchName = (id) => farmData.batches.find((b) => b.id === id)?.name || '-';

  const applyPreset = (p) => {
    setPreset(p);
    const range = presetRange(p);
    setFrom(range.from);
    setTo(range.to);
    setPage(1);
  };

  const filtered = useMemo(() => {
    return farmData.expenses.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (batchFilter === 'none' && e.batchId) return false;
      if (batchFilter === ALL_BATCHES && e.batchId !== ALL_BATCHES) return false;
      if (batchFilter !== 'all' && batchFilter !== 'none' && batchFilter !== ALL_BATCHES && e.batchId !== batchFilter) return false;
      if (!inDateRange(e.date, from, to)) return false;
      return true;
    });
  }, [farmData.expenses, category, batchFilter, from, to]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [filtered]
  );

  const { pageRows, total, totalPages, page: safePage, start } = sortAndPaginate(filtered, {
    sortKey,
    sortDir,
    page,
    pageSize,
  });

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-content tracking-tight">All Farm Expenses Ledger</h3>
          <p className="text-xs text-content-muted">Record and filter general farm costs, feeds, drinkers, home food, labor, and batch expenses.</p>
        </div>
        <button onClick={onAddExpense} className="btn-primary justify-center">
          <i className="fa-solid fa-plus" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="p-4 bg-surface-sunken rounded-xl border border-line mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-content-muted uppercase tracking-[0.12em]">Date Filters &amp; Presets</span>
          <PresetBar value={preset} onChange={applyPreset} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-content-muted mb-1">Category</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input !p-2 !text-xs">
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-content-muted mb-1">Tag / Batch</label>
            <select value={batchFilter} onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }} className="input !p-2 !text-xs">
              <option value="all">All Tags (General &amp; Batches)</option>
              <option value="none">General Farm Only (No Tag)</option>
              <option value={ALL_BATCHES}>{ALL_BATCHES_LABEL} (Split)</option>
              {farmData.batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-content-muted mb-1">From Date</label>
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset('all'); setPage(1); }} className="input !p-2 !text-xs" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-content-muted mb-1">To Date</label>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset('all'); setPage(1); }} className="input !p-2 !text-xs" />
          </div>
        </div>
      </div>

      <TableToolbar
        pageSize={pageSize}
        onPageSize={(n) => { setPageSize(n); setPage(1); }}
        sortKey={sortKey}
        onSortKey={(k) => setSortKey(k)}
        sortDir={sortDir}
        onToggleDir={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
        sortOptions={SORT_OPTIONS}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-content-muted">
          <thead className="bg-surface-sunken text-content-muted text-[11px] font-semibold uppercase tracking-wider border-b border-line">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Batch Tag</th>
              <th className="py-3 px-4 text-right">Amount (RWF)</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pageRows.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-content-faint">No expenses recorded yet.</td></tr>
            )}
            {pageRows.map((e) => (
              <tr key={e.id} className="transition-colors hover:bg-surface-sunken">
                <td className="py-3 px-4 whitespace-nowrap">{formatDate(e.date)}</td>
                <td className="py-3 px-4">{e.category}</td>
                <td className="py-3 px-4">{e.desc}</td>
                <td className="py-3 px-4">
                  {e.batchId === ALL_BATCHES ? (
                    <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700" title="Split evenly across all batches">
                      <i className="fa-solid fa-layer-group mr-1 text-[10px]" />
                      {ALL_BATCHES_LABEL}
                    </span>
                  ) : e.batchId ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">{batchName(e.batchId)}</span>
                  ) : (
                    <span className="text-xs text-content-faint">General</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-content whitespace-nowrap">{formatMoney(e.amount)}</td>
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <button onClick={() => onEdit('expense', e)} className="text-content-faint hover:text-emerald-600 px-1 transition-colors" title="Edit"><i className="fa-solid fa-pen" /></button>
                  <button onClick={() => onDelete('expense', e.id)} className="text-content-faint hover:text-rose-600 px-1 transition-colors" title="Delete"><i className="fa-solid fa-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 text-xs text-content-muted">
        <span>
          Total filtered expenses: <strong className="text-content">{formatMoney(filteredTotal)}</strong>
        </span>
        <span className="text-content-faint">{filtered.length} {filtered.length === 1 ? 'record' : 'records'}</span>
      </div>

      <Pagination
        total={total}
        start={start}
        pageSize={pageSize}
        page={safePage}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  );
}
