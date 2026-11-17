// Derived calculations for batches, dashboard totals and charts.
import { batchAge } from './helpers.js';
import { ALL_BATCHES } from './constants.js';

// Sum of expenses tagged directly to a single batch (excluding All-Batches splits).
export function expenseTotal(batchId, expenses) {
  return expenses
    .filter((e) => e.batchId === batchId)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

// An "All Batches" expense is split evenly across every batch.
// Returns the per-batch share of each All-Batches expense.
export function allBatchesShare(batchCount) {
  if (!batchCount || batchCount <= 0) return 0;
  return 1 / batchCount;
}

export function salesForBatch(batchId, sales) {
  return sales.filter((s) => s.batchId === batchId);
}

export function batchMetrics(batch, { sales, expenses, batches }) {
  const initial = Number(batch.count) || 0;
  const mortality = (batch.calendar || []).reduce((sum, c) => sum + (Number(c.mortality) || 0), 0);
  const live = Math.max(0, initial - mortality);
  const mortalityRate = initial > 0 ? (mortality / initial) * 100 : 0;
  const batchSales = salesForBatch(batch.id, sales);
  const revenue = batchSales.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const salesCount = batchSales.length;
  const soldCount = batchSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

  // Direct (batch-tagged) expenses.
  const directExpenses = expenseTotal(batch.id, expenses);
  // Share of "All Batches" expenses split evenly across every batch.
  const batchCount = Array.isArray(batches) ? batches.length : 0;
  const splitPool = expenses
    .filter((e) => e.batchId === ALL_BATCHES)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const splitExpenses = batchCount > 0 ? splitPool / batchCount : 0;
  const taggedExpenses = directExpenses + splitExpenses;

  const netProfit = revenue - taggedExpenses;
  const age = batchAge(batch.date);
  return {
    initial,
    mortality,
    live,
    mortalityRate,
    revenue,
    salesCount,
    soldCount,
    directExpenses,
    splitExpenses,
    taggedExpenses,
    netProfit,
    ageDays: age.days,
    ageWeeks: age.weeks,
    ageLabel: age.label,       // "4.3"
    ageDayLabel: age.dayLabel, // "4w 3d"
  };
}

export function dashboardTotals({ batches, sales, expenses }) {
  const totalFlock = batches.reduce((sum, b) => sum + batchMetrics(b, { sales, expenses, batches }).live, 0);
  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  return {
    totalFlock,
    activeBatches: batches.length,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
  };
}

// Aggregate expenses by category for the pie/doughnut chart.
export function expensesByCategory(expenses) {
  const map = new Map();
  expenses.forEach((e) => {
    const key = e.category || 'Other';
    map.set(key, (map.get(key) || 0) + (Number(e.amount) || 0));
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

// Live birds per batch for the bar chart.
export function liveByBatch(batches, { sales, expenses }) {
  return batches.map((b) => ({
    name: b.name,
    live: batchMetrics(b, { sales, expenses, batches }).live,
  }));
}

// Recent activity stream combining sales, expenses and log entries.
export function recentActivity({ batches, sales, expenses }, limit = 8) {
  const items = [];
  sales.forEach((s) =>
    items.push({
      id: `sale-${s.id}`,
      when: s.datetime,
      type: 'sale',
      text: `Sale of ${s.quantity} ${s.saleType || 'Eggs'} to ${s.buyer}${
        (s.tags || []).length ? ` · ${s.tags.join(', ')}` : ''
      }`,
      amount: Number(s.price) || 0,
    })
  );
  expenses.forEach((e) =>
    items.push({
      id: `exp-${e.id}`,
      when: e.date,
      type: 'expense',
      text: `${e.category}: ${e.desc}`,
      amount: -(Number(e.amount) || 0),
    })
  );
  batches.forEach((b) =>
    (b.calendar || []).forEach((c) =>
      items.push({
        id: `log-${c.id}`,
        when: c.date,
        type: 'log',
        text: `${b.name}: ${c.notes || 'Activity recorded'}${
          c.mortality ? ` (mortality ${c.mortality})` : ''
        }`,
        amount: 0,
      })
    )
  );
  return items.sort((a, b) => String(b.when).localeCompare(String(a.when))).slice(0, limit);
}
