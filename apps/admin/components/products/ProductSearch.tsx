"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useEffect, useRef, useTransition } from "react";

export function ProductSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  // Only what the admin typed may change the URL. Without this, any other navigation (page change,
  // browser Back, return from the edit page) made the stale text in the box push itself back into
  // the URL and reset the pagination.
  const typed = useRef(false);

  // The URL changed by itself (Back, pager, filter): the box follows it
  useEffect(() => {
    if (typed.current) return; // the admin is still typing: never overwrite their text
    setQuery(initialQuery);
  }, [initialQuery]);

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  useEffect(() => {
    if (!typed.current) return;
    const handler = setTimeout(() => {
      typed.current = false;
      startTransition(() => {
        const params = new URLSearchParams(searchParamsRef.current.toString());
        if (query) params.set("q", query);
        else params.delete("q");
        params.delete("offset"); // a new search starts at page 1
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [query, pathname, router]);

  const update = (value: string) => {
    typed.current = true;
    setQuery(value);
  };

  return (
    <div className="flex-1 relative">
      <div className="flex items-center gap-2 bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl px-3 py-2.5 focus-within:border-[#C08A8E] focus-within:ring-2 focus-within:ring-[#F4EAEB] transition-all">
        <Search className={`w-4 h-4 shrink-0 transition-colors ${isPending ? 'text-[#C08A8E] animate-pulse' : 'text-[#2A2424]/30'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => update(e.target.value)}
          placeholder="Rechercher par nom, marque..."
          className="flex-1 text-sm text-[#2A2424] bg-transparent outline-none placeholder:text-[#2A2424]/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => update("")}
            className="text-[#2A2424]/30 hover:text-[#2A2424] px-1"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
