// Chip-style multi-select for tags. Plain click toggles a tag.
export default function TagPicker({ options, value = [], onChange, emptyText = 'No tags selected.' }) {
  const toggle = (tag) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((tag) => {
          const on = value.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              aria-pressed={on}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                on
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-line bg-surface-sunken text-content-muted hover:border-emerald-500 hover:text-content'
              }`}
            >
              {on ? <i className="fa-solid fa-check mr-1 text-[9px]" /> : null}
              {tag}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-content-faint">
        {value.length === 0 ? emptyText : `Selected: ${value.join(', ')}`}
      </p>
    </div>
  );
}
