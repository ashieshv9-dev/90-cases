"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CaseRecord = {
  id: number;
  customerName: string;
  loanRefNo: string;
  address: string;
  fosName: string;
  totalEmiAmountDue: string;
  duesOutstanding: string;
  totalOutstanding: string;
  disbursementDate: string;
};

type SearchPayload = {
  items: CaseRecord[];
  stats: {
    total: number;
    lastUploadAt: string | null;
  };
};

const cacheKey = "90-cases:last-search";

export function Dashboard() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CaseRecord[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [lastUploadAt, setLastUploadAt] = useState<string | null>(null);
  const [status, setStatus] = useState("Search by name or loan ref number.");
  const [isSearching, setIsSearching] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    const cached = window.localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const payload = JSON.parse(cached) as SearchPayload;
        setItems(payload.items);
        setTotal(payload.stats.total);
        setLastUploadAt(payload.stats.lastUploadAt);
      } catch {
        window.localStorage.removeItem(cacheKey);
      }
    }

    void runSearch("");

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  const uploadLabel = useMemo(() => {
    if (!lastUploadAt) {
      return "No upload yet";
    }

    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(lastUploadAt));
  }, [lastUploadAt]);

  async function runSearch(nextQuery = query) {
    if (!navigator.onLine) {
      setStatus("Offline. Showing cached results.");
      return;
    }

    setIsSearching(true);
    setStatus(nextQuery.trim() ? "Searching cases..." : "Ready for search.");

    const response = await fetch(`/api/cases/search?q=${encodeURIComponent(nextQuery)}`, {
      cache: "no-store"
    });

    setIsSearching(false);

    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }

    if (!response.ok) {
      setStatus("Search failed. Please try again.");
      return;
    }

    const payload = (await response.json()) as SearchPayload;
    setItems(payload.items);
    setTotal(payload.stats.total);
    setLastUploadAt(payload.stats.lastUploadAt);
    window.localStorage.setItem(cacheKey, JSON.stringify(payload));

    if (!nextQuery.trim()) {
      setStatus("Search by name or loan ref number.");
    } else if (!payload.items.length) {
      setStatus("No matching cases found.");
    } else {
      setStatus(`${payload.items.length} result${payload.items.length === 1 ? "" : "s"} found.`);
    }
  }

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <main className="safe-bottom min-h-dvh px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-leaf">
              90+ Cases
            </p>
            <h1 className="text-3xl font-bold text-ink">Case dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Link
              className="flex-1 rounded-md border border-line bg-white px-4 py-2 text-center text-sm font-semibold text-ink shadow-sm sm:flex-none"
              href="/admin"
            >
              Upload
            </Link>
            <button
              className="flex-1 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm sm:flex-none"
              type="button"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onSearch}>
            <label className="sr-only" htmlFor="search">
              Search cases
            </label>
            <input
              className="min-h-12 flex-1 rounded-md border border-line bg-paper px-4 py-3 text-base font-semibold text-ink placeholder:text-slate-500"
              id="search"
              placeholder="Loan ref no or customer name"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="min-h-12 rounded-md bg-leaf px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSearching}
              type="submit"
            >
              {isSearching ? "Searching" : "Search"}
            </button>
          </form>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <Metric label="Records" value={total === null ? "..." : total.toLocaleString("en-IN")} />
            <Metric label="Last upload" value={uploadLabel} />
            <Metric label="Network" value={isOnline ? "Online" : "Offline"} tone={isOnline ? "leaf" : "coral"} />
          </div>
        </section>

        <p className="text-sm font-semibold text-slate-700">{status}</p>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <CaseCard key={item.id} item={item} />
          ))}
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "ink"
}: {
  label: string;
  value: string;
  tone?: "ink" | "leaf" | "coral";
}) {
  const toneClass = tone === "leaf" ? "text-leaf" : tone === "coral" ? "text-coral" : "text-ink";

  return (
    <div className="rounded-md bg-paper px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-1 break-words text-base font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function CaseCard({ item }: { item: CaseRecord }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">{item.customerName || "Unnamed customer"}</h2>
          <p className="mt-1 text-sm font-semibold text-leaf">{item.loanRefNo || "No loan ref"}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <Info label="Address" value={item.address} wide />
        <Info label="FOS Name" value={item.fosName} />
        <Info label="Total EMI Amount Due" value={item.totalEmiAmountDue} />
        <Info label="Dues Outstanding" value={item.duesOutstanding} />
        <Info label="Total Outstanding" value={item.totalOutstanding} />
        <Info label="Disbursement Date" value={item.disbursementDate} />
      </dl>
    </article>
  );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-base font-semibold text-ink">{value || "-"}</dd>
    </div>
  );
}
