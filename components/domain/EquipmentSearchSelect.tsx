'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { Equipment } from '@/lib/types/domain';
import styles from './EquipmentSearchSelect.module.css';

export type EquipmentOption = Pick<Equipment, 'id' | 'tagNumber' | 'description'>;

function labelFor(e: EquipmentOption) {
  return `${e.tagNumber} — ${e.description}`;
}

function matchesQuery(e: EquipmentOption, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    e.tagNumber.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.id.toLowerCase().includes(q)
  );
}

export function EquipmentSearchSelect({
  equipment,
  name = 'equipmentId',
  defaultValue = '',
  required = true,
  placeholder = 'Search tag or description…',
}: {
  equipment: EquipmentOption[];
  name?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const listId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initial = equipment.find((e) => e.id === defaultValue) ?? null;
  const [selectedId, setSelectedId] = useState(initial?.id ?? '');
  const [query, setQuery] = useState(initial ? labelFor(initial) : '');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [touched, setTouched] = useState(false);

  const filtered = useMemo(
    () => equipment.filter((e) => matchesQuery(e, query)),
    [equipment, query],
  );

  useEffect(() => {
    function onDocPointer(ev: MouseEvent) {
      if (!rootRef.current?.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocPointer);
    return () => document.removeEventListener('mousedown', onDocPointer);
  }, []);

  useEffect(() => {
    if (!open) return;
    setHighlight((h) => (filtered.length ? Math.min(h, filtered.length - 1) : 0));
  }, [filtered.length, open]);

  function selectEquipment(e: EquipmentOption) {
    setSelectedId(e.id);
    setQuery(labelFor(e));
    setOpen(false);
    setTouched(true);
    inputRef.current?.setCustomValidity('');
  }

  function onQueryChange(value: string) {
    setQuery(value);
    setOpen(true);
    setTouched(true);
    // Clear selection if the typed text no longer matches the selected label.
    const selected = equipment.find((e) => e.id === selectedId);
    if (selected && value !== labelFor(selected)) {
      setSelectedId('');
    }
  }

  function onKeyDown(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (ev.key === 'Enter' && open && filtered[highlight]) {
      ev.preventDefault();
      selectEquipment(filtered[highlight]);
      return;
    }
    if (ev.key === 'Escape') {
      setOpen(false);
    }
  }

  const showError = required && touched && !selectedId && !open;

  return (
    <div className={styles.root} ref={rootRef}>
      <label className={styles.label} htmlFor={inputId}>
        <span>Equipment</span>
        <div className={styles.control}>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-invalid={showError || undefined}
            placeholder={placeholder}
            value={query}
            onChange={(ev) => onQueryChange(ev.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              // Delay so option click can register first.
              window.setTimeout(() => {
                if (!rootRef.current?.contains(document.activeElement)) {
                  setOpen(false);
                  setTouched(true);
                  if (required && !selectedId) {
                    inputRef.current?.setCustomValidity('Select equipment from the list.');
                  }
                }
              }, 0);
            }}
            className={styles.input}
          />
          <input
            type="hidden"
            name={name}
            value={selectedId}
            required={required}
            onInvalid={(ev) => {
              ev.currentTarget.setCustomValidity(
                selectedId ? '' : 'Select equipment from the list.',
              );
            }}
            onChange={() => {
              /* controlled via state */
            }}
          />
          <span className={styles.chevron} aria-hidden="true">
            ▾
          </span>
        </div>
      </label>

      {open ? (
        <ul id={listId} role="listbox" className={styles.list}>
          {filtered.length === 0 ? (
            <li className={styles.empty} role="presentation">
              No equipment matches “{query.trim() || '…'}”
            </li>
          ) : (
            filtered.map((e, index) => {
              const active = index === highlight;
              const selected = e.id === selectedId;
              return (
                <li key={e.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={`${styles.option}${active ? ` ${styles.optionActive}` : ''}${
                      selected ? ` ${styles.optionSelected}` : ''
                    }`}
                    onMouseEnter={() => setHighlight(index)}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      selectEquipment(e);
                    }}
                  >
                    <span className={styles.tag}>{e.tagNumber}</span>
                    <span className={styles.desc}>{e.description}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {showError ? (
        <p className={styles.error} role="alert">
          Select equipment from the list.
        </p>
      ) : (
        <p className={styles.hint}>Type to filter by tag number or description.</p>
      )}
    </div>
  );
}
