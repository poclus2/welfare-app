"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { ArrowDownAZ, ArrowUpAZ, CalendarClock, CalendarDays, Loader2 } from "lucide-react";

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentOrder = searchParams.get("order") || "-created_at";
  const currentStatus = searchParams.get("status") || "all";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || !value) {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      params.delete("offset"); // Reset pagination on filter/sort
      return params.toString();
    },
    [searchParams]
  );

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    startTransition(() => {
      router.push(`?${createQueryString("order", e.target.value)}`);
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    startTransition(() => {
      router.push(`?${createQueryString("status", e.target.value)}`);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status / Stock Filter */}
      <div className="relative">
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          disabled={isPending}
          className="appearance-none bg-[#F9F7F5] border border-[#EDE0E0] text-[#2A2424] text-xs font-semibold rounded-lg pl-3 pr-8 py-2 outline-none focus:border-[#2A2424] transition-colors disabled:opacity-50"
        >
          <option value="all">Tous les statuts</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
          <option value="negative_stock">Stock Négatif</option>
          <option value="low_stock">Stock Faible ({`<`} 10)</option>
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#2A2424]/40">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <select
          value={currentOrder}
          onChange={handleOrderChange}
          disabled={isPending}
          className="appearance-none bg-[#F9F7F5] border border-[#EDE0E0] text-[#2A2424] text-xs font-semibold rounded-lg pl-8 pr-8 py-2 outline-none focus:border-[#2A2424] transition-colors disabled:opacity-50 min-w-[160px]"
        >
          <option value="-created_at">Plus récents d'abord</option>
          <option value="created_at">Plus anciens d'abord</option>
          <option value="title">Alphabétique (A-Z)</option>
          <option value="-title">Alphabétique (Z-A)</option>
          <option value="-updated_at">Dernière modification</option>
        </select>
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#2A2424]/40">
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : currentOrder === "-created_at" ? (
            <CalendarClock className="w-3.5 h-3.5" />
          ) : currentOrder === "created_at" ? (
            <CalendarDays className="w-3.5 h-3.5" />
          ) : currentOrder === "title" ? (
            <ArrowDownAZ className="w-3.5 h-3.5" />
          ) : currentOrder === "-title" ? (
            <ArrowUpAZ className="w-3.5 h-3.5" />
          ) : (
            <CalendarClock className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#2A2424]/40">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
