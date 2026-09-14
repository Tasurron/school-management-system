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
// Inside the panel it still behaves like the landing page's "search this
// page" box - nothing happens while typing, the search runs on submit (Enter
// or the icon), and a miss shows a small red message. Because a dashboard can
// have many hits across users/classes/assignments/etc, multiple matches are
// listed grouped by type; a single match jumps straight to it.
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setMessage(null);
    try {
      const found = await searchAll(role, query);
      if (found.length === 0) {
        setResults([]);
        setMessage("No matching results found.");
      } else if (found.length === 1) {
        goTo(found[0].href);
      } else {
        setResults(found);
      }
    } catch (err) {
      setResults([]);
      setMessage(getErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  }

  // Preserve the declaration order of groups from globalSearch.ts.
  const groups = results.reduce<Array<{ name: string; items: SearchResult[] }>>((acc, result) => {
    const existing = acc.find((g) => g.name === result.group);
    if (existing) existing.items.push(result);
    else acc.push({ name: result.group, items: [result] });
    return acc;
  }, []);

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
          <form onSubmit={handleSearch} className="border-b border-slate-100 p-3">
            <SearchInput
              ref={inputRef}
              submittable
              placeholder="Search..."
              value={query}
              disabled={isSearching}
              onChange={(e) => {
                setQuery(e.target.value);
                setMessage(null);
                setResults([]);
              }}
            />
          </form>

          {message && <p className="px-4 py-6 text-center text-sm text-red-600">{message}</p>}

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
