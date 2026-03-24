"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { Article, ReadingStatus } from "./types";
import { loadArticles, saveArticles } from "./storage";
import { supabase } from "./supabase";

// DB行 → Article 変換
function dbRowToArticle(row: Record<string, unknown>): Article {
  return {
    id: row.id as string,
    url: row.url as string,
    title: row.title as string,
    summary: row.summary as string,
    tags: row.tags as string[],
    status: row.status as ReadingStatus,
    memo: row.memo as string,
    createdAt: row.created_at as number,
  };
}

// Article → DB行 変換
function articleToDbRow(article: Article, userId: string) {
  return {
    id: article.id,
    user_id: userId,
    url: article.url,
    title: article.title,
    summary: article.summary,
    tags: article.tags,
    status: article.status,
    memo: article.memo,
    created_at: article.createdAt,
  };
}

// ローカルストレージのデータをSupabaseへ移行
export async function migrateLocalToSupabase(userId: string): Promise<number> {
  const localArticles = loadArticles();
  if (localArticles.length === 0) return 0;
  const rows = localArticles.map((a) => articleToDbRow(a, userId));
  const { error } = await supabase.from("articles").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  return localArticles.length;
}

export function useArticles(user: User | null) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 初期ロード
  useEffect(() => {
    setLoaded(false);
    if (user) {
      supabase
        .from("articles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) console.error("[useArticles] load error:", error);
          setArticles((data ?? []).map(dbRowToArticle));
          setLoaded(true);
        });
    } else {
      setArticles(loadArticles());
      setLoaded(true);
    }
  }, [user]);

  // 未ログイン時はlocalStorageへ保存
  useEffect(() => {
    if (loaded && !user) saveArticles(articles);
  }, [articles, loaded, user]);

  const addArticle = useCallback(
    async (article: Omit<Article, "id" | "status" | "memo" | "createdAt">) => {
      const newArticle: Article = {
        ...article,
        id: crypto.randomUUID(),
        status: "unread",
        memo: "",
        createdAt: Date.now(),
      };
      if (user) {
        const { error } = await supabase
          .from("articles")
          .insert(articleToDbRow(newArticle, user.id));
        if (error) { console.error("[useArticles] insert error:", error); return; }
      }
      setArticles((prev) => [newArticle, ...prev]);
    },
    [user]
  );

  const updateStatus = useCallback(
    async (id: string, status: ReadingStatus) => {
      if (user) {
        const { error } = await supabase
          .from("articles").update({ status }).eq("id", id).eq("user_id", user.id);
        if (error) { console.error("[useArticles] update status error:", error); return; }
      }
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    },
    [user]
  );

  const updateMemo = useCallback(
    async (id: string, memo: string) => {
      if (user) {
        const { error } = await supabase
          .from("articles").update({ memo }).eq("id", id).eq("user_id", user.id);
        if (error) { console.error("[useArticles] update memo error:", error); return; }
      }
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, memo } : a)));
    },
    [user]
  );

  const deleteArticle = useCallback(
    async (id: string) => {
      if (user) {
        const { error } = await supabase
          .from("articles").delete().eq("id", id).eq("user_id", user.id);
        if (error) { console.error("[useArticles] delete error:", error); return; }
      }
      setArticles((prev) => prev.filter((a) => a.id !== id));
    },
    [user]
  );

  return { articles, loaded, addArticle, updateStatus, updateMemo, deleteArticle };
}
