'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import 'react-day-picker/src/style.css';

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
  className?: string;
  openDirection?: 'down' | 'up';
}

export function DatePicker({ value, onChange, placeholder = 'Select date', className = '', openDirection = 'down' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : undefined;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    }
    setIsOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const dropdownPosition = openDirection === 'up'
    ? 'absolute z-50 bottom-full mb-2'
    : 'absolute z-50 mt-2';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all duration-200 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 flex-1 focus:outline-none"
        >
          <Calendar className="w-5 h-5 text-indigo-500" />
          <span className={value ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}>
            {value ? format(parseISO(value), 'MMM d, yyyy') : placeholder}
          </span>
        </button>
        {value && (
          <button
            type="button"
            onClick={clearDate}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={`${dropdownPosition} p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-200`}>
          <style>{`
            .rdp-root {
              --rdp-accent-color: #6366f1;
              --rdp-accent-background-color: #eef2ff;
              --rdp-day-height: 40px;
              --rdp-day-width: 40px;
              --rdp-day_button-height: 38px;
              --rdp-day_button-width: 38px;
              --rdp-today-color: #6366f1;
              margin: 0;
              color: #334155;
              font-size: 14px;
            }
            .dark .rdp-root {
              --rdp-accent-background-color: #312e81;
              color: #e2e8f0;
            }
            .rdp-caption_label {
              font-weight: 600;
              color: #334155;
              font-size: 15px;
            }
            .dark .rdp-caption_label {
              color: #f1f5f9;
            }
            .rdp-weekday {
              color: #64748b;
              font-weight: 500;
              font-size: 13px;
            }
            .dark .rdp-weekday {
              color: #94a3b8;
            }
            .rdp-day_button {
              color: inherit;
            }
            .rdp-day_button:hover:not([disabled]) {
              background-color: #eef2ff;
              border-radius: 50%;
            }
            .dark .rdp-day_button:hover:not([disabled]) {
              background-color: #312e81;
            }
            .rdp-selected .rdp-day_button {
              background-color: #6366f1;
              color: white;
              border-radius: 50%;
            }
            .rdp-today:not(.rdp-selected) .rdp-day_button {
              font-weight: bold;
              color: #6366f1;
            }
            .dark .rdp-today:not(.rdp-selected) .rdp-day_button {
              color: #818cf8;
            }
            .rdp-button_next,
            .rdp-button_previous {
              color: #6366f1;
              border-radius: 8px;
            }
            .dark .rdp-button_next,
            .dark .rdp-button_previous {
              color: #a5b4fc;
            }
            .rdp-button_next:hover,
            .rdp-button_previous:hover {
              background-color: #eef2ff;
            }
            .dark .rdp-button_next:hover,
            .dark .rdp-button_previous:hover {
              background-color: #312e81;
            }
            .rdp-outside .rdp-day_button {
              opacity: 0.4;
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            showOutsideDays
            fixedWeeks
          />
        </div>
      )}
    </div>
  );
}
