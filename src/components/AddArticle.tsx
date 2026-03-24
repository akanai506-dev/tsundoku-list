"use client";

import { useState } from "react";

interface Props {
  onAdd: (article: { url: string; title: string; summary: string; tags: string[] }) => void;
}

type InputMode = "url" | "text";

export default function AddArticle({ onAdd }: Props) {
  const [mode, setMode] = useState<InputMode>("url");

  // URL モード
  const [url, setUrl] = useState("");

  // テキストモード
  const [pastedText, setPastedText] = useState("");
  const [textUrl, setTextUrl] = useState("");
  const [textTitle, setTextTitle] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isWarning, setIsWarning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsWarning(false);

    try {
      let body: Record<string, string>;

      if (mode === "url") {
        if (!url.trim()) return;
        body = { url: url.trim() };
      } else {
        if (!pastedText.trim()) return;
        body = { text: pastedText.trim() };
        if (textUrl.trim()) body.url = textUrl.trim();
        if (textTitle.trim()) body.title = textTitle.trim();
      }

      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "要約に失敗しました");
      }

      const data = await res.json();
      const finalUrl = mode === "url" ? url.trim() : (textUrl.trim() || "");
      onAdd({ url: finalUrl, title: data.title, summary: data.summary, tags: data.tags });

      // リセット
      if (mode === "url") {
        setUrl("");
      } else {
        setPastedText("");
        setTextUrl("");
        setTextTitle("");
      }

      if (data.fallback) {
        setIsWarning(true);
        setError("AI要約に失敗したため、簡易情報で保存しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
    loading ||
    (mode === "url" ? !url.trim() : pastedText.trim().length < 50);

  return (
    <div className="mb-8">
      {/* モード切り替えタブ */}
      <div className="flex gap-1 mb-3 bg-stone-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => { setMode("url"); setError(""); }}
          className={`px-4 py-1.5 rounded-md text-xs font-sans font-medium transition-all ${
            mode === "url"
              ? "bg-white text-dark-brown shadow-sm"
              : "text-dark-brown/50 hover:text-dark-brown/70"
          }`}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => { setMode("text"); setError(""); }}
          className={`px-4 py-1.5 rounded-md text-xs font-sans font-medium transition-all ${
            mode === "text"
              ? "bg-white text-dark-brown shadow-sm"
              : "text-dark-brown/50 hover:text-dark-brown/70"
          }`}
        >
          テキスト貼り付け
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === "url" ? (
          /* ── URL モード ── */
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
            <SubmitButton loading={loading} disabled={isSubmitDisabled} />
          </div>
        ) : (
          /* ── テキストモード ── */
          <div className="space-y-3">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="記事の本文をここにコピペしてください（X/Twitter・noteなどURLで取得できない場合）..."
              className="w-full px-4 py-3 rounded-lg border border-stone-300 bg-white font-sans text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 resize-y min-h-[120px]"
              disabled={loading}
            />
            <div className="flex gap-2">
              <input
                type="url"
                value={textUrl}
                onChange={(e) => setTextUrl(e.target.value)}
                placeholder="URL（任意・参照用）"
                className="flex-1 px-3 py-2.5 rounded-lg border border-stone-300 bg-white font-sans text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                disabled={loading}
              />
              <input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="タイトル（任意）"
                className="flex-1 px-3 py-2.5 rounded-lg border border-stone-300 bg-white font-sans text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-sans ${pastedText.length < 50 && pastedText.length > 0 ? "text-amber-600" : "text-dark-brown/30"}`}>
                {pastedText.length > 0 && pastedText.length < 50
                  ? `あと ${50 - pastedText.length} 文字以上入力してください`
                  : pastedText.length >= 50
                  ? `${pastedText.length} 文字`
                  : "50文字以上の本文が必要です"}
              </span>
              <SubmitButton loading={loading} disabled={isSubmitDisabled} />
            </div>
          </div>
        )}

        {error && (
          <p className={`mt-2 text-sm ${isWarning ? "text-amber-600" : "text-red-600"}`}>{error}</p>
        )}
      </form>
    </div>
  );
}

function SubmitButton({ loading, disabled }: { loading: boolean; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
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
  );
}
