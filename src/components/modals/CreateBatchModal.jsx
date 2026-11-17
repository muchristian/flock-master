import { useState } from 'react';
import Modal from '../widgets/Modal.jsx';
import { todayISO, batchAge } from '../../lib/helpers.js';

const initial = { name: '', date: todayISO(), count: '', breed: '', notes: '' };

export default function CreateBatchModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const age = form.date ? batchAge(form.date) : null;

  const submit = (e) => {
    e.preventDefault();
    onCreate(form);
    setForm(initial);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Flock Batch" icon="fa-solid fa-kiwi-bird" iconColor="text-emerald-700">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-content-muted mb-1">Batch Name</label>
          <input type="text" required value={form.name} onChange={set('name')} placeholder="e.g. Batch 1 - Layers" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-content-muted mb-1">Arrival Date</label>
            <input type="date" required value={form.date} onChange={set('date')} className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-content-muted mb-1">Initial Bird Count</label>
            <input type="number" min="1" required value={form.count} onChange={set('count')} placeholder="100" className="input" />
          </div>
        </div>
        {age && (
          <p className="text-[11px] text-content-faint -mt-1">
            Current age: <span className="font-semibold text-content-muted">{age.label}</span> ({age.dayLabel})
          </p>
        )}
        <div>
          <label className="block text-xs font-semibold text-content-muted mb-1">Breed / Type</label>
          <input type="text" required value={form.breed} onChange={set('breed')} placeholder="e.g. Cobb 500, Isa Brown" className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-content-muted mb-1">Notes / House</label>
          <textarea rows="2" value={form.notes} onChange={set('notes')} placeholder="Optional setup details..." className="input resize-none" />
        </div>
        <div className="pt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-line bg-surface-sunken px-4 py-2 text-sm font-medium text-content-muted transition hover:text-content">Cancel</button>
          <button type="submit" className="btn-primary">Save Batch</button>
        </div>
      </form>
    </Modal>
  );
}
