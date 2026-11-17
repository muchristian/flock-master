import { useMemo, useState } from 'react';
import PresetBar from '../widgets/PresetBar.jsx';
import TableToolbar from '../widgets/TableToolbar.jsx';
import Pagination from '../widgets/Pagination.jsx';
import { ALL_BATCHES, ALL_BATCHES_LABEL } from '../../lib/constants.js';
import { formatMoney, formatDateTime, inDateRange, presetRange, sortAndPaginate } from '../../lib/helpers.js';

const SORT_OPTIONS = [
  { value: 'datetime', label: 'Date' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'saleType', label: 'Sale Type' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'price', label: 'Total' },
];

export default function AllSalesView({ farmData, onAddSale, onEdit, onDelete }) {
  const [preset, setPreset] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [saleType, setSaleType] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [sortKey, setSortKey] = useState('datetime');
  const [sortDir, setSortDir] = useState('desc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const batchName = (id) => farmData.batches.find((b) => b.id === id)?.name || '-';
  const saleTypes = useMemo(
    () => [...new Set(farmData.sales.map((s) => s.saleType || 'Eggs'))],
    [farmData.sales]
  );

  const applyPreset = (p) => {
    setPreset(p);
    const range = presetRange(p);
    setFrom(range.from);
    setTo(range.to);
    setPage(1);
  };

  const filtered = useMemo(() => {
    return farmData.sales.filter((s) => {
      if (saleType !== 'all' && (s.saleType || 'Eggs') !== saleType) return false;
      if (batchFilter === 'none' && s.batchId) return false;
      if (batchFilter === ALL_BATCHES && s.batchId !== ALL_BATCHES) return false;
      if (batchFilter !== 'all' && batchFilter !== 'none' && batchFilter !== ALL_BATCHES && s.batchId !== batchFilter) return false;
      if (!inDateRange(s.datetime, from, to)) return false;
      return true;
    });
  }, [farmData.sales, saleType, batchFilter, from, to]);

  const { pageRows, total, totalPages, page: safePage, start } = sortAndPaginate(filtered, {
    sortKey,
    sortDir,
    page,
    pageSize,
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-content tracking-tight">All Farm Sales Ledger</h3>
          <p className="text-xs text-content-muted">Every sale across the farm, batch-tagged or general.</p>
        </div>
        <button onClick={onAddSale} className="btn-primary justify-center">
          <i className="fa-solid fa-cart-plus" />
          <span>Record New Sale</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="p-4 bg-surface-sunken rounded-xl border border-line mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-content-muted uppercase tracking-[0.12em]">Date Filters &amp; Presets</span>
          <PresetBar value={preset} onChange={applyPreset} activeColor="bg-accent-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-content-muted mb-1">Sale Type</label>
            <select value={saleType} onChange={(e) => { setSaleType(e.target.value); setPage(1); }} className="input !p-2 !text-xs">
              <option value="all">All Sale Types</option>
              {saleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-content-muted mb-1">Batch Tag</label>
            <select value={batchFilter} onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }} className="input !p-2 !text-xs">
              <option value="all">All (General &amp; Batches)</option>
              <option value="none">General Only (No Batch)</option>
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
        onSortKey={setSortKey}
        sortDir={sortDir}
        onToggleDir={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
        sortOptions={SORT_OPTIONS}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-content-muted">
          <thead className="bg-surface-sunken text-content-muted text-[11px] font-semibold uppercase tracking-wider border-b border-line">
            <tr>
              <th className="py-3 px-4">Date &amp; Time</th>
              <th className="py-3 px-4">Customer / Buyer</th>
              <th className="py-3 px-4">Sale Type</th>
              <th className="py-3 px-4">Tags</th>
              <th className="py-3 px-4">Batch</th>
              <th className="py-3 px-4 text-center">Qty</th>
              <th className="py-3 px-4 text-right">Total (RWF)</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pageRows.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-content-faint">No sales recorded yet.</td></tr>
            )}
            {pageRows.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-surface-sunken">
                <td className="py-3 px-4 whitespace-nowrap">{formatDateTime(s.datetime)}</td>
                <td className="py-3 px-4">{s.buyer}</td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700">{s.saleType || 'Eggs'}</span>
                </td>
                <td className="py-3 px-4">
                  {(s.tags || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {s.tags.map((t) => (
                        <span key={t} className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-content-muted border border-line">{t}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-content-faint">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {s.batchId === ALL_BATCHES ? (
                    <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700" title="Split evenly across all batches">
                      <i className="fa-solid fa-layer-group mr-1 text-[10px]" />
                      {ALL_BATCHES_LABEL}
                    </span>
                  ) : s.batchId ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">{batchName(s.batchId)}</span>
                  ) : (
                    <span className="text-xs text-content-faint">General</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">{s.quantity}</td>
                <td className="py-3 px-4 text-right font-semibold text-content whitespace-nowrap">{formatMoney(s.price)}</td>
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <button onClick={() => onEdit('sale', s)} className="text-content-faint hover:text-emerald-600 px-1 transition-colors" title="Edit"><i className="fa-solid fa-pen" /></button>
                  <button onClick={() => onDelete('sale', s.id)} className="text-content-faint hover:text-rose-600 px-1 transition-colors" title="Delete"><i className="fa-solid fa-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-content-muted">
        <span>Filtered revenue: <strong className="text-content">{formatMoney(totalRevenue)}</strong></span>
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
