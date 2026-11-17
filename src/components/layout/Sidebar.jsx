import { useState } from 'react';

// Sidebar navigation. The rail is theme-aware: a clean white rail in light
// mode and a deep near-black rail in dark mode, so it always sits naturally
// with the rest of the UI. Batch items link to a single Overview screen.
export default function Sidebar({ open, onClose, view, onNavigate, batches, activeBatchId, onCreateBatch, storage }) {
  const [expanded, setExpanded] = useState({});

  const toggleBatch = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const globalLinks = [
    { key: 'dashboard', label: 'Farm Dashboard', icon: 'fa-chart-pie' },
    { key: 'all-sales', label: 'All Farm Sales', icon: 'fa-cart-shopping' },
    { key: 'all-expenses', label: 'All Farm Expenses', icon: 'fa-receipt' },
    { key: 'backup', label: 'Data Backup & JSON', icon: 'fa-database' },
  ];

  const baseItem = 'w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-colors';
  const idleItem = 'text-rail-text hover:text-rail-strong hover:bg-rail-hover';
  const activeItem = 'bg-rail-active text-white shadow-sm';

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out w-72 bg-rail border-r border-rail-border flex flex-col z-30 shadow-sm`}
      >
        {/* Logo header */}
        <div className="p-5 border-b border-rail-border flex items-center gap-3">
          <div className="bg-rail-active p-2.5 rounded-xl text-white shadow-sm">
            <i className="fa-solid fa-kiwi-bird text-xl" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-rail-strong text-lg leading-tight tracking-tight">FlockMaster</h1>
            <p className="text-xs text-rail-brand font-medium">Farm &amp; Batch Suite</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden ml-auto text-rail-faint hover:text-rail-strong p-1.5 rounded-lg"
            aria-label="Close navigation"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 pb-2 text-[11px] font-bold text-rail-faint uppercase tracking-[0.12em]">
            Global Navigation
          </div>

          {globalLinks.map((link) => (
            <button
              key={link.key}
              type="button"
              onClick={() => onNavigate(link.key)}
              className={`${baseItem} px-3 py-2.5 ${view === link.key ? activeItem : idleItem}`}
            >
              <i className={`fa-solid ${link.icon} w-5 text-center`} />
              <span>{link.label}</span>
            </button>
          ))}

          <div className="pt-5 px-3 pb-2 flex justify-between items-center">
            <span className="text-[11px] font-bold text-rail-faint uppercase tracking-[0.12em]">
              Flock Batches
            </span>
            <button
              type="button"
              onClick={onCreateBatch}
              title="Create New Batch"
              className="text-rail-brand hover:text-rail-active transition-colors"
            >
              <i className="fa-solid fa-circle-plus text-base" />
            </button>
          </div>

          {/* Expandable batch accordion — each batch opens its Overview screen */}
          <div className="space-y-1">
            {batches.length === 0 && (
              <p className="px-3 py-2 text-xs text-rail-faint">No batches yet.</p>
            )}
            {batches.map((batch) => {
              const isExpanded = expanded[batch.id];
              const active = activeBatchId === batch.id && view === 'batch-overview';
              return (
                <div key={batch.id}>
                  <button
                    type="button"
                    onClick={() => {
                      toggleBatch(batch.id);
                      onNavigate('batch-overview', batch.id);
                    }}
                    aria-expanded={isExpanded}
                    className={`${baseItem} justify-between px-3 py-2 ${active ? activeItem : idleItem}`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <i className={`fa-solid fa-feather w-4 text-center ${active ? 'text-white' : 'text-rail-brand'}`} />
                      <span className="truncate">{batch.name}</span>
                    </span>
                    <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-[10px] shrink-0 opacity-70`} />
                  </button>

                  {isExpanded && (
                    <div className="mt-1 ml-4 pl-3 border-l border-rail-border">
                      <div className="px-3 py-1.5 text-[11px] text-rail-faint leading-relaxed">
                        <div>Breed: <span className="text-rail-text">{batch.breed}</span></div>
                        <div>Arrived: <span className="text-rail-text">{String(batch.date || '').slice(0, 10)}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-rail-border space-y-2">
          {storage && (
            <div className="rounded-lg bg-rail-hover px-3 py-2 text-[11px] leading-snug text-rail-text">
              <div className="flex items-center gap-1.5 font-semibold text-rail-strong">
                <i className={`fa-solid ${storage.isConnected ? 'fa-circle-check text-emerald-600' : 'fa-circle-dot'}`} />
                <span>Storage</span>
              </div>
              <div className="mt-0.5 break-all font-mono text-rail-faint">
                {storage.getLocation ? storage.getLocation() : storage.backendLabel}
              </div>
              {storage.supportsDirectoryPicker && !storage.isDiskBackend && (
                <button
                  type="button"
                  onClick={storage.onSaveToDocuments}
                  className="mt-1.5 w-full rounded-md bg-amber-500 px-2 py-1 font-semibold text-white transition hover:bg-amber-600"
                >
                  Save to Documents
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={onCreateBatch}
            className="w-full bg-rail-active hover:opacity-90 text-white font-semibold py-2.5 px-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <i className="fa-solid fa-plus text-xs" />
            <span>New Flock Batch</span>
          </button>
        </div>
      </aside>
    </>
  );
}

