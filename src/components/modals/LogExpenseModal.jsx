import { useEffect, useState } from 'react';
import Modal from '../widgets/Modal.jsx';
import TagPicker from '../widgets/TagPicker.jsx';
import { EXPENSE_CATEGORIES_FORM, EXPENSE_TAGS, ALL_BATCHES, ALL_BATCHES_LABEL } from '../../lib/constants.js';
import { todayISO, formatMoney } from '../../lib/helpers.js';

function makeInitial(batchId) {
  return { date: todayISO(), amount: '', category: 'Feed', tags: [], batchId: batchId || '', desc: '' };
}

export default function LogExpenseModal({ open, onClose, onSave, batches, defaultBatchId = '' }) {
  const [form, setForm] = useState(() => makeInitial(defaultBatchId));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (open) setForm(makeInitial(defaultBatchId));
  }, [open, defaultBatchId]);

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Farm Expense" icon="fa-solid fa-receipt" iconColor="text-rose-600" maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-content-muted mb-1">Date</label>
            <input type="date" required value={form.date} onChange={set('date')} className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-content-muted mb-1">Amount (RWF)</label>
            <input type="number" min="1" required value={form.amount} onChange={set('amount')} placeholder="25000" className="input" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-content-muted mb-1">Expense Category</label>
          <select value={form.category} onChange={set('category')} className="input">
            {EXPENSE_CATEGORIES_FORM.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-content-muted mb-1">Tags (Optional)</label>
          <TagPicker
            options={EXPENSE_TAGS}
            value={form.tags}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            emptyText="No tags selected — click any tag to add it."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-content-muted mb-1">Tag Specific Batch (Optional)</label>
          <select value={form.batchId} onChange={set('batchId')} className="input">
            <option value="">None (General Farm Expense)</option>
            <option value={ALL_BATCHES}>{ALL_BATCHES_LABEL} — split evenly</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {form.batchId === ALL_BATCHES && (
            <p className="mt-1 text-[11px] text-amber-700">
              {batches.length > 0
                ? `Split evenly across ${batches.length} ${batches.length === 1 ? 'batch' : 'batches'}${
                    form.amount ? ` (~${formatMoney((Number(form.amount) || 0) / batches.length)} each)` : ''
                  }.`
                : 'Add a batch first — the cost will be shared once batches exist.'}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-content-muted mb-1">Description / Notes</label>
          <input type="text" required value={form.desc} onChange={set('desc')} placeholder="e.g. 2 bags Starter Feed" className="input" />
        </div>
        <div className="pt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-line bg-surface-sunken px-4 py-2 text-sm font-medium text-content-muted transition hover:text-content">Cancel</button>
          <button type="submit" className="btn-primary">Save Expense</button>
        </div>
      </form>
    </Modal>
  );
}
