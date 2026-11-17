import { useRef } from 'react';

export default function BackupView({
  storageStatus,
  isConnected,
  supportsDirectoryPicker,
  supportsOpfs,
  backendLabel,
  getLocation,
  onConnectFolder,
  onExport,
  onImport,
}) {
  const fileInputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      onImport(text);
    } catch (err) {
      window.alert(`Import failed: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const toneClass = {
    error: 'text-rose-700',
    success: 'text-emerald-700',
    info: 'text-content-muted',
  }[storageStatus.tone] || 'text-content-muted';

  return (
    <div className="card p-4 sm:p-6 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-content tracking-tight">Data Persistence &amp; JSON Backup System</h3>
        <p className="text-xs text-content-muted">Save, restore, and export all farm batches, sales, calendar entries, and expenses.</p>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
        <div className="flex items-center gap-3 text-emerald-900">
          <i className="fa-solid fa-folder-open text-2xl" />
          <h4 className="font-bold">Durable storage</h4>
        </div>
        <p className="text-sm text-emerald-900">
          On a computer, FlockMaster saves to your{' '}
          <code className="rounded bg-emerald-100 px-1 text-emerald-900">Documents/farm-data/farm-data.json</code> folder
          (the folder picker opens in Documents — just confirm). On mobile it saves to private browser storage (OPFS).
          Either way a safety copy is kept in the browser, so data survives reloads and unexpected tab closure.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onConnectFolder}
            disabled={!supportsDirectoryPicker}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={supportsDirectoryPicker ? 'Opens the Documents folder to create farm-data' : 'Folder access is not available in this browser'}
          >
            <i className="fa-solid fa-folder-plus mr-2" />
            {supportsDirectoryPicker ? 'Save to Documents' : 'Folder Unavailable'}
          </button>
          <span className={`text-xs font-semibold ${toneClass}`}>{storageStatus.text}</span>
        </div>
        {isConnected && (
          <p className="text-xs font-medium text-emerald-800 break-all">
            <i className="fa-solid fa-circle-check mr-1.5" />
            Saving to: <span className="font-mono">{getLocation ? getLocation() : backendLabel}</span>
          </p>
        )}
        {!supportsDirectoryPicker && (
          <p className="text-xs font-medium text-emerald-800">
            {supportsOpfs
              ? 'This device saves to private browser storage (OPFS). Use Export regularly for a portable backup.'
              : 'This browser cannot save to disk or private storage; export a backup to avoid data loss.'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-line bg-surface-sunken p-5 space-y-3">
          <div className="flex items-center space-x-3 text-emerald-700">
            <i className="fa-solid fa-file-export text-2xl" />
            <h4 className="font-bold text-content">Export Backup File</h4>
          </div>
          <p className="text-xs text-content-muted">
            Download your full farm database as a <code className="rounded bg-surface px-1 text-content">farm_data_backup.json</code> file.
          </p>
          <button
            onClick={onExport}
            className="btn-primary w-full"
          >
            <i className="fa-solid fa-download" />
            <span>Export Data to JSON</span>
          </button>
        </div>

        <div className="rounded-xl border border-line bg-surface-sunken p-5 space-y-3">
          <div className="flex items-center space-x-3 text-accent-600">
            <i className="fa-solid fa-file-import text-2xl" />
            <h4 className="font-bold text-content">Import Data File</h4>
          </div>
          <p className="text-xs text-content-muted">
            Restore your farm history from a previously saved <code className="rounded bg-surface px-1 text-content">.json</code> file.
          </p>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-accent-600"
          >
            <i className="fa-solid fa-upload" />
            <span>Select &amp; Restore JSON File</span>
          </button>
        </div>
      </div>
    </div>
  );
}

