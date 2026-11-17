import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { expensesByCategory } from '../../lib/metrics.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Brand-led palette: teal → cyan → ink, with supporting hues for contrast.
const PALETTE = ['#1c9475', '#1fa0b5', '#177c62', '#3ab6cd', '#114e3f', '#0f0f0f', '#74d1b7', '#6fd4e4', '#146450', '#a8e5d1', '#8b9094', '#d9d9d9'];

export default function ExpenseChart({ expenses }) {
  const data = useMemo(() => {
    const rows = expensesByCategory(expenses);
    if (rows.length === 0) return null;
    return {
      labels: rows.map((r) => r[0]),
      datasets: [
        {
          data: rows.map((r) => r[1]),
          backgroundColor: rows.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 2,
          borderColor: 'var(--color-surface)',
        },
      ],
    };
  }, [expenses]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 12, font: { size: 10 }, color: 'var(--chart-text)' },
      },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.label}: ${Number(ctx.raw).toLocaleString()} RWF` },
      },
    },
  };

  if (!data) {
    return <div className="h-full flex items-center justify-center text-content-faint text-sm">No expense data yet.</div>;
  }
  return <Doughnut data={data} options={options} />;
}
