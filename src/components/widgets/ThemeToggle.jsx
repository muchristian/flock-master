import { useTheme } from '../../context/ThemeContext.jsx';

/**
 * Single theme switch (sun / moon segmented control).
 * Opaque surfaces only — readable in both light and dark.
 */
export default function ThemeToggle() {
  const { isDark, setTheme } = useTheme();

  const options = [
    { key: 'light', icon: 'fa-sun', label: 'Light' },
    { key: 'dark', icon: 'fa-moon', label: 'Dark' },
  ];

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex items-center rounded-xl border border-line-strong bg-surface-sunken p-0.5"
    >
      {options.map((opt) => {
        const active = (opt.key === 'dark') === isDark;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setTheme(opt.key)}
            aria-pressed={active}
            title={`${opt.label} theme`}
            aria-label={`${opt.label} theme`}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              active
                ? 'bg-surface text-emerald-600 shadow-sm border border-line'
                : 'text-content-faint hover:text-content'
            }`}
          >
            <i className={`fa-solid ${opt.icon} text-xs`} />
          </button>
        );
      })}
    </div>
  );
}
