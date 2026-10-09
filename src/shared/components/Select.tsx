import { useEffect, useMemo, useRef, useState } from 'react';

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T extends string | number> {
  value: T | '';
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[] | SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  title?: string;
  invalid?: boolean;
}

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`h-4 w-4 text-ink-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg className="h-4 w-4 text-brand" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
      clipRule="evenodd"
    />
  </svg>
);

function Select<T extends string | number>({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className = '',
  name,
  title,
  invalid,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const enabledOptions = useMemo(() => options.filter((o) => !o.disabled), [options]);
  const selected = useMemo(
    () => options.find((o) => !o.disabled && o.value === value),
    [options, value],
  );

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const triggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      const idx = selected ? enabledOptions.findIndex((o) => o.value === selected.value) : -1;
      setHighlight(e.key === 'ArrowDown' ? (idx + 1) % enabledOptions.length : Math.max(idx - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open && highlight >= 0 && enabledOptions[highlight]) {
        onChange(enabledOptions[highlight].value);
        setOpen(false);
      } else {
        setOpen(!open);
      }
    }
  };

  const selectOption = (opt: SelectOption<T>) => {
    onChange(opt.value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        name={name}
        title={title}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={triggerKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm transition-colors ${
          open
            ? 'border-brand ring-2 ring-brand/20'
            : invalid
              ? 'border-error hover:border-error'
              : 'border-line hover:border-line-strong'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span className={`truncate ${selected ? 'text-ink-primary' : 'text-ink-muted'}`}>
          {selected ? selected.label : placeholder ?? 'Select…'}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg"
        >
          {enabledOptions.length === 0 && (
            <p className="px-3 py-2 text-sm text-ink-muted">No options</p>
          )}
          {enabledOptions.map((opt, i) => {
            const isSelected = opt.value === value;
            const isHighlighted = i === highlight;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => selectOption(opt)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  isHighlighted ? 'bg-brand-light' : ''
                } ${isSelected ? 'font-medium text-brand' : 'text-ink-primary'}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Select;