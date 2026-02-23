"use client";

import { useState, useEffect, useCallback } from "react";
import { Article, ReadingStatus } from "./types";
import { loadArticles, saveArticles } from "./storage";

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setArticles(loadArticles());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveArticles(articles);
    }
  }, [articles, loaded]);

  const addArticle = useCallback((article: Omit<Article, "id" | "status" | "memo" | "createdAt">) => {
    const newArticle: Article = {
      ...article,
      id: crypto.randomUUID(),
      status: "unread",
      memo: "",
      createdAt: Date.now(),
    };
    setArticles((prev) => [newArticle, ...prev]);
  }, []);

  const updateStatus = useCallback((id: string, status: ReadingStatus) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  }, []);

  const updateMemo = useCallback((id: string, memo: string) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, memo } : a))
    );
  }, []);

  const deleteArticle = useCallback((id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { articles, loaded, addArticle, updateStatus, updateMemo, deleteArticle };
}
