"use client";

import { useState, useMemo } from "react";
import { useArticles, migrateLocalToSupabase } from "@/lib/useArticles";
import { useAuth } from "@/lib/useAuth";
import { loadArticles } from "@/lib/storage";
import { ReadingStatus } from "@/lib/types";
import AddArticle from "@/components/AddArticle";
import ArticleCard from "@/components/ArticleCard";
import FilterBar from "@/components/FilterBar";

export default function Home() {
  const { user, authLoaded, signInWithGoogle, signOut } = useAuth();
  const { articles, loaded, addArticle, updateStatus, updateMemo, deleteArticle } = useArticles(user);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus | "all">("all");
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState("");

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (selectedStatus !== "all" && a.status !== selectedStatus) return false;
      if (selectedTag && !a.tags.includes(selectedTag)) return false;
      return true;
    });
  }, [articles, selectedStatus, selectedTag]);

  const counts = useMemo(() => {
    const c = { unread: 0, reading: 0, done: 0 };
    articles.forEach((a) => c[a.status]++);
    return c;
  }, [articles]);

  // ローカルストレージに未移行データがあるか
  const localCount = useMemo(() => {
    if (!user || !loaded) return 0;
    return loadArticles().length;
  }, [user, loaded]);

  const handleMigrate = async () => {
    if (!user) return;
    setMigrating(true);
    try {
      const count = await migrateLocalToSupabase(user.id);
      setMigrateMsg(`${count}件の記事を移行しました！`);
      // 再読込
      window.location.reload();
    } catch {
      setMigrateMsg("移行に失敗しました。もう一度お試しください。");
    } finally {
      setMigrating(false);
    }
  };

  if (!authLoaded || !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-dark-brown/40 font-sans">読み込み中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-dark-brown mb-1">
              積ん読リスト
            </h1>
            <p className="font-sans text-sm text-dark-brown/50">
              読みたい記事を保存して、AIが要約します
            </p>
          </div>
          {/* 認証ボタン */}
          <div className="flex-shrink-0 pt-1">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-sans text-dark-brown/50 hidden sm:block truncate max-w-[140px]">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-xs font-sans px-3 py-1.5 rounded-full border border-stone-300 text-dark-brown/60 hover:border-stone-400 transition-colors whitespace-nowrap"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 text-xs font-sans px-3 py-1.5 rounded-full border border-stone-300 text-dark-brown/70 hover:border-amber-400 hover:text-dark-brown transition-colors whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Googleでログイン
              </button>
            )}
          </div>
        </div>

        {articles.length > 0 && (
          <div className="flex gap-4 mt-3 font-sans text-xs text-dark-brown/40">
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#E8A87C] mr-1" />未読 {counts.unread}</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#7EC8E3] mr-1" />読書中 {counts.reading}</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#85C88A] mr-1" />読了 {counts.done}</span>
          </div>
        )}

        {/* 移行バナー */}
        {user && localCount > 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
            <p className="font-sans text-sm text-amber-800">
              ローカルに <strong>{localCount}件</strong> の記事があります。クラウドに移行しますか？
            </p>
            <div className="flex items-center gap-2">
              {migrateMsg && <span className="text-xs text-amber-700">{migrateMsg}</span>}
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="text-xs font-sans px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap transition-colors"
              >
                {migrating ? "移行中..." : "移行する"}
              </button>
            </div>
          </div>
        )}
      </header>

      <AddArticle onAdd={addArticle} />

      {articles.length > 0 && (
        <FilterBar
          allTags={allTags}
          selectedTag={selectedTag}
          selectedStatus={selectedStatus}
          onTagChange={setSelectedTag}
          onStatusChange={setSelectedStatus}
        />
      )}

      <div className="space-y-4">
        {filtered.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onUpdateStatus={updateStatus}
            onUpdateMemo={updateMemo}
            onDelete={deleteArticle}
          />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📚</p>
          <p className="font-heading text-lg text-dark-brown/60">まだ記事がありません</p>
          <p className="font-sans text-sm text-dark-brown/40 mt-1">
            {user ? "最初の記事を追加しましょう" : "URLをペーストして最初の記事を追加しましょう"}
          </p>
        </div>
      )}

      {articles.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="font-sans text-sm text-dark-brown/40">条件に一致する記事がありません</p>
        </div>
      )}
    </main>
  );
}
