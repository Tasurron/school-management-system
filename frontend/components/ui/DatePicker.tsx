"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  label?: string;
  error?: string;
  /** ISO "YYYY-MM-DD", or "" when nothing is selected. */
  value: string;
  onChange: (isoDate: string) => void;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseIso(iso: string): Date | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIso(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function formatDDMMYYYY(iso: string): string {
  const date = parseIso(iso);
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function DatePicker({ label, error, value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = parseIso(value);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  const isViewingCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function openPicker() {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
    setIsOpen(true);
  }

  function goToPreviousMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function selectDay(day: number) {
    onChange(toIso(viewYear, viewMonth, day));
    setIsOpen(false);
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={openPicker}
          className={`flex w-full items-center justify-between rounded border px-3 py-2.5 text-left text-sm shadow-sm transition-colors duration-200 ${
            error ? "border-red-400" : "border-slate-300"
          } ${value ? "text-slate-900" : "text-slate-400"}`}
        >
          {value ? formatDDMMYYYY(value) : "DD/MM/YYYY"}
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute z-20 mt-1 w-72 rounded border border-slate-200 bg-white p-3 shadow-lg fade-in">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={goToPreviousMonth}
                disabled={isViewingCurrentMonth}
                className="rounded-full p-1 text-slate-500 transition-transform duration-200 hover:scale-110 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-navy-800">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={goToNextMonth}
                className="rounded-full p-1 text-slate-500 transition-transform duration-200 hover:scale-110 hover:bg-slate-100"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`blank-${i}`} />;
                const isSelected =
                  selected &&
                  selected.getFullYear() === viewYear &&
                  selected.getMonth() === viewMonth &&
                  selected.getDate() === day;
                const isPast = new Date(viewYear, viewMonth, day) < todayStart;
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isPast}
                    onClick={() => selectDay(day)}
                    className={`rounded-full py-1.5 text-sm transition-colors duration-200 ${
                      isPast
                        ? "cursor-not-allowed text-slate-300"
                        : isSelected
                          ? "bg-primary-500 font-semibold text-navy-900"
                          : "text-slate-700 hover:bg-navy-50"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
