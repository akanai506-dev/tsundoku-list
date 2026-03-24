import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

function titleFromUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const slug = pathname
      .replace(/\/$/, "")
      .split("/")
      .pop();
    if (slug && slug !== "") {
      return decodeURIComponent(slug).replace(/[-_]/g, " ");
    }
    return hostname;
  } catch {
    return url;
  }
}

async function fetchArticleContent(
  url: string
): Promise<{ content: string; fetchError?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TsundokuBot/1.0; +https://tsundoku-list.app)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const msg = `Fetch failed with status ${res.status} ${res.statusText}`;
      console.error(`[summarize] ${msg} for ${url}`);
      return { content: "", fetchError: msg };
    }

    const html = await res.text();

    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    return { content: text.slice(0, 8000) };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Unknown fetch error";
    console.error(`[summarize] Fetch error for ${url}:`, msg);
    return { content: "", fetchError: msg };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, text, title: providedTitle } = body;

    // テキスト直接入力モード: urlもtextも両方なければエラー
    if (!text && !url) {
      console.error("[summarize] Missing url and text in request body");
      return NextResponse.json(
        { error: "URLまたはテキストが必要です" },
        { status: 400 }
      );
    }

    let content: string;

    if (text && typeof text === "string" && text.trim().length >= 50) {
      // テキスト直接入力モード: フェッチをスキップ
      console.log(`[summarize] Text mode: ${text.length} chars provided directly`);
      content = text.trim().slice(0, 8000);
    } else if (url && typeof url === "string") {
      // URLモード: 既存のフェッチ処理
      console.log(`[summarize] Processing: ${url}`);
      const { content: fetched, fetchError } = await fetchArticleContent(url);

      // Fallback: fetch failed or content too short — return URL-based title
      if (fetchError || !fetched || fetched.length < 50) {
        console.warn(
          `[summarize] Falling back to URL-based title. fetchError=${fetchError}, contentLength=${fetched?.length ?? 0}`
        );
        return NextResponse.json({
          title: titleFromUrl(url),
          summary: fetchError
            ? `記事の取得に失敗しました: ${fetchError}`
            : "記事の内容を取得できませんでした",
          tags: [],
          fallback: true,
        });
      }
      content = fetched;
    } else {
      return NextResponse.json(
        { error: "有効なURLまたは50文字以上のテキストを入力してください" },
        { status: 400 }
      );
    }

    console.log(
      `[summarize] ${content.length} chars, sending to Claude API...`
    );

    const titleInstruction = providedTitle
      ? `タイトルは「${providedTitle}」を使用してください。`
      : "記事のタイトル（原文のタイトルがあればそれを使用、なければ内容から適切なタイトルを生成）";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `以下の記事の内容を分析して、JSON形式で回答してください。

記事内容:
${content}

以下のJSON形式で回答してください（JSON以外は出力しないでください）:
{
  "title": "${providedTitle ? providedTitle : "記事のタイトル（原文のタイトルがあればそれを使用、なければ内容から適切なタイトルを生成）"}",
  "summary": "記事の要約（日本語で3〜5文程度。記事が英語でも日本語で要約してください）",
  "tags": ["タグ1", "タグ2", "タグ3"]
}

${providedTitle ? `タイトルには必ず「${providedTitle}」を使用してください。` : ""}タグは記事の主要トピックを表す短い単語やフレーズで、3〜5個生成してください。`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    console.log(`[summarize] Claude response length: ${responseText.length}`);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(
        "[summarize] Failed to extract JSON from Claude response:",
        responseText.slice(0, 500)
      );
      return NextResponse.json({
        title: providedTitle || (url ? titleFromUrl(url) : "Untitled"),
        summary: "AIからの応答を解析できませんでした",
        tags: [],
        fallback: true,
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    console.log(`[summarize] Success: "${result.title}"`);

    return NextResponse.json({
      title: result.title || "Untitled",
      summary: result.summary || "",
      tags: Array.isArray(result.tags) ? result.tags : [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[summarize] Unhandled error:", message);
    if (stack) console.error("[summarize] Stack:", stack);

    // Even on unhandled error, try to return a fallback
    try {
      const fallbackBody = await request.clone().json();
      if (fallbackBody.url) {
        return NextResponse.json({
          title: fallbackBody.title || titleFromUrl(fallbackBody.url),
          summary: `エラーが発生しました: ${message}`,
          tags: [],
          fallback: true,
        });
      } else if (fallbackBody.title) {
        return NextResponse.json({
          title: fallbackBody.title,
          summary: `エラーが発生しました: ${message}`,
          tags: [],
          fallback: true,
        });
      }
    } catch {
      // ignore parse error
    }

    return NextResponse.json(
      { error: `Failed to summarize article: ${message}` },
      { status: 500 }
    );
  }
}
