export type ReadingStatus = "unread" | "reading" | "done";

export interface Article {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  status: ReadingStatus;
  memo: string;
  createdAt: number;
}
