"use client";

import { useState, useMemo } from "react";
import { useArticles } from "@/lib/useArticles";
import { ReadingStatus } from "@/lib/types";
import AddArticle from "@/components/AddArticle";
import ArticleCard from "@/components/ArticleCard";
import FilterBar from "@/components/FilterBar";

export default function Home() {
  const { articles, loaded, addArticle, updateStatus, updateMemo, deleteArticle } = useArticles();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus | "all">("all");

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

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-dark-brown/40 font-sans">読み込み中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-dark-brown mb-1">
          積ん読リスト
        </h1>
        <p className="font-sans text-sm text-dark-brown/50">
          読みたい記事を保存して、AIが要約します
        </p>
        {articles.length > 0 && (
          <div className="flex gap-4 mt-3 font-sans text-xs text-dark-brown/40">
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#E8A87C] mr-1" />
              未読 {counts.unread}
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#7EC8E3] mr-1" />
              読書中 {counts.reading}
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#85C88A] mr-1" />
              読了 {counts.done}
            </span>
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
          <p className="font-heading text-lg text-dark-brown/60">
            まだ記事がありません
          </p>
          <p className="font-sans text-sm text-dark-brown/40 mt-1">
            URLをペーストして最初の記事を追加しましょう
          </p>
        </div>
      )}

      {articles.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="font-sans text-sm text-dark-brown/40">
            条件に一致する記事がありません
          </p>
        </div>
      )}
    </main>
  );
}
