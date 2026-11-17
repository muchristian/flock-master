// Pagination footer with range info and prev/next controls.
export default function Pagination({ total, start, pageSize, page, totalPages, onPrev, onNext }) {
  const shownStart = total === 0 ? 0 : start + 1;
  const shownEnd = Math.min(start + pageSize, total);
  return (
    <div className="table-pagination">
      <div className="table-pagination-info">
        Showing <strong>{shownStart}</strong>–<strong>{shownEnd}</strong> of <strong>{total}</strong>
      </div>
      <div className="table-pagination-actions">
        <button type="button" onClick={onPrev} disabled={page <= 1}>
          Prev
        </button>
        <span className="px-2">
          Page <strong>{page}</strong> / <strong>{totalPages}</strong>
        </span>
        <button type="button" onClick={onNext} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
