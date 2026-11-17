// Pure helper functions for dates, formatting, filtering and pagination.

export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function nowLocalDatetime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export function formatMoney(value) {
  const n = Number(value) || 0;
  return `${n.toLocaleString('en-US')} RWF`;
}

export function formatNumber(value) {
  return (Number(value) || 0).toLocaleString('en-US');
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return String(dateStr).slice(0, 10);
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  // datetime-local value "2026-01-01T14:30"
  const s = String(dateStr).replace('T', ' ');
  return s.length >= 16 ? s.slice(0, 16) : s;
}

// Days between an arrival date and today (never negative).
export function daysSince(dateStr) {
  if (!dateStr) return 0;
  const start = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  const diff = Math.floor((now.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / 86400000);
  return Math.max(0, diff);
}

// Poultry-style age notation: full weeks plus the day inside the current week.
// Day parts always run 1..7, so the label is always "W.1" through "W.7".
//   day 0  -> 0.1   (arrival day, week 0 day 1)
//   day 6  -> 0.7   (end of week 0)
//   day 7  -> 1.1   (start of week 1)
//   day 28 -> 4.1   (start of week 4)
export function batchAge(dateStr) {
  const days = daysSince(dateStr);
  const weeks = Math.floor(days / 7);
  const day = (days % 7) + 1; // 1..7
  return {
    days,
    weeks,
    day,
    label: `${weeks}.${day}`,
    dayLabel: `${weeks}w ${day}d`,
  };
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Preset date-range calculation. Returns { from, to } as ISO date strings or empty.
export function presetRange(preset) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (preset === 'today') {
    const t = iso(now);
    return { from: t, to: t };
  }
  if (preset === 'week') {
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    return { from: iso(monday), to: iso(now) };
  }
  if (preset === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: iso(first), to: iso(now) };
  }
  return { from: '', to: '' };
}

// Filter rows by an inclusive date range (works on row.date or row.datetime).
export function inDateRange(rowValue, from, to) {
  if (!from && !to) return true;
  const value = String(rowValue || '').slice(0, 10);
  if (!value) return false;
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

// Generic sort + paginate for a set of rows.
export function sortAndPaginate(rows, { sortKey, sortDir, page, pageSize }) {
  const sorted = [...rows];
  if (sortKey) {
    sorted.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        av = av.toLowerCase();
        bv = bv.toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);
  return { pageRows, total, totalPages, page: safePage, start };
}
