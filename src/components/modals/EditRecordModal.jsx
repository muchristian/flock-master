import { useEffect, useState } from 'react';
import Modal from '../widgets/Modal.jsx';
import TagPicker from '../widgets/TagPicker.jsx';
import { EXPENSE_CATEGORIES, EXPENSE_TAGS, SALES_TYPES, SALES_TAGS, ALL_BATCHES, ALL_BATCHES_LABEL } from '../../lib/constants.js';

// Builds an editable draft from the record being edited.
function makeDraft(type, record) {
  if (type === 'log') {
    return { date: record.date || '', mortality: record.mortality || 0, notes: record.notes || '' };
  }
  if (type === 'sale') {
    return {
      datetime: record.datetime || '',
      saleType: record.saleType || 'Eggs',
      tags: record.tags || [],
      buyer: record.buyer || '',
      quantity: record.quantity ?? '',
      price: record.price ?? '',
      batchId: record.batchId || '',
    };
  }
  return {
    date: record.date || '',
    category: record.category || 'Other',
    amount: record.amount ?? '',
    tags: record.tags || [],
    batchId: record.batchId || '',
    desc: record.desc || '',
  };
}

export default function EditRecordModal({ open, onClose, onSave, editing, batches }) {
  const [draft, setDraft] = useState({});
  const type = editing?.type;
  const record = editing?.record;

  useEffect(() => {
    if (open && editing) setDraft(makeDraft(editing.type, editing.record));
  }, [open, editing]);

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  if (!open || !editing) return null;

  const titleMap = { log: 'Edit Activity Log', sale: 'Edit Sale', expense: 'Edit Expense' };

  const submit = (e) => {
    e.preventDefault();
    onSave(type, record.id, draft);
    onClose();
  };

  const field = (label, key, inputType = 'text', extra = {}) => (
    <label className={`block ${inputType === 'textarea' ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs font-semibold text-content-muted">{label}</span>
      {inputType === 'textarea' ? (
        <textarea name={key} rows="3" value={draft[key] ?? ''} onChange={set(key)} className="input resize-none" />
      ) : (
        <input name={key} type={inputType} value={draft[key] ?? ''} onChange={set(key)} className="input" {...extra} required />
      )}
    </label>
  );

  return (
    <Modal open={open} onClose={onClose} title={titleMap[type]} icon="fa-solid fa-pen-to-square" maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {type === 'log' && (
            <>
              {field('Date', 'date', 'date')}
              {field('Mortality Count', 'mortality', 'number', { min: 0, step: 1 })}
              {field('Actions / Notes', 'notes', 'textarea')}
            </>
          )}

          {type === 'sale' && (
            <>
              {field('Date & Time', 'datetime', 'datetime-local')}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-content-muted">Sale Type</span>
                <select value={draft.saleType} onChange={set('saleType')} className="input">
                  {[...new Set([...SALES_TYPES, draft.saleType || 'Eggs'])].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>
              {field('Customer / Buyer', 'buyer')}
              {field('Quantity', 'quantity', 'number', { min: 0.01, step: 0.01 })}
              {field('Total Selling Price (RWF)', 'price', 'number', { min: 0, step: 1 })}
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-content-muted">Flock Batch (Optional)</span>
                <select value={draft.batchId} onChange={set('batchId')} className="input">
                  <option value="">General (No Batch)</option>
                  <option value={ALL_BATCHES}>{ALL_BATCHES_LABEL} — split evenly</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>
              <div className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-content-muted">Tags (Optional)</span>
                <TagPicker
                  options={SALES_TAGS}
                  value={draft.tags || []}
                  onChange={(tags) => setDraft((d) => ({ ...d, tags }))}
                  emptyText="No tags selected — click any tag to add it."
                />
              </div>
            </>
          )}

          {type === 'expense' && (
            <>
              {field('Date', 'date', 'date')}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-content-muted">Category</span>
                <select value={draft.category} onChange={set('category')} className="input">
                  {[...new Set([...EXPENSE_CATEGORIES, draft.category])].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>
              {field('Amount (RWF)', 'amount', 'number', { min: 0, step: 1 })}
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-content-muted">Tags (select multiple)</span>
                <select
                  multiple
                  size="4"
                  value={draft.tags}
                  onChange={(e) => setDraft((d) => ({ ...d, tags: Array.from(e.target.selectedOptions, (o) => o.value) }))}
                  className="input"
                >
                  {EXPENSE_TAGS.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <span className="mt-1 block text-[11px] text-content-faint">Hold Ctrl (Windows/Linux) or Command (Mac) to select multiple.</span>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-content-muted">Batch (Tag)</span>
                <select value={draft.batchId} onChange={set('batchId')} className="input">
                  <option value="">None (General / No Batch)</option>
                  <option value={ALL_BATCHES}>{ALL_BATCHES_LABEL} — split evenly</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>
              {field('Description', 'desc', 'textarea')}
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-line bg-surface-sunken px-4 py-2 text-sm font-medium text-content-muted transition hover:text-content">Cancel</button>
          <button type="submit" className="btn-primary">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}
