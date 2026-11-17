import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createFileStore, normalizeData, isValidData } from '../lib/file-store.js';
import { EMPTY_DATA } from '../lib/constants.js';
import { uid } from '../lib/helpers.js';

const FarmContext = createContext(null);

export function FarmProvider({ children }) {
  const [farmData, setFarmData] = useState(EMPTY_DATA);
  const [storageStatus, setStorageStatus] = useState({ text: 'Connecting to storage…', tone: 'info' });
  const [ready, setReady] = useState(false);
  const fileStoreRef = useRef(null);
  const dataRef = useRef(farmData);
  // Set once any user mutation happens. The async startup must never
  // overwrite state the user has already changed.
  const dirtyRef = useRef(false);

  // Keep a ref of the latest data for unload flushing.
  useEffect(() => {
    dataRef.current = farmData;
  }, [farmData]);

  if (!fileStoreRef.current) {
    fileStoreRef.current = createFileStore({
      onStatus: (text, tone) => setStorageStatus({ text, tone }),
    });
  }
  const fileStore = fileStoreRef.current;

  // Persist to the active backend. Never called from inside a state updater,
  // so React StrictMode's double-invoke cannot cause duplicate/empty writes.
  const persist = useCallback(
    (next) => {
      if (!fileStore.isConnected()) return;
      fileStore.writeToDirectory(next);
    },
    [fileStore]
  );

  const updateData = useCallback(
    (updater) => {
      dirtyRef.current = true;
      setFarmData((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        // Persisting inside a state updater is unsafe under StrictMode
        // (updaters may run twice). Schedule the write in a microtask so it
        // happens exactly once, after React commits the state.
        queueMicrotask(() => persist(next));
        return next;
      });
    },
    [persist]
  );

  // Only adopt data loaded from storage if the user has not already edited
  // anything — otherwise a slow storage init could wipe fresh changes.
  const applyLoaded = useCallback((loaded) => {
    if (dirtyRef.current) return;
    if (loaded && isValidData(loaded)) {
      setFarmData(normalizeData(loaded));
    }
  }, []);

  // ---- Startup: choose backend, restore connection, load data ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1. Desktop: try to silently restore a previously granted folder.
        if (fileStore.supportsDirectoryPicker()) {
          const restored = await fileStore.restorePreviousConnection();
          if (cancelled) return;
          if (restored && restored.data) {
            applyLoaded(restored.data);
            setReady(true);
            return;
          }
          // No granted folder yet — fall back to OPFS so nothing is lost
          // even before the user picks a folder.
          if (fileStore.supportsOpfs()) {
            const data = await fileStore.connectOpfs();
            if (cancelled) return;
            applyLoaded(data);
            setStorageStatus({
              text: 'Using browser storage — click "Save to Documents" to store on disk',
              tone: 'info',
            });
            setReady(true);
            return;
          }
          setStorageStatus({ text: 'Choose a data folder to start saving', tone: 'info' });
          // Still surface the safety mirror so a reload doesn't look empty.
          const mirror = fileStore.readMirror();
          if (!cancelled && mirror) applyLoaded(mirror);
          setReady(true);
          return;
        }

        // 2. Mobile / no picker: use OPFS directly.
        if (fileStore.supportsOpfs()) {
          const data = await fileStore.connectOpfs();
          if (cancelled) return;
          applyLoaded(data);
        } else {
          // 3. Last resort: localStorage mirror only.
          const mirror = fileStore.readMirror();
          if (!cancelled && mirror) applyLoaded(mirror);
          setStorageStatus({ text: 'Saving to browser storage (limited)', tone: 'info' });
        }
      } catch (error) {
        console.error('Storage init failed', error);
        if (!cancelled) setStorageStatus({ text: error.message, tone: 'error' });
        const mirror = fileStore.readMirror();
        if (!cancelled && mirror) applyLoaded(mirror);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileStore, applyLoaded]);

  // ---- Flush pending writes when the tab is hidden or closed ----
  useEffect(() => {
    const flush = () => fileStore.flushNow(dataRef.current);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fileStore]);

  const connectFolder = useCallback(async () => {
    try {
      const loaded = await fileStore.connectFolder();
      if (!loaded || !isValidData(loaded)) return;

      // Decide whether to trust disk or memory.
      const diskEmpty =
        !loaded.batches.length && !loaded.sales.length && !loaded.expenses.length;
      const memHasData =
        farmData.batches.length || farmData.sales.length || farmData.expenses.length;

      if (diskEmpty && memHasData) {
        // Disk is blank but we hold data in memory (e.g. created before
        // connecting): push memory to disk, keep the UI as-is.
        await fileStore.writeToDirectory(farmData);
        setStorageStatus({ text: 'Saved your current data to Documents', tone: 'success' });
      } else if (!dirtyRef.current) {
        // Disk has data and the user hasn't changed anything yet: adopt disk.
        setFarmData(normalizeData(loaded));
      } else {
        // User has unsaved changes but disk also has data: keep memory and
        // write it to the newly chosen folder so nothing is lost.
        await fileStore.writeToDirectory(farmData);
        setStorageStatus({ text: 'Saved your current data to Documents', tone: 'success' });
      }
    } catch (error) {
      setStorageStatus({ text: error.message, tone: 'error' });
    }
  }, [fileStore, farmData]);

  // ---- Batch operations ----
  const createBatch = useCallback(
    (payload) => {
      const batch = {
        id: uid(),
        name: payload.name.trim(),
        date: payload.date,
        count: Math.max(1, parseInt(payload.count, 10) || 1),
        breed: payload.breed.trim(),
        notes: payload.notes.trim(),
        calendar: [],
      };
      updateData((prev) => ({ ...prev, batches: [...prev.batches, batch] }));
      return batch;
    },
    [updateData]
  );

  const deleteBatch = useCallback(
    (batchId) => {
      updateData((prev) => ({
        ...prev,
        batches: prev.batches.filter((b) => b.id !== batchId),
        // Only drop records tied to this specific batch; "All Batches"
        // (batchId: 'ALL') records are shared and must be kept.
        sales: prev.sales.filter((s) => s.batchId !== batchId),
        expenses: prev.expenses.filter((e) => e.batchId !== batchId),
      }));
    },
    [updateData]
  );

  const addLogEntry = useCallback(
    (batchId, { date, notes, mortality }) => {
      updateData((prev) => ({
        ...prev,
        batches: prev.batches.map((b) =>
          b.id === batchId
            ? {
                ...b,
                calendar: [
                  ...(b.calendar || []),
                  { id: uid(), date, notes: notes.trim(), mortality: Math.max(0, parseInt(mortality, 10) || 0) },
                ],
              }
            : b
        ),
      }));
    },
    [updateData]
  );

  // ---- Sale operations ----
  const addSale = useCallback(
    (payload) => {
      const sale = {
        id: uid(),
        batchId: payload.batchId,
        saleType: payload.saleType || 'Eggs',
        tags: payload.tags || [],
        buyer: payload.buyer.trim(),
        datetime: payload.datetime,
        quantity: Math.max(0.01, parseFloat(payload.quantity) || 0.01),
        price: Math.max(0, parseFloat(payload.price) || 0),
      };
      updateData((prev) => ({ ...prev, sales: [...prev.sales, sale] }));
      return sale;
    },
    [updateData]
  );

  // ---- Expense operations ----
  const addExpense = useCallback(
    (payload) => {
      const expense = {
        id: uid(),
        date: payload.date,
        category: payload.category,
        tags: payload.tags || [],
        amount: Math.max(0, parseFloat(payload.amount) || 0),
        batchId: payload.batchId || '',
        desc: payload.desc.trim(),
      };
      updateData((prev) => ({ ...prev, expenses: [...prev.expenses, expense] }));
      return expense;
    },
    [updateData]
  );

  // ---- Edit operations (mirrors editRecord / saveEditedRecord) ----
  const updateRecord = useCallback(
    (type, recordId, values) => {
      updateData((prev) => {
        if (type === 'log') {
          return {
            ...prev,
            batches: prev.batches.map((b) => ({
              ...b,
              calendar: (b.calendar || []).map((c) =>
                c.id === recordId
                  ? {
                      ...c,
                      date: values.date,
                      notes: (values.notes || '').trim(),
                      mortality: Math.max(0, parseInt(values.mortality, 10) || 0),
                    }
                  : c
              ),
            })),
          };
        }
        if (type === 'sale') {
          return {
            ...prev,
            sales: prev.sales.map((s) =>
              s.id === recordId
                ? {
                    ...s,
                    datetime: values.datetime,
                    saleType: values.saleType || 'Eggs',
                    tags: values.tags || [],
                    buyer: (values.buyer || '').trim(),
                    quantity: Math.max(0.01, parseFloat(values.quantity) || 0.01),
                    price: Math.max(0, parseFloat(values.price) || 0),
                    batchId: values.batchId || '',
                  }
                : s
            ),
          };
        }
        // expense
        return {
          ...prev,
          expenses: prev.expenses.map((e) =>
            e.id === recordId
              ? {
                  ...e,
                  date: values.date,
                  category: values.category,
                  tags: values.tags || [],
                  amount: Math.max(0, parseFloat(values.amount) || 0),
                  batchId: values.batchId || '',
                  desc: (values.desc || '').trim(),
                }
              : e
          ),
        };
      });
    },
    [updateData]
  );

  const removeRecord = useCallback(
    (type, recordId) => {
      updateData((prev) => {
        if (type === 'log') {
          return {
            ...prev,
            batches: prev.batches.map((b) => ({
              ...b,
              calendar: (b.calendar || []).filter((c) => c.id !== recordId),
            })),
          };
        }
        if (type === 'sale') {
          return { ...prev, sales: prev.sales.filter((s) => s.id !== recordId) };
        }
        return { ...prev, expenses: prev.expenses.filter((e) => e.id !== recordId) };
      });
    },
    [updateData]
  );

  // ---- Backup helpers ----
  const exportJSON = useCallback(() => {
    fileStore.exportData(farmData);
    setStorageStatus({ text: 'Backup file exported', tone: 'success' });
  }, [fileStore, farmData]);

  const importJSON = useCallback(
    (text) => {
      const next = fileStore.parseImport(text);
      setFarmData(next);
      persist(next);
      setStorageStatus({ text: 'Backup restored', tone: 'success' });
    },
    [fileStore, persist]
  );

  const loadDemoData = useCallback(() => {
    const demo = buildDemoData();
    setFarmData(demo);
    persist(demo);
  }, [persist]);

  const value = useMemo(
    () => ({
      farmData,
      ready,
      storageStatus,
      isConnected: fileStore.isConnected(),
      supportsDirectoryPicker: fileStore.supportsDirectoryPicker(),
      supportsOpfs: fileStore.supportsOpfs(),
      backendLabel: fileStore.backendLabel(),
      isInDocuments: fileStore.isInDocuments(),
      isDiskBackend: fileStore.isDiskBackend(),
      getLocation: () => fileStore.getLocation(),
      connectFolder,
      createBatch,
      deleteBatch,
      addLogEntry,
      addSale,
      addExpense,
      updateRecord,
      removeRecord,
      exportJSON,
      importJSON,
      loadDemoData,
    }),
    [
      farmData,
      ready,
      storageStatus,
      fileStore,
      connectFolder,
      createBatch,
      deleteBatch,
      addLogEntry,
      addSale,
      addExpense,
      updateRecord,
      removeRecord,
      exportJSON,
      importJSON,
      loadDemoData,
    ]
  );

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used within a FarmProvider');
  return ctx;
}

