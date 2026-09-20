"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { searchAll, SearchResult } from "@/lib/globalSearch";
import { getErrorMessage } from "@/services/axiosInstance";
import { Role } from "@/types/user";

// Icon-triggered search for the role dashboards, matching the notification
// bell's interaction pattern: a plain icon button that opens a popover panel.
// Results update live as you type (debounced), grouped by type, and clicking
// one navigates straight to it - there's no submit step and no auto-navigate
// on a single match, since either would fight with typing (the query keeps
// changing underneath you as you go).
export function GlobalSearch({ role }: { role: Role }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close the panel when clicking outside it or pressing Escape.
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  // Autofocus the input as soon as the panel opens.
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Debounced live search - reruns a moment after typing settles. An empty
  // query needs no state reset here: the render below only shows results/
  // messages when there's a trimmed query, so stale state from a previous
  // search simply never renders once the box is cleared.
  //
  // `cancelled` guards against a slower, now-outdated request's response
  // landing after a newer one's - clearing the timeout alone only stops a
  // request that hasn't fired yet, not one already in flight.
  //
  // setIsSearching(true) lives inside the timeout callback rather than the
  // effect body itself so it's not a synchronous setState-in-effect call.
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchAll(role, trimmed);
        if (cancelled) return;
        setResults(found);
        setMessage(found.length === 0 ? "No matching results found." : null);
      } catch (err) {
        if (cancelled) return;
        setResults([]);
        setMessage(getErrorMessage(err));
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, role, isOpen]);

  function handleToggle() {
    setIsOpen((open) => {
      const next = !open;
      if (!next) {
        // Start fresh next time it's opened, same as the notification panel
        // re-fetching from scratch on each open.
        setQuery("");
        setResults([]);
        setMessage(null);
      }
      return next;
    });
  }

  function goTo(href: string) {
    setIsOpen(false);
    router.push(href);
  }

  // Preserve the declaration order of groups from globalSearch.ts. Gated on
  // a trimmed query so results/messages left over from a previous search
  // don't flash once the box is cleared back to empty.
  const hasQuery = query.trim().length > 0;
  const groups = hasQuery
    ? results.reduce<Array<{ name: string; items: SearchResult[] }>>((acc, result) => {
        const existing = acc.find((g) => g.name === result.group);
        if (existing) existing.items.push(result);
        else acc.push({ name: result.group, items: [result] });
        return acc;
      }, [])
    : [];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Search"
        className="rounded-full p-2 text-slate-600 transition-colors duration-200 hover:bg-slate-100"
      >
        <Search className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fade-in absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded border border-slate-100 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-3">
            <SearchInput
              ref={inputRef}
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {hasQuery && !isSearching && message && (
            <p className="px-4 py-6 text-center text-sm text-red-600">{message}</p>
          )}

          {groups.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {groups.map((group) => (
                <div key={group.name}>
                  <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.name}
                  </p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => goTo(item.href)}
                          className="flex w-full flex-col items-start px-4 py-2 text-left transition-colors duration-200 hover:bg-slate-50"
                        >
                          <span className="text-sm font-medium text-slate-900">{item.title}</span>
                          {item.subtitle && (
                            <span className="text-xs text-slate-500">{item.subtitle}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
