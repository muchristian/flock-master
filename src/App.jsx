import { useCallback, useMemo, useState } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import MobileHeader from './components/layout/MobileHeader.jsx';
import TopHeader from './components/layout/TopHeader.jsx';
import DashboardView from './components/screens/DashboardView.jsx';
import AllSalesView from './components/screens/AllSalesView.jsx';
import AllExpensesView from './components/screens/AllExpensesView.jsx';
import BatchOverviewView from './components/screens/BatchOverviewView.jsx';
import BackupView from './components/screens/BackupView.jsx';
import CreateBatchModal from './components/modals/CreateBatchModal.jsx';
import LogExpenseModal from './components/modals/LogExpenseModal.jsx';
import LogSaleModal from './components/modals/LogSaleModal.jsx';
import EditRecordModal from './components/modals/EditRecordModal.jsx';
import PwaPrompts from './components/widgets/PwaPrompts.jsx';

const PAGE_META = {
  dashboard: { breadcrumb: 'Global Overview', title: 'Farm Dashboard' },
  'all-sales': { breadcrumb: 'Global Ledger', title: 'All Farm Sales' },
  'all-expenses': { breadcrumb: 'Global Ledger', title: 'All Farm Expenses' },
  backup: { breadcrumb: 'System', title: 'Data Backup & JSON' },
  'batch-overview': { breadcrumb: 'Flock Batch', title: 'Batch Overview' },
};

function Shell() {
  const farm = useFarm();
  const { farmData } = farm;

  const [view, setView] = useState('dashboard');
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal state
  const [createBatchOpen, setCreateBatchOpen] = useState(false);
  const [expenseModal, setExpenseModal] = useState({ open: false, batchId: '' });
  const [saleModal, setSaleModal] = useState({ open: false, batchId: '' });
  const [editState, setEditState] = useState({ open: false, type: null, record: null });

  const activeBatch = useMemo(
    () => farmData.batches.find((b) => b.id === activeBatchId) || null,
    [farmData.batches, activeBatchId]
  );

  const navigate = useCallback((nextView, batchId) => {
    setView(nextView);
    if (batchId) setActiveBatchId(batchId);
    setSidebarOpen(false);
  }, []);

  const handleEdit = (type, record) => setEditState({ open: true, type, record });

  const handleDelete = (type, id) => {
    farm.removeRecord(type, id);
  };

  const handleDeleteBatch = (batchId) => {
    if (window.confirm('Delete this batch and all its tagged sales and expenses?')) {
      farm.deleteBatch(batchId);
      setView('dashboard');
      setActiveBatchId(null);
    }
  };

  const meta = PAGE_META[view] || PAGE_META.dashboard;

  // Storage descriptor passed to screens that surface persistence info.
  const storage = {
    isConnected: farm.isConnected,
    supportsDirectoryPicker: farm.supportsDirectoryPicker,
    backendLabel: farm.backendLabel,
    isInDocuments: farm.isInDocuments,
    isDiskBackend: farm.isDiskBackend,
    getLocation: farm.getLocation,
    onSaveToDocuments: farm.connectFolder,
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <DashboardView
            farmData={farmData}
            storage={storage}
            onRecordSale={() => setSaleModal({ open: true, batchId: '' })}
          />
        );
      case 'all-sales':
        return (
          <AllSalesView
            farmData={farmData}
            onAddSale={() => setSaleModal({ open: true, batchId: '' })}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        );
      case 'all-expenses':
        return (
          <AllExpensesView
            farmData={farmData}
            onAddExpense={() => setExpenseModal({ open: true, batchId: '' })}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        );
      case 'backup':
        return (
          <BackupView
            storageStatus={farm.storageStatus}
            isConnected={farm.isConnected}
            supportsDirectoryPicker={farm.supportsDirectoryPicker}
            supportsOpfs={farm.supportsOpfs}
            backendLabel={farm.backendLabel}
            getLocation={farm.getLocation}
            onConnectFolder={farm.connectFolder}
            onExport={farm.exportJSON}
            onImport={farm.importJSON}
          />
        );
      case 'batch-overview':
        if (!activeBatch) {
          return (
            <div className="card p-10 text-center text-content-faint">
              <i className="fa-solid fa-feather mb-3 block text-2xl" />
              Select a batch from the sidebar.
            </div>
          );
        }
        return (
          <BatchOverviewView
            batch={activeBatch}
            farmData={farmData}
            onDeleteBatch={handleDeleteBatch}
            onAddLog={farm.addLogEntry}
            onEditLog={(log) => handleEdit('log', log)}
            onDeleteLog={(id) => farm.removeRecord('log', id)}
          />
        );
      default:
        return <DashboardView farmData={farmData} storage={storage} />;
    }
  };

  return (
    <div className="h-full bg-app text-content flex flex-col md:flex-row overflow-hidden">
      <MobileHeader onToggleMenu={() => setSidebarOpen((o) => !o)} />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        view={view}
        onNavigate={navigate}
        batches={farmData.batches}
        activeBatchId={activeBatchId}
        onCreateBatch={() => setCreateBatchOpen(true)}
        storage={storage}
      />

      <main className="flex-1 flex flex-col overflow-y-auto bg-app custom-scrollbar relative">
        <TopHeader
          breadcrumb={meta.breadcrumb}
          title={activeBatch && view === 'batch-overview' ? `${meta.title} — ${activeBatch.name}` : meta.title}
          onLogExpense={() => setExpenseModal({ open: true, batchId: '' })}
          onRecordSale={() => setSaleModal({ open: true, batchId: '' })}
          onLoadDemo={farm.loadDemoData}
        />

        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">{renderView()}</div>
      </main>

      {/* Modals */}
      <CreateBatchModal
        open={createBatchOpen}
        onClose={() => setCreateBatchOpen(false)}
        onCreate={(form) => {
          const batch = farm.createBatch(form);
          navigate('batch-overview', batch.id);
        }}
      />
      <LogExpenseModal
        open={expenseModal.open}
        defaultBatchId={expenseModal.batchId}
        onClose={() => setExpenseModal({ open: false, batchId: '' })}
        onSave={farm.addExpense}
        batches={farmData.batches}
      />
      <LogSaleModal
        open={saleModal.open}
        defaultBatchId={saleModal.batchId}
        onClose={() => setSaleModal({ open: false, batchId: '' })}
        onSave={farm.addSale}
        batches={farmData.batches}
      />
      <EditRecordModal
        open={editState.open}
        editing={editState.open ? { type: editState.type, record: editState.record } : null}
        onClose={() => setEditState({ open: false, type: null, record: null })}
        onSave={farm.updateRecord}
        batches={farmData.batches}
      />

      <PwaPrompts />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FarmProvider>
        <Shell />
      </FarmProvider>
    </ThemeProvider>
  );
}
