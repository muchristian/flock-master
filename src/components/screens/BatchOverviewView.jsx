import { useMemo, useState } from 'react';
import PresetBar from '../widgets/PresetBar.jsx';
import TableToolbar from '../widgets/TableToolbar.jsx';
import Pagination from '../widgets/Pagination.jsx';
import { batchMetrics } from '../../lib/metrics.js';
import { formatDate, formatMoney, inDateRange, presetRange, sortAndPaginate } from '../../lib/helpers.js';

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'mortality', label: 'Mortality' },
  { value: 'notes', label: 'Notes' },
];

export default function BatchOverviewView({ batch, farmData, onDeleteBatch, onAddLog, onEditLog, onDeleteLog }) {
  const metrics = batchMetrics(batch, farmData);

  const [form, setForm] = useState({ date: '', notes: '', mortality: 0 });
  const [preset, setPreset] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const applyPreset = (p) => {
    setPreset(p);
    const r = presetRange(p);
    setFrom(r.from);
    setTo(r.to);
    setPage(1);
  };

  const submitLog = (e) => {
    e.preventDefault();
    if (!form.date) return;
    onAddLog(batch.id, form);
    setForm({ date: '', notes: '', mortality: 0 });
  };

  const filteredLogs = useMemo(
    () => (batch.calendar || []).filter((c) => inDateRange(c.date, from, to)),
    [batch.calendar, from, to]
  );

  const { pageRows, total, totalPages, page: safePage, start } = sortAndPaginate(filteredLogs, {
    sortKey,
    sortDir,
    page,
    pageSize,
  });

  const metricsCards = [
    { label: 'Batch Age', value: metrics.ageLabel, sub: `${metrics.ageDayLabel} · ${metrics.ageDays} days`, wrap: 'bg-surface-sunken border-line', labelCls: 'text-content-muted', valueCls: 'text-content', subCls: 'text-accent-600' },
    { label: 'Live Birds', value: metrics.live, sub: `Initial: ${metrics.initial}`, wrap: 'bg-emerald-100 border-emerald-200', labelCls: 'text-emerald-800', valueCls: 'text-emerald-900', subCls: 'text-emerald-700' },
    { label: 'Mortality', value: metrics.mortality, sub: `${metrics.mortalityRate.toFixed(1)}% rate`, wrap: 'bg-rose-100 border-rose-200', labelCls: 'text-rose-800', valueCls: 'text-rose-900', subCls: 'text-rose-700 font-medium' },
    { label: 'Batch Revenue', value: formatMoney(metrics.revenue), sub: `${metrics.salesCount} ${metrics.salesCount === 1 ? 'sale' : 'sales'}`, wrap: 'bg-accent-100 border-accent-200', labelCls: 'text-accent-700', valueCls: 'text-accent-700', subCls: 'text-accent-700' },
    {
      label: 'Batch Expenses',
      value: formatMoney(metrics.taggedExpenses),
      sub: metrics.splitExpenses > 0 ? `Incl. ${formatMoney(metrics.splitExpenses)} shared` : 'Direct costs',
      wrap: 'bg-amber-100 border-amber-200',
      labelCls: 'text-amber-800',
      valueCls: 'text-amber-900',
      subCls: 'text-amber-700 font-medium',
    },
    {
      label: 'Net Profit',
      value: formatMoney(metrics.netProfit),
      sub: metrics.netProfit >= 0 ? 'Profit' : 'Loss',
      wrap: metrics.netProfit >= 0 ? 'bg-emerald-100 border-emerald-200' : 'bg-rose-100 border-rose-200',
      labelCls: metrics.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800',
      valueCls: metrics.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900',
      subCls: metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700 font-medium',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-4 sm:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-line">
          <div className="min-w-0">
            <div className="flex items-center space-x-3 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight text-content">{batch.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>
            </div>
            <p className="text-sm text-content-muted mt-1">
              Breed: <span className="font-medium text-content">{batch.breed}</span> | Arrived:{' '}
              <span className="font-medium text-content">{formatDate(batch.date)}</span>
            </p>
          </div>
          <button
            onClick={() => onDeleteBatch(batch.id)}
            className="self-start md:self-auto inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            <i className="fa-solid fa-trash-can" />
            <span>Delete Batch</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {metricsCards.map((c) => (
            <div key={c.label} className={`p-4 rounded-xl border ${c.wrap}`}>
              <span className={`text-[11px] uppercase font-semibold tracking-wide ${c.labelCls || 'text-content-muted'}`}>{c.label}</span>
              <div className={`text-lg sm:text-xl font-bold mt-1 tracking-tight ${c.valueCls || 'text-content'}`}>{c.value}</div>
              <span className={`text-xs ${c.subCls || 'text-content-muted'}`}>{c.sub}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-content-faint -mt-2">
          Batch age is shown as <span className="font-semibold text-content-muted">weeks.day-of-week</span> (e.g. 4.3 = week 4, day 3).
        </p>

        <div className="bg-surface-sunken p-4 rounded-xl border border-line">
          <h4 className="text-[11px] font-bold text-content-muted uppercase tracking-[0.12em] mb-1">Batch Setup Notes</h4>
          <p className="text-sm text-content-muted">{batch.notes || 'No notes provided.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily logger form */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-content text-base tracking-tight flex items-center space-x-2">
            <i className="fa-solid fa-calendar-plus text-emerald-600" />
            <span>Record Action / Mortality</span>
          </h3>
          <p className="text-xs text-content-muted">Select date to record feeding notes, vaccinations, or bird losses.</p>
          <form onSubmit={submitLog} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-content-muted mb-1">Target Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-muted mb-1">Actions Taken / Vaccination Notes</label>
              <textarea rows="3" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Administered Gumboro vaccine, switched feed..." className="input resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-muted mb-1">Mortality Count on this Date</label>
              <input type="number" min="0" value={form.mortality} onChange={(e) => setForm((f) => ({ ...f, mortality: e.target.value }))} className="input" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm transition">
              Save Calendar Entry
            </button>
          </form>
        </div>

        {/* Activity log */}
        <div className="card p-5 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
            <h3 className="font-bold text-content text-base tracking-tight flex items-center space-x-2">
              <i className="fa-solid fa-list-check text-emerald-600" />
              <span>Batch Activity Log</span>
            </h3>
            <PresetBar value={preset} onChange={applyPreset} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-surface-sunken rounded-xl border border-line">
            <div>
              <label className="block text-[10px] font-bold text-content-muted uppercase">From Date</label>
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset('all'); setPage(1); }} className="input !p-1.5 !text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-content-muted uppercase">To Date</label>
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset('all'); setPage(1); }} className="input !p-1.5 !text-xs" />
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
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Actions / Notes Recorded</th>
                  <th className="py-2.5 px-3 text-center">Mortality</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageRows.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-content-faint">No logs found.</td></tr>
                )}
                {pageRows.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-surface-sunken">
                    <td className="py-2.5 px-3 whitespace-nowrap">{formatDate(c.date)}</td>
                    <td className="py-2.5 px-3">{c.notes || '-'}</td>
                    <td className="py-2.5 px-3 text-center">{c.mortality || 0}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button onClick={() => onEditLog(c)} className="text-content-faint hover:text-emerald-600 px-1 transition-colors" title="Edit"><i className="fa-solid fa-pen" /></button>
                      <button onClick={() => onDeleteLog(c.id)} className="text-content-faint hover:text-rose-600 px-1 transition-colors" title="Delete"><i className="fa-solid fa-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      </div>
    </div>
  );
}
