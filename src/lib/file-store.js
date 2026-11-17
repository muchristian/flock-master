/**
 * Durable JSON persistence with two storage back-ends:
 *
 *  1. File System Access API  (desktop Chrome/Edge)
 *     -> data is written to  <chosen root>/farm-data/farm-data.json
 *        On desktop the picker opens directly in the OS "Documents" folder,
 *        so confirming creates  Documents/farm-data/farm-data.json.
 *        The chosen root is remembered across reloads via an IndexedDB handle.
 *
 *  2. OPFS — Origin Private File System  (mobile + any browser without the
 *     directory picker). Data lives in a private, sandboxed file that the
 *     browser will NOT clear on tab close / normal storage-pressure cleanup
 *     unless the user clears site data. We also keep a mirror in localStorage
 *     as a last-resort safety copy.
 *
 * Every write is queued, validated before commit and mirrored, so an
 * unexpected teardown can never leave us with an empty/corrupt file.
 */

const DATA_DIR = 'farm-data';
const DATA_FILE = 'farm-data.json';
const LEGACY_STORAGE_KEY = 'flockmaster_farm_data_v2';
const MIRROR_KEY = 'flockmaster_farm_data_mirror_v1';
const HANDLE_DB = 'flockmaster-fs';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'data-folder';
const ROOT_DIR_HANDLE_KEY = 'root-folder';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

// Coerce arbitrary input into the canonical data shape.
export function normalizeData(input) {
  const source = isPlainObject(input) ? input : {};
  return {
    batches: Array.isArray(source.batches) ? source.batches : [],
    sales: Array.isArray(source.sales) ? source.sales : [],
    expenses: Array.isArray(source.expenses) ? source.expenses : [],
  };
}

// True when the payload looks like a usable farm dataset.
export function isValidData(input) {
  return isPlainObject(input) && Array.isArray(input.batches) && Array.isArray(input.expenses);
}

function isEmptyData(data) {
  return (
    !data ||
    ((data.batches || []).length === 0 &&
      (data.sales || []).length === 0 &&
      (data.expenses || []).length === 0)
  );
}

/* ------------------------------------------------------------------ */
/* IndexedDB — persist the directory handle so the folder survives     */
/* reloads. A folder handle cannot be stored in localStorage.          */
/* ------------------------------------------------------------------ */

function openHandleDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available.'));
      return;
    }
    const request = indexedDB.open(HANDLE_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(HANDLE_STORE)) {
        request.result.createObjectStore(HANDLE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveHandle(handle, key = HANDLE_KEY) {
  try {
    const db = await openHandleDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      tx.objectStore(HANDLE_STORE).put(handle, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (error) {
    console.warn('Could not remember the data folder handle', error);
  }
}

async function loadHandle(key = HANDLE_KEY) {
  try {
    const db = await openHandleDb();
    const handle = await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly');
      const req = tx.objectStore(HANDLE_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return handle;
  } catch (error) {
    console.warn('Could not read the saved data folder handle', error);
    return null;
  }
}

async function clearHandle(key = HANDLE_KEY) {
  try {
    const db = await openHandleDb();
    await new Promise((resolve) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      tx.objectStore(HANDLE_STORE).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
    db.close();
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export function createFileStore({ onStatus = () => {} } = {}) {
  // 'picker' | 'opfs' | null
  let backend = null;
  let rootHandle = null; // the user-confirmed root (Documents by default)
  let directoryHandle = null; // root/farm-data
  let writeQueue = Promise.resolve();
  let lastGoodData = null; // last successfully persisted snapshot
  let rememberPromise = null;
  let locationLabel = '';

  const supportsDirectoryPicker = () =>
    typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

  const supportsOpfs = () =>
    typeof navigator !== 'undefined' &&
    !!navigator.storage &&
    typeof navigator.storage.getDirectory === 'function';

  const isConnected = () => backend !== null;

  // Human-readable where the data lives.
  const backendLabel = () => {
    if (backend === 'picker') {
      return locationLabel || `${DATA_DIR}/${DATA_FILE}`;
    }
    if (backend === 'opfs') return 'OPFS storage';
    return '';
  };

  // True when the chosen location is the Documents folder (the default).
  const isInDocuments = () => backend === 'picker' && (locationLabel || '').startsWith('Documents');

  /* ---------------- localStorage mirror (safety copy) --------------- */

  function writeMirror(data) {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(MIRROR_KEY, JSON.stringify(data));
    } catch {
      /* quota / private mode — non fatal */
    }
  }

  function readMirror() {
    try {
      if (typeof window === 'undefined') return null;
      const raw = window.localStorage.getItem(MIRROR_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return isValidData(parsed) ? normalizeData(parsed) : null;
    } catch {
      return null;
    }
  }

  /* ---------------- low level read / write ------------------------- */

  async function getOpfsFileHandle() {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle(DATA_DIR, { create: true });
    return dir.getFileHandle(DATA_FILE, { create: true });
  }

  async function readRaw() {
    try {
      let handle;
      if (backend === 'picker') {
        if (!directoryHandle) return null;
        handle = await directoryHandle.getFileHandle(DATA_FILE);
      } else if (backend === 'opfs') {
        handle = await getOpfsFileHandle();
      } else {
        return null;
      }
      const file = await handle.getFile();
      const text = await file.text();
      if (!text.trim()) return null;
      const parsed = JSON.parse(text);
      if (!isValidData(parsed)) {
        throw new Error('The farm-data.json file has an invalid structure.');
      }
      return normalizeData(parsed);
    } catch (error) {
      if (error.name === 'NotFoundError') return null;
      throw error;
    }
  }

  async function writeRaw(data) {
    const payload = JSON.stringify(data, null, 2);
    if (backend === 'picker') {
      const permission = await directoryHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        const requested = await directoryHandle.requestPermission({ mode: 'readwrite' });
        if (requested !== 'granted') throw new Error('Write permission was not granted.');
      }
      const fileHandle = await directoryHandle.getFileHandle(DATA_FILE, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(payload);
      await writable.close();
    } else if (backend === 'opfs') {
      const fileHandle = await getOpfsFileHandle();
      const writable = await fileHandle.createWritable();
      await writable.write(payload);
      await writable.close();
    } else {
      throw new Error('No storage backend is connected.');
    }
  }

  /* ---------------- public read / write ---------------------------- */

  async function readFromDirectory() {
    const data = await readRaw();
    if (data) lastGoodData = data;
    return data;
  }

  // Persist data. Guaranteed ordered, validated and mirrored.
  // A failed write never destroys the last good copy.
  function writeToDirectory(data) {
    const safe = normalizeData(data);

    writeQueue = writeQueue
      .then(async () => {
        if (!isConnected()) return false;
        // If we are about to overwrite a non-empty file with an empty dataset,
        // keep the previous copy in the mirror first so nothing is lost.
        if (isEmptyData(safe) && lastGoodData && !isEmptyData(lastGoodData)) {
          writeMirror(lastGoodData);
        }
        await writeRaw(safe);
        lastGoodData = safe;
        writeMirror(safe);
        onStatus(`Saved to ${backendLabel()}`, 'success');
        return true;
      })
      .catch((error) => {
        // Keep the mirror so a failed disk write cannot lose data.
        writeMirror(safe);
        onStatus(`Could not save: ${error.message}`, 'error');
        console.error('Farm data save failed', error);
        return false;
      });

    return writeQueue;
  }

  /* ---------------- connection ------------------------------------- */

  // Restore a previously granted folder on startup (desktop).
  async function restorePreviousConnection() {
    if (!supportsDirectoryPicker()) return null;
    if (rememberPromise) return rememberPromise;

    rememberPromise = (async () => {
      const handle = await loadHandle(ROOT_DIR_HANDLE_KEY);
      if (!handle) return null;
      try {
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          // Cannot silently re-request on load (needs a user gesture).
          onStatus('Reconnect your data folder to resume saving', 'info');
          return null;
        }
        rootHandle = handle;
        directoryHandle = await handle.getDirectoryHandle(DATA_DIR, { create: true });
        backend = 'picker';
        const data = await readFromDirectory();
        onStatus(`Connected: ${backendLabel()}`, 'success');
        return { backend, data };
      } catch (error) {
        console.warn('Could not restore data folder', error);
        return null;
      }
    })();

    return rememberPromise;
  }

  // Desktop: open the picker in the OS Documents folder so confirming
  // creates Documents/farm-data/farm-data.json.
  async function connectFolder() {
    if (!supportsDirectoryPicker()) {
      throw new Error(
        'Folder access is not supported in this browser. Data will be saved in private browser storage instead.'
      );
    }

    // Try to start directly in Documents. `startIn` accepts well-known
    // folder names ('documents', 'desktop', ...) or a FileSystemHandle.
    // If the stored root is a known one we prefer it; otherwise Documents.
    const pickerOptions = { id: 'flockmaster-data', mode: 'readwrite', startIn: 'documents' };

    let root;
    try {
      root = await window.showDirectoryPicker(pickerOptions);
    } catch (error) {
      // AbortError = user cancelled; let it bubble up.
      throw error;
    }

    rootHandle = root;
    directoryHandle = await root.getDirectoryHandle(DATA_DIR, { create: true });
    backend = 'picker';
    rememberPromise = null; // allow restorePreviousConnection to re-read later
    await saveHandle(root, ROOT_DIR_HANDLE_KEY);

    // If the picker opened in Documents the folder is exactly Documents/farm-data;
    // otherwise we still store <chosen>/farm-data and report the path.
    locationLabel = `${root.name}/${DATA_DIR}/${DATA_FILE}`;

    let data = await readFromDirectory();
    if (!data) {
      // Nothing on disk yet: seed from mirror / legacy / empty.
      data = normalizeData(readMirror() || migrateLegacyData() || {});
      await writeRaw(data);
      lastGoodData = data;
      completeLegacyMigration();
    }
    onStatus(`Connected: ${backendLabel()}`, 'success');
    return data;
  }

  // Mobile / fallback: open OPFS.
  async function connectOpfs() {
    if (!supportsOpfs()) {
      throw new Error('Private browser storage (OPFS) is not available in this browser.');
    }
    backend = 'opfs';
    let data = await readFromDirectory();
    if (!data) {
      data = normalizeData(readMirror() || migrateLegacyData() || {});
      await writeRaw(data);
      lastGoodData = data;
      completeLegacyMigration();
    }
    onStatus(`Using ${backendLabel()}`, 'success');
    return data;
  }

  /* ---------------- legacy migration ------------------------------- */

  function migrateLegacyData() {
    try {
      if (typeof window === 'undefined') return null;
      const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.batches)) return null;
      return normalizeData(data);
    } catch (error) {
      console.warn('Legacy browser data could not be migrated', error);
      return null;
    }
  }

  function completeLegacyMigration() {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* storage may be disabled */
    }
  }

  /* ---------------- export / import -------------------------------- */

  function exportData(data) {
    const payload = normalizeData(data);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flockmaster-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on the next tick so the download definitely starts.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function parseImport(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('That file is not valid JSON.');
    }
    if (!isValidData(parsed)) {
      throw new Error('The JSON file must contain "batches" and "expenses" arrays.');
    }
    return normalizeData(parsed);
  }

  /* ---------------- safety flush ----------------------------------- */

  // Best-effort flush on unload. The synchronous localStorage mirror
  // guarantees survival even if the async file write does not finish.
  function flushNow(data) {
    const safe = normalizeData(data);
    writeMirror(safe);
    if (isConnected()) writeToDirectory(safe);
  }

  return {
    // capability + state
    supportsDirectoryPicker,
    supportsOpfs,
    isConnected,
    backend: () => backend,
    backendLabel,
    isInDocuments,
    isDiskBackend: () => backend === 'picker',

    // lifecycle
    connectFolder,
    connectOpfs,
    restorePreviousConnection,
    disconnect: async () => {
      await clearHandle(ROOT_DIR_HANDLE_KEY);
      rootHandle = null;
      directoryHandle = null;
      backend = null;
      locationLabel = '';
      onStatus('Disconnected', 'info');
    },

    // Where data is stored (human readable).
    getLocation: () => (backend === 'opfs' ? 'Private browser storage (OPFS)' : locationLabel || backendLabel()),

    // data
    readFromDirectory,
    writeToDirectory,
    flushNow,
    readMirror,

    // legacy + backup
    migrateLegacyData,
    completeLegacyMigration,
    exportData,
    parseImport,
  };
}

