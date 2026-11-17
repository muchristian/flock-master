import { PAGE_SIZES } from '../../lib/constants.js';

// Rows-per-page + sort + direction controls shared by all ledger tables.
export default function TableToolbar({ pageSize, onPageSize, sortKey, onSortKey, sortDir, onToggleDir, sortOptions }) {
  return (
    <div className="table-toolbar">
      <div className="table-toolbar-group">
        <label className="flex items-center gap-1.5">
          Rows
          <select className="table-control" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-toolbar-group">
        <label className="flex items-center gap-1.5">
          Sort
          <select className="table-control" value={sortKey} onChange={(e) => onSortKey(e.target.value)}>
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="table-control table-direction"
          onClick={onToggleDir}
          title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
        >
          <i className={`fa-solid fa-arrow-${sortDir === 'asc' ? 'up' : 'down'} mr-1`} />
          {sortDir === 'asc' ? 'Asc' : 'Desc'}
        </button>
      </div>
    </div>
  );
}
