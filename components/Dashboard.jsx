"use client";

import { useEffect, useMemo, useState } from "react";

const SOURCE_COLORS = {
  HN_ShowHN: "bg-orange-100 text-orange-800",
  HN_AskHN: "bg-amber-100 text-amber-800",
  HN_LaunchHN: "bg-red-100 text-red-800",
  Zenn_個人開発: "bg-sky-100 text-sky-800",
  Qiita_個人開発: "bg-emerald-100 text-emerald-800",
};

function sourceClass(source) {
  if (SOURCE_COLORS[source]) return SOURCE_COLORS[source];
  if (source.startsWith("X_")) return "bg-zinc-900 text-white";
  if (source.startsWith("Reddit_")) return "bg-orange-200 text-orange-900";
  return "bg-zinc-200 text-zinc-800";
}

function scoreBadgeClass(score) {
  if (score >= 40) return "bg-emerald-500 text-white";
  if (score >= 30) return "bg-amber-500 text-white";
  return "bg-zinc-400 text-white";
}

function withinDateRange(runAt, filter) {
  if (filter === "all") return true;
  if (!runAt) return false;
  const ts = Date.parse(runAt);
  if (isNaN(ts)) return false;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  if (filter === "today") return now - ts < 1 * dayMs;
  if (filter === "yesterday") return now - ts < 2 * dayMs && now - ts >= 1 * dayMs;
  if (filter === "last7") return now - ts < 7 * dayMs;
  if (filter === "last30") return now - ts < 30 * dayMs;
  return true;
}

