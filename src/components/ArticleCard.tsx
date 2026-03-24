"use client";

import { useState } from "react";
import { Article, ReadingStatus } from "@/lib/types";

const STATUS_CONFIG: Record<ReadingStatus, { label: string; color: string; bg: string }> = {
  unread: { label: "未読", color: "#E8A87C", bg: "bg-[#E8A87C]" },
  reading: { label: "読書中", color: "#7EC8E3", bg: "bg-[#7EC8E3]" },
  done: { label: "読了", color: "#85C88A", bg: "bg-[#85C88A]" },
};

const STATUSES: ReadingStatus[] = ["unread", "reading", "done"];

interface Props {
  article: Article;
  onUpdateStatus: (id: string, status: ReadingStatus) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onDelete: (id: string) => void;
}

export default function ArticleCard({ article, onUpdateStatus, onUpdateMemo, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [memo, setMemo] = useState(article.memo);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const status = STATUS_CONFIG[article.status];

  const handleMemoSave = () => {
    onUpdateMemo(article.id, memo);
  };

  const handleShare = () => {
    const subject = encodeURIComponent(`[積ん読] ${article.title}`);
    const body = encodeURIComponent(
      `${article.title}\n${article.url}\n\n【要約】\n${article.summary}${article.memo ? `\n\n【メモ】\n${article.memo}` : ""}`
    );
    window.open(`https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`, "_blank");
  };

  return (
    <article className="bg-white rounded-xl p-5 shadow-sm border border-stone-200/60 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-heading text-lg font-semibold leading-snug text-dark-brown flex-1">
          {article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-700 transition-colors"
            >
              {article.title}
            </a>
          ) : (
            <span>{article.title}</span>
          )}
        </h3>
        <span className={`${status.bg} text-white text-xs font-sans font-medium px-2.5 py-1 rounded-full whitespace-nowrap`}>
          {status.label}
        </span>
      </div>

      <p className="text-sm text-dark-brown/70 leading-relaxed mb-3 font-sans">
        {article.summary}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {article.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-sans bg-stone-100 text-dark-brown/60 px-2.5 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onUpdateStatus(article.id, s)}
            className={`text-xs font-sans px-3 py-1.5 rounded-full border transition-colors ${
              article.status === s
                ? `border-[${STATUS_CONFIG[s].color}] bg-[${STATUS_CONFIG[s].color}]/10 text-dark-brown font-medium`
                : "border-stone-200 text-dark-brown/50 hover:border-stone-300"
            }`}
            style={
              article.status === s
                ? { borderColor: STATUS_CONFIG[s].color, backgroundColor: `${STATUS_CONFIG[s].color}20` }
                : undefined
            }
          >
            {STATUS_CONFIG[s].label}
          </button>
        ))}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-sans px-3 py-1.5 rounded-full border border-stone-200 text-dark-brown/50 hover:border-stone-300 transition-colors ml-auto"
        >
          {expanded ? "閉じる" : "メモ"}
        </button>

        <button
          onClick={handleShare}
          className="text-xs font-sans px-3 py-1.5 rounded-full border border-stone-200 text-dark-brown/50 hover:border-stone-300 transition-colors"
          title="Gmailで共有"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-xs font-sans px-3 py-1.5 rounded-full border border-stone-200 text-red-400 hover:border-red-300 hover:text-red-500 transition-colors"
          title="削除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-700 font-sans">この記事を削除しますか？</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs px-3 py-1.5 rounded-full border border-stone-300 text-dark-brown/60 font-sans"
            >
              キャンセル
            </button>
            <button
              onClick={() => onDelete(article.id)}
              className="text-xs px-3 py-1.5 rounded-full bg-red-500 text-white font-sans"
            >
              削除
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={handleMemoSave}
            placeholder="学びや気づきをメモ..."
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-sans resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 placeholder:text-stone-400"
          />
        </div>
      )}
    </article>
  );
}
