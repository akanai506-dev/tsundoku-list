"use client";

import { ReadingStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ReadingStatus | "all"; label: string; color?: string }[] = [
  { value: "all", label: "すべて" },
  { value: "unread", label: "未読", color: "#E8A87C" },
  { value: "reading", label: "読書中", color: "#7EC8E3" },
  { value: "done", label: "読了", color: "#85C88A" },
];

interface Props {
  allTags: string[];
  selectedTag: string | null;
  selectedStatus: ReadingStatus | "all";
  onTagChange: (tag: string | null) => void;
  onStatusChange: (status: ReadingStatus | "all") => void;
}

export default function FilterBar({
  allTags,
  selectedTag,
  selectedStatus,
  onTagChange,
  onStatusChange,
}: Props) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={`text-xs font-sans px-3 py-1.5 rounded-full border transition-colors ${
              selectedStatus === opt.value
                ? "border-dark-brown bg-dark-brown text-cream font-medium"
                : "border-stone-200 text-dark-brown/50 hover:border-stone-300"
            }`}
          >
            {opt.color && (
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: opt.color }}
              />
            )}
            {opt.label}
          </button>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onTagChange(null)}
            className={`text-xs font-sans px-2.5 py-1 rounded-full transition-colors ${
              selectedTag === null
                ? "bg-amber-100 text-amber-800 font-medium"
                : "bg-stone-100 text-dark-brown/50 hover:bg-stone-200"
            }`}
          >
            All Tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagChange(tag === selectedTag ? null : tag)}
              className={`text-xs font-sans px-2.5 py-1 rounded-full transition-colors ${
                selectedTag === tag
                  ? "bg-amber-100 text-amber-800 font-medium"
                  : "bg-stone-100 text-dark-brown/50 hover:bg-stone-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