// Sample dataset used by the "Load Demo Data" button.
function buildDemoData() {
  const today = new Date();
  const back = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };
  const batchA = 'demo-batch-a';
  const batchB = 'demo-batch-b';
  return {
    batches: [
      {
        id: batchA,
        name: 'Batch A - Broilers',
        date: back(28),
        count: 500,
        breed: 'Cobb 500',
        notes: 'House 1. Deep litter setup.',
        calendar: [
          { id: 'demo-log-1', date: back(26), notes: 'Newcastle vaccine administered', mortality: 5 },
          { id: 'demo-log-2', date: back(20), notes: 'Switched to grower feed', mortality: 3 },
          { id: 'demo-log-3', date: back(10), notes: 'Gumboro booster', mortality: 2 },
        ],
      },
      {
        id: batchB,
        name: 'Batch B - Layers',
        date: back(60),
        count: 300,
        breed: 'Isa Brown',
        notes: 'House 2. Layer cage system.',
        calendar: [
          { id: 'demo-log-4', date: back(50), notes: 'Deworming treatment', mortality: 4 },
          { id: 'demo-log-5', date: back(15), notes: 'Calcium supplement added', mortality: 1 },
        ],
      },
    ],
    sales: [
      { id: 'demo-sale-1', batchId: batchB, saleType: 'Tray', tags: ['Wholesale', 'Contract'], buyer: 'Hotel Kigali', datetime: `${back(5)}T10:30`, quantity: 40, price: 120000 },
      { id: 'demo-sale-2', batchId: batchB, saleType: 'Eggs', tags: ['Retail', 'Repeat Customer'], buyer: 'Eric', datetime: `${back(3)}T15:00`, quantity: 300, price: 45000 },
      { id: 'demo-sale-3', batchId: batchA, saleType: 'Manure', tags: ['Bulk', 'Cash'], buyer: 'Green Farm', datetime: `${back(2)}T09:00`, quantity: 50, price: 25000 },
      { id: 'demo-sale-4', batchId: '', saleType: 'Eggs', tags: ['Walk-in', 'Cash'], buyer: 'Market Walk-in', datetime: `${back(1)}T08:15`, quantity: 120, price: 18000 },
    ],
    expenses: [
      { id: 'demo-exp-1', date: back(27), category: 'Feed', tags: ['Recurring'], amount: 180000, batchId: batchA, desc: 'Starter feed - 10 bags' },
      { id: 'demo-exp-2', date: back(22), category: 'Vaccines', tags: ['Health'], amount: 35000, batchId: batchA, desc: 'Newcastle + Gumboro vaccines' },
      { id: 'demo-exp-3', date: back(18), category: 'Labor', tags: ['Operational'], amount: 60000, batchId: '', desc: 'Monthly worker salary' },
      { id: 'demo-exp-4', date: back(12), category: 'Utilities (Electricity/Water)', tags: ['Recurring'], amount: 15000, batchId: '', desc: 'Electricity bill' },
      { id: 'demo-exp-5', date: back(8), category: 'Feed', tags: ['Recurring'], amount: 95000, batchId: batchB, desc: 'Layer mash - 5 bags' },
      { id: 'demo-exp-6', date: back(4), category: 'Equipment', tags: ['Capital Asset'], amount: 42000, batchId: '', desc: 'New drinkers x6' },
    ],
  };
}
