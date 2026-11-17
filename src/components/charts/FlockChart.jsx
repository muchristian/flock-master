import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { liveByBatch } from '../../lib/metrics.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function FlockChart({ batches, sales, expenses }) {
  const data = useMemo(() => {
    const rows = liveByBatch(batches, { sales, expenses });
    return {
      labels: rows.map((r) => r.name),
      datasets: [
        {
          label: 'Live Birds',
          data: rows.map((r) => r.live),
          backgroundColor: '#1c9475',
          hoverBackgroundColor: '#1fa0b5',
          borderRadius: 6,
          maxBarThickness: 56,
        },
      ],
    };
  }, [batches, sales, expenses]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${Number(ctx.raw).toLocaleString()} birds` },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'var(--chart-text)' },
        grid: { color: 'var(--chart-grid)' },
      },
      x: {
        ticks: { color: 'var(--chart-text)' },
        grid: { display: false },
      },
    },
  };

  if (batches.length === 0) {
    return <div className="h-full flex items-center justify-center text-content-faint text-sm">No batches yet.</div>;
  }
  return <Bar data={data} options={options} />;
}
