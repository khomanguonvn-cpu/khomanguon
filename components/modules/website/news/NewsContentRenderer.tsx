/**
 * Server-side Markdown-to-HTML renderer for news article content.
 * Handles: headings, paragraphs, images, bold, italic, lists, blockquotes, horizontal rules, code blocks, inline code.
 * No external dependencies — pure regex-based conversion.
 */

import Image from "next/image";

function escapeHtml(input: string) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type ContentBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "hr" }
  | { type: "blockquote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; text: string }
  | { type: "paragraph"; text: string };

function parseMarkdownImage(input: string) {
  const match = String(input || "").trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!match) {
    return null;
  }
  return {
    alt: match[1] || "",
    src: match[2].trim(),
  };
}

function isLikelyNoiseImageSrc(src: string) {
  const value = String(src || "").trim().toLowerCase();
  if (!value) {
    return true;
  }
  let filename = value;
  try {
    filename = decodeURIComponent(new URL(value).pathname.split("/").pop() || value);
  } catch {
    filename = value.split("?")[0].split("#")[0].split("/").pop() || value;
  }
  const stem = filename.replace(/\.(?:jpe?g|png|webp|gif|svg|avif|bmp)$/i, "");
  return /(^|[-_.\s])(?:logo|favicon|sprite|icon|avatar|placeholder|loading|blank|transparent|pixel|share|social|default|noimage)(?:[-_.\s]|$)/i.test(stem);
}

function renderInlineFormatting(text: string): string {
  let result = escapeHtml(text);

  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic: *text*
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  // Inline code: `text`
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

  return result;
}

function parseBlocks(content: string): ContentBlock[] {
  const lines = String(content || "").split("\n");
  const blocks: ContentBlock[] = [];
  let i = 0;
  let skipLooseMode = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    if (/^game m[ớo]i cho b[aạ]n$/i.test(trimmed)) {
      skipLooseMode = true;
      i++;
      continue;
    }

    if (skipLooseMode) {
      if (!trimmed || trimmed.length < 80 || /^[-*+]\s+/.test(trimmed) || /^th[eể] lo[aạ]i\s*:/i.test(trimmed) || /^nph\s*:/i.test(trimmed)) {
        i++;
        continue;
      }
      skipLooseMode = false;
    }

    if (/^th[eể] lo[aạ]i\s*:/i.test(trimmed) || /^nph\s*:/i.test(trimmed)) {
      i++;
      continue;
    }

    // Code block: ```...```
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    // Heading: # ... through ###### ...
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Image: ![alt](src)
    const imageMatch = parseMarkdownImage(trimmed);
    if (imageMatch) {
      if (isLikelyNoiseImageSrc(imageMatch.src)) {
        i++;
        continue;
      }
      blocks.push({
        type: "image",
        alt: imageMatch.alt,
        src: imageMatch.src,
      });
      i++;
      continue;
    }

    // Horizontal rule: --- or *** or ___
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Blockquote: > text (collect consecutive lines)
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim().startsWith("> ")
      ) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join(" "),
      });
      continue;
    }

    // List items: - item or * item (collect consecutive)
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (
        i < lines.length &&
        /^[-*+]\s+/.test(lines[i].trim())
      ) {
        const item = lines[i].trim().replace(/^[-*+]\s+/, "");
        const itemImage = parseMarkdownImage(item);
        if (itemImage) {
          if (items.length > 0) {
            blocks.push({ type: "list", items: [...items] });
            items.length = 0;
          }
          if (!isLikelyNoiseImageSrc(itemImage.src)) {
            blocks.push({ type: "image", alt: itemImage.alt, src: itemImage.src });
          }
          i++;
          continue;
        }
        items.push(item);
        i++;
      }
      if (items.length > 0) {
        blocks.push({ type: "list", items });
      }
      continue;
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    const paraLines: string[] = [trimmed];
    i++;
    while (i < lines.length) {
      const nextTrimmed = lines[i].trim();
      if (!nextTrimmed) break;
      if (/^#{1,6}\s/.test(nextTrimmed)) break;
      if (/^!\[/.test(nextTrimmed)) break;
      if (/^[-*_]{3,}$/.test(nextTrimmed)) break;
      if (/^>\s/.test(nextTrimmed)) break;
      if (/^[-*+]\s+/.test(nextTrimmed)) break;
      if (nextTrimmed.startsWith("```")) break;
      paraLines.push(nextTrimmed);
      i++;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") });
  }

  return blocks;
}

export default function NewsContentRenderer({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) {
    return <p className="text-slate-800 leading-8">{content}</p>;
  }

  return (
    <>
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        switch (block.type) {
          case "heading": {
            const HeadingTag = `h${Math.min(block.level + 1, 6)}` as keyof JSX.IntrinsicElements;
            const sizeClass =
              block.level === 1
                ? "text-2xl font-bold mt-8 mb-4"
                : block.level === 2
                  ? "text-xl font-bold mt-6 mb-3"
                  : "text-lg font-semibold mt-5 mb-2";
            return (
              <HeadingTag key={key} className={`text-slate-900 ${sizeClass}`}>
                {block.text}
              </HeadingTag>
            );
          }

          case "image": {
            return (
              <figure key={key} className="my-6">
                <div className="relative w-full rounded-xl overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={block.src}
                    alt={block.alt || ""}
                    className="w-full h-auto object-contain max-h-[600px]"
                    loading="lazy"
                  />
                </div>
                {block.alt && (
                  <figcaption className="text-center text-sm text-slate-500 mt-2 italic">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );
          }

          case "hr":
            return <hr key={key} className="my-8 border-slate-200" />;

          case "blockquote":
            return (
              <blockquote
                key={key}
                className="border-l-4 border-primary-400 pl-4 py-2 my-4 text-slate-700 italic bg-slate-50 rounded-r-lg"
                dangerouslySetInnerHTML={{
                  __html: renderInlineFormatting(block.text),
                }}
              />
            );

          case "list":
            return (
              <ul key={key} className="list-disc list-inside space-y-1 my-4 text-slate-800 leading-8">
                {block.items.map((item, itemIndex) => (
                  <li
                    key={`${key}-li-${itemIndex}`}
                    dangerouslySetInnerHTML={{
                      __html: renderInlineFormatting(item),
                    }}
                  />
                ))}
              </ul>
            );

          case "code":
            return (
              <pre
                key={key}
                className="bg-slate-900 text-slate-100 rounded-xl p-4 my-4 overflow-x-auto text-sm leading-6"
              >
                <code>{block.text}</code>
              </pre>
            );

          case "paragraph":
            return (
              <p
                key={key}
                className="text-slate-800 leading-8 mb-4"
                dangerouslySetInnerHTML={{
                  __html: renderInlineFormatting(block.text),
                }}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
}
