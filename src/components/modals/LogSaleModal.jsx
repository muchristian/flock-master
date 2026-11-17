import { useEffect, useState } from 'react';
import Modal from '../widgets/Modal.jsx';
import TagPicker from '../widgets/TagPicker.jsx';
import { SALES_TYPES, SALES_TAGS, ALL_BATCHES, ALL_BATCHES_LABEL } from '../../lib/constants.js';
import { nowLocalDatetime } from '../../lib/helpers.js';

function makeInitial(batchId) {
  return {
    batchId: batchId || '',
    saleType: 'Eggs',
    tags: [],
    buyer: '',
    datetime: nowLocalDatetime(),
    quantity: '',
    price: '',
  };
}

export default function LogSaleModal({ open, onClose, onSave, batches, defaultBatchId = '' }) {
  const [form, setForm] = useState(() => makeInitial(defaultBatchId));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (open) setForm(makeInitial(defaultBatchId));
  }, [open, defaultBatchId]);

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, batchId: form.batchId || '' });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Farm Sale" icon="fa-solid fa-cart-shopping" iconColor="text-emerald-600" maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-content-muted mb-1">Sale Type</label>
            <select value={form.saleType} onChange={set('saleType')} className="input">
              {SALES_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-content-muted mb-1">Flock Batch (Optional)</label>
            <select value={form.batchId} onChange={set('batchId')} className="input">
              <option value="">General (No Batch)</option>
              <option value={ALL_BATCHES}>{ALL_BATCHES_LABEL} — split evenly</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-content-muted mb-1">Buyer / Customer Name</label>
          <input type="text" required value={form.buyer} onChange={set('buyer')} placeholder="e.g. Eric, Hotel Kigali" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-content-muted mb-1">Date &amp; Time</label>
            <input type="datetime-local" required value={form.datetime} onChange={set('datetime')} className="input text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-content-muted mb-1">Quantity</label>
            <input type="number" min="0.01" step="0.01" required value={form.quantity} onChange={set('quantity')} placeholder="e.g. 10" className="input" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-content-muted mb-1">Total Selling Price (RWF)</label>
          <input type="number" min="1" required value={form.price} onChange={set('price')} placeholder="45000" className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-content-muted mb-1">Tags (Optional)</label>
          <TagPicker
            options={SALES_TAGS}
            value={form.tags}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            emptyText="No tags selected — click any tag to add it."
          />
        </div>
        <div className="pt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-line bg-surface-sunken px-4 py-2 text-sm font-medium text-content-muted transition hover:text-content">Cancel</button>
          <button type="submit" className="btn-primary">Log Sale</button>
        </div>
      </form>
    </Modal>
  );
}