function toggleSetItem(set, key) {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState("last7");
  const [sourceFilter, setSourceFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const [hidden, setHidden] = useState(new Set());
  const [favorited, setFavorited] = useState(new Set());
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [showFavOnly, setShowFavOnly] = useState(false);

  useEffect(() => {
    try {
      const h = localStorage.getItem("hidden");
      const f = localStorage.getItem("favorited");
      if (h) setHidden(new Set(JSON.parse(h)));
      if (f) setFavorited(new Set(JSON.parse(f)));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("hidden", JSON.stringify(Array.from(hidden)));
    } catch (e) {}
  }, [hidden]);

  useEffect(() => {
    try {
      localStorage.setItem("favorited", JSON.stringify(Array.from(favorited)));
    } catch (e) {}
  }, [favorited]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/items");
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (!cancelled) {
          setItems(data.items || []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e && e.message) || "load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const allSources = useMemo(() => {
    const set = new Set();
    items.forEach((it) => set.add(it.source));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter((it) => withinDateRange(it.run_at, dateFilter))
      .filter((it) => !sourceFilter || it.source === sourceFilter)
      .filter((it) => {
        const isHidden = hidden.has(it.url);
        if (showHiddenOnly) return isHidden;
        return !isHidden;
      })
      .filter((it) => {
        if (!showFavOnly) return true;
        return favorited.has(it.url);
      })
      .filter((it) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          it.title.toLowerCase().includes(q) ||
          it.summary_jp.toLowerCase().includes(q) ||
          it.why_relevant_jp.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.total_score - a.total_score);
  }, [items, dateFilter, sourceFilter, search, hidden, favorited, showHiddenOnly, showFavOnly]);

  const dateButtons = [
    { key: "today", label: "今日" },
    { key: "yesterday", label: "昨日" },
    { key: "last7", label: "7日" },
    { key: "last30", label: "30日" },
    { key: "all", label: "全期間" },
  ];

  return (
    <div className="min-h-screen pb-24 bg-stone-50">
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">🛰 Solopreneur Radar</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {filtered.length}件 / 全{items.length}件
            {loading ? " (読み込み中...)" : ""}
          </p>
        </div>

        <div className="px-4 pb-2">
          <input
            type="search"
            placeholder="検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-100 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
          {dateButtons.map((b) => (
            <button
              key={b.key}
              onClick={() => setDateFilter(b.key)}
              className={
                "px-3 py-1 rounded-full text-xs whitespace-nowrap transition " +
                (dateFilter === b.key
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600")
              }
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSourceFilter(null)}
            className={
              "px-3 py-1 rounded-full text-xs whitespace-nowrap transition " +
              (sourceFilter === null
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600")
            }
          >
            すべて
          </button>
          {allSources.map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={
                "px-3 py-1 rounded-full text-xs whitespace-nowrap transition " +
                sourceClass(s) +
                (sourceFilter === s ? " ring-2 ring-offset-1 ring-blue-500" : " opacity-60")
              }
            >
              {s}
            </button>
          ))}
        </div>

        <div className="px-4 pb-2 flex gap-1.5">
          <button
            onClick={() => setShowFavOnly(!showFavOnly)}
            className={
              "px-3 py-1 rounded-full text-xs transition " +
              (showFavOnly
                ? "bg-pink-500 text-white"
                : "bg-zinc-100 text-zinc-600")
            }
          >
            ★ お気に入りのみ
          </button>
          <button
            onClick={() => setShowHiddenOnly(!showHiddenOnly)}
            className={
              "px-3 py-1 rounded-full text-xs transition " +
              (showHiddenOnly
                ? "bg-zinc-700 text-white"
                : "bg-zinc-100 text-zinc-600")
            }
          >
            🚫 却下済みのみ
          </button>
        </div>
      </header>

      <main className="px-3 py-3 max-w-2xl mx-auto">
        {error ? (
          <div className="p-4 mb-3 rounded-lg bg-red-50 text-red-800 text-sm">
            読み込みエラー: {error}
          </div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-12">
            {items.length === 0
              ? "データがありません"
              : "条件に合うアイテムがありません"}
          </div>
        ) : null}

        <ul className="space-y-2">
          {filtered.map((it) => {
            const isExpanded = expanded.has(it.url);
            const isFav = favorited.has(it.url);
            const isHidden = hidden.has(it.url);
            return (
              <li
                key={it.url}
                className={
                  "bg-white rounded-xl border border-zinc-200 overflow-hidden " +
                  (isHidden ? "opacity-50" : "")
                }
              >
                <div className="p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <span
                      className={
                        "flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold " +
                        scoreBadgeClass(it.total_score)
                      }
                    >
                      {it.total_score}
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-medium text-sm leading-snug text-blue-700 hover:underline break-words"
                      >
                        {it.title}
                      </a>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span
                          className={
                            "px-2 py-0.5 rounded-md text-xs font-medium " +
                            sourceClass(it.source)
                          }
                        >
                          {it.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  {it.summary_jp ? (
                    <p className="text-sm text-zinc-700 mt-1.5 leading-relaxed">
                      📝 {it.summary_jp}
                    </p>
                  ) : null}
                  {it.why_relevant_jp ? (
                    <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">
                      💡 {it.why_relevant_jp}
                    </p>
                  ) : null}

                  {isExpanded ? (
                    <div className="mt-3 grid grid-cols-3 gap-1.5 text-xs">
                      <div className="bg-zinc-50 rounded p-1.5 text-center">
                        <div className="text-zinc-500">Solo</div>
                        <div className="font-bold text-sm">{it.solo_operability}</div>
                      </div>
                      <div className="bg-zinc-50 rounded p-1.5 text-center">
                        <div className="text-zinc-500">AI</div>
                        <div className="font-bold text-sm">{it.ai_leverage}</div>
                      </div>
                      <div className="bg-zinc-50 rounded p-1.5 text-center">
                        <div className="text-zinc-500">Global</div>
                        <div className="font-bold text-sm">{it.global_potential}</div>
                      </div>
                      <div className="bg-zinc-50 rounded p-1.5 text-center">
                        <div className="text-zinc-500">Synergy</div>
                        <div className="font-bold text-sm">{it.synergy_with_existing}</div>
                      </div>
                      <div className="bg-zinc-50 rounded p-1.5 text-center">
                        <div className="text-zinc-500">Speed</div>
                        <div className="font-bold text-sm">{it.time_to_revenue}</div>
                      </div>
                      <div className="bg-zinc-50 rounded p-1.5 text-center">
                        <div className="text-zinc-500">Unit</div>
                        <div className="font-bold text-sm">{it.unit_economics}</div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center border-t border-zinc-100">
                  <button
                    onClick={() => setFavorited(toggleSetItem(favorited, it.url))}
                    className={
                      "flex-1 py-2.5 text-xs font-medium border-r border-zinc-100 transition " +
                      (isFav ? "text-pink-500" : "text-zinc-500 hover:text-pink-500")
                    }
                  >
                    {isFav ? "★ 保存中" : "☆ 保存"}
                  </button>
                  <button
                    onClick={() => setExpanded(toggleSetItem(expanded, it.url))}
                    className="flex-1 py-2.5 text-xs text-zinc-500 border-r border-zinc-100"
                  >
                    {isExpanded ? "▲ 閉じる" : "▼ 詳細"}
                  </button>
                  <button
                    onClick={() => setHidden(toggleSetItem(hidden, it.url))}
                    className={
                      "flex-1 py-2.5 text-xs transition " +
                      (isHidden
                        ? "text-zinc-700 font-medium"
                        : "text-zinc-500 hover:text-red-500")
                    }
                  >
                    {isHidden ? "↩︎ 復元" : "🚫 却下"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
