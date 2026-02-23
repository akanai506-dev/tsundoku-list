"use client";

import { useState } from "react";

interface Props {
  onAdd: (article: { url: string; title: string; summary: string; tags: string[] }) => void;
}

export default function AddArticle({ onAdd }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isWarning, setIsWarning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setIsWarning(false);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "要約に失敗しました");
      }

      const data = await res.json();
      onAdd({ url: url.trim(), title: data.title, summary: data.summary, tags: data.tags });
      setUrl("");
      if (data.fallback) {
        setIsWarning(true);
        setError("記事の取得またはAI要約に失敗したため、簡易情報で保存しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="記事のURLをペースト..."
          required
          className="flex-1 px-4 py-3 rounded-lg border border-stone-300 bg-white font-sans text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-6 py-3 rounded-lg bg-dark-brown text-cream font-sans text-sm font-medium hover:bg-dark-brown/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              要約中...
            </span>
          ) : (
            "追加"
          )}
        </button>
      </div>
      {error && (
        <p className={`mt-2 text-sm ${isWarning ? "text-amber-600" : "text-red-600"}`}>{error}</p>
      )}
    </form>
  );
}
