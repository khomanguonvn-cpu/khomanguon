/**
 * HTML-to-Markdown converter for the news crawl pipeline.
 * Preserves article structure (headings, paragraphs, images, lists, bold/italic)
 * instead of stripping all HTML to plain text.
 */
import he from "he";

function decodeEntities(input: string) {
  return he.decode(String(input || ""));
}

function stripTags(input: string) {
  return String(input || "").replace(/<[^>]+>/g, " ");
}

function normalizeWs(input: string) {
  return String(input || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function resolveUrl(src: string, baseUrl?: URL | null): string {
  const cleaned = String(src || "")
    .trim()
    .replace(/^["'(<]+/, "")
    .replace(/[>"'),.;!?]+$/, "");
  if (!cleaned || /^data:/i.test(cleaned) || /^javascript:/i.test(cleaned)) {
    return "";
  }
  if (cleaned.startsWith("//")) {
    return `${baseUrl?.protocol || "https:"}${cleaned}`;
  }
  try {
    const url = baseUrl ? new URL(cleaned, baseUrl) : new URL(cleaned);
    return url.toString();
  } catch {
    return "";
  }
}

function isImageUrl(url: string): boolean {
  const value = String(url || "").trim().toLowerCase();
  if (!value) return false;
  if (
    /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?|#|$)/i.test(value)
  ) {
    return true;
  }
  return /[?&](format|fm|ext|type)=(jpg|jpeg|png|webp|gif|svg|avif|bmp)/i.test(value);
}

function getAttr(tag: string, attr: string): string {
  const safeAttr = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(tag || "").match(
    new RegExp(`(?:^|\\s)${safeAttr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  );
  return String(match?.[1] || match?.[2] || match?.[3] || "").trim();
}

function pickSrcsetUrl(srcset: string): string {
  const parts = String(srcset || "")
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
  return parts[parts.length - 1] || "";
}

function getImageSourceFromTag(tag: string, baseUrl?: URL | null): string {
  const directAttrs = ["data-src", "data-lazy-src", "data-original", "data-image", "src"];
  for (const attr of directAttrs) {
    const value = getAttr(tag, attr);
    const resolved = resolveUrl(value, baseUrl);
    if (resolved && isImageUrl(resolved) && !isLikelyNoiseImageUrl(resolved)) {
      return resolved;
    }
  }
  const srcset = getAttr(tag, "data-srcset") || getAttr(tag, "srcset");
  const resolvedSrcset = resolveUrl(pickSrcsetUrl(srcset), baseUrl);
  return isImageUrl(resolvedSrcset) && !isLikelyNoiseImageUrl(resolvedSrcset) ? resolvedSrcset : "";
}

function isLikelyNoiseImageUrl(url: string): boolean {
  const value = String(url || "").trim().toLowerCase();
  if (!value) return true;
  let filename = value;
  try {
    filename = decodeURIComponent(new URL(value).pathname.split("/").pop() || value);
  } catch {
    filename = value.split("?")[0].split("#")[0].split("/").pop() || value;
  }
  const stem = filename.replace(/\.(?:jpe?g|png|webp|gif|svg|avif|bmp)$/i, "");
  if (/(^|[-_.\s])(?:logo|favicon|sprite|icon|avatar|placeholder|loading|blank|transparent|pixel|share|social|default|noimage)(?:[-_.\s]|$)/i.test(stem)) {
    return true;
  }
  return /[?&](?:width|w|height|h)=(?:1|2|8|16|24|32|48|64)(?:&|$)/i.test(value);
}

/**
 * Extract the article-relevant HTML from a full page HTML string.
 * Returns the inner HTML of the best container found.
 */
export function extractArticleHtml(html: string): string {
  // === Pass 1: itemprop="articleBody" (highest priority — most precise) ===
  // Try <article itemprop="articleBody"> first (exact close tag)
  const articleBodyMatch = html.match(/<article[^>]*itemprop=["']articleBody["'][^>]*>([\s\S]+?)<\/article>/i);
  if (articleBodyMatch?.[1]) {
    const text = stripTags(articleBodyMatch[1]).trim();
    if (text.length >= 120) {
      return removeNoiseFromHtml(articleBodyMatch[1]);
    }
  }
  // Try <div itemprop="articleBody">
  const divBodyMatch = html.match(/<div[^>]*itemprop=["']articleBody["'][^>]*>([\s\S]+?)<\/div>\s*<\/(?:section|article|main)/i);
  if (divBodyMatch?.[1]) {
    const text = stripTags(divBodyMatch[1]).trim();
    if (text.length >= 120) {
      return removeNoiseFromHtml(divBodyMatch[1]);
    }
  }

  // === Pass 2: <article> tag (lazy — match first complete article) ===
  const articleMatch = html.match(/<article[^>]*>([\s\S]+?)<\/article>/i);
  if (articleMatch?.[1]) {
    const text = stripTags(articleMatch[1]).trim();
    if (text.length >= 120) {
      return removeNoiseFromHtml(articleMatch[1]);
    }
  }

  // === Pass 3: VCCorp/Vietnamese news site specific containers ===
  const vnPatterns = [
    // GameK / Kenh14 / CafeF new layout (no fck_detail): data-field=body data-role=content
    /<div[^>]*data-field=["']body["'][^>]*data-role=["']content["'][^>]*>([\s\S]+?)<\/div>\s*(?=<div[^>]*(?:class="[^"]*(?:link-content-footer|link-source-wrapper|VCSortableIn498|knc-relate|module_cung|admzone|adsbygoogle|tags|relate|comment))|<zone\b)/i,
    // GameK alternative: rightdetail_content / detailsmallcontent wrapper
    /<div[^>]*class="[^"]*\b(?:rightdetail_content|detailsmallcontent)\b[^"]*"[^>]*>([\s\S]+?)<\/div>\s*(?=<div[^>]*class="[^"]*(?:link-content-footer|link-source-wrapper|VCSortable|knc-relate|module_cung|admzone|adsbygoogle|tags|relate|comment))/i,
    /<div[^>]*class="[^"]*\b(?:rightdetail_content|detailsmallcontent)\b[^"]*"[^>]*>([\s\S]+)<\/div>/i,
    // VCCorp: fck_detail (GameK, CafeF, Kenh14, Soha)
    /<div[^>]*class="[^"]*\bfck_detail\b[^"]*"[^>]*>([\s\S]+?)<\/div>\s*(?=<(?:div|section)[^>]*class="[^"]*(?:knc-relate|VCSortable|middle-comment|box-relate|module_cung|comment))/i,
    /<div[^>]*class="[^"]*\bfck_detail\b[^"]*"[^>]*>([\s\S]+)<\/div>/i,
    // nguoiduatin/doisongphapluat: tmp-entry-content > article
    /<section[^>]*class="[^"]*\btmp-entry-content\b[^"]*"[^>]*>([\s\S]+?)<\/section>/i,
  ];
  for (const pattern of vnPatterns) {
    const match = html.match(pattern);
    if (match?.[1] && stripTags(match[1]).trim().length >= 120) {
      return removeNoiseFromHtml(match[1]);
    }
  }

  // === Pass 4: Common CMS content containers ===
  const cmsPatterns = [
    // article-content, article-body, etc.
    /<div[^>]*class="[^"]*\b(?:article-content|article-body|article__body|article__content|article-detail)\b[^"]*"[^>]*>([\s\S]+?)<\/div>\s*(?=<(?:div|section)[^>]*class="[^"]*(?:related|comment|social|share|tag|module|sidebar|cung))/i,
    // content-detail, content-body, etc.
    /<div[^>]*class="[^"]*\b(?:content-detail|content-body|content__body|content__detail|detail-content|detail-body|detail__content)\b[^"]*"[^>]*>([\s\S]+?)<\/div>\s*(?=<(?:div|section)[^>]*class="[^"]*(?:related|comment|social|share|tag|module|sidebar|cung))/i,
    // post-content, entry-content, etc.
    /<div[^>]*class="[^"]*\b(?:post-content|post-body|entry-content|entry-body|story-content|news-content|news-detail)\b[^"]*"[^>]*>([\s\S]+?)<\/div>\s*(?=<(?:div|section)[^>]*class="[^"]*(?:related|comment|social|share|tag|module|sidebar|cung))/i,
    // Fallback: greedy match
    /<div[^>]*class="[^"]*\b(?:article-content|article-body|article__body|post-content|entry-content|content-detail|content-body|fck_detail|detail-content|news-content|news-detail)\b[^"]*"[^>]*>([\s\S]+)<\/div>/i,
    /<main[^>]*>([\s\S]+)<\/main>/i,
  ];
  for (const pattern of cmsPatterns) {
    const match = html.match(pattern);
    if (match?.[1] && stripTags(match[1]).trim().length >= 120) {
      return removeNoiseFromHtml(match[1]);
    }
  }

  // === Fallback: use body with noise removed ===
  const bodyMatch = html.match(/<body[^>]*>([\s\S]+)<\/body>/i);
  if (bodyMatch?.[1]) {
    return removeNoiseFromHtml(bodyMatch[1]);
  }

  return removeNoiseFromHtml(html);
}

/**
 * Remove noise HTML elements from extracted content.
 */
function removeNoiseFromHtml(html: string): string {
  let cleaned = html;
  // Remove script/style/nav/footer/header
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");
  cleaned = cleaned.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  cleaned = cleaned.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  cleaned = cleaned.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  cleaned = cleaned.replace(/<header[\s\S]*?<\/header>/gi, "");
  cleaned = cleaned.replace(/<aside[\s\S]*?<\/aside>/gi, "");
  // Remove related articles blocks
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:related|relate|tin-lien-quan|box-related|box-relate|knc-relate|kbwc-related|VCSortable|middle-relate|list-relate|list-news-subfolder)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove social/share/comment blocks
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:social|share|sharing|comment|fb-comment|social-share|social-plugin|fb-like|fb-comments)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove tags/keywords blocks
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:tags|tag-wrapper|tags-wrapper|box-tags|tag-list)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove breadcrumbs
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\bbreadcrumb\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove author/source boxes
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:author|source|copyright|copy-right)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove ad containers
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:ads?|advertisement|adsbygoogle|sponsored|promo)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove VCCorp specific widgets
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:middle-comment|kbwscroll|kbwc-sidebar|kbwc-header|kbwc-footer|kbwc-nav|inner-sidebar)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove category/trending boxes
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:box-category|category-list|trending|popular|most-read|hot-news)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove pagination
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:pagination|paging)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove newsletter/subscribe
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:newsletter|subscribe)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove popups/modals
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:popup|modal)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove read-more/xem-them
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:read-more|readmore|see-more|xem-them)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove GameK / VCCorp link-source & related-link footer widgets
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\blink-content-footer\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\blink-source-wrapper\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  cleaned = cleaned.replace(/<div[^>]*id=["']urlSourceGamek["'][^>]*>[\s\S]*?<\/div>/gi, "");
  // Remove VCCorp ad zones
  cleaned = cleaned.replace(/<zone\b[\s\S]*?<\/zone>/gi, "");
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\b(?:adm-[a-z0-9-]+|admzone[a-z0-9-]*)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  return cleaned;
}

/**
 * Convert an HTML string to clean Markdown.
 *
 * Preserves: headings, paragraphs, bold, italic, images (with resolved URLs),
 * lists, blockquotes, horizontal rules.
 * Removes: scripts, styles, nav, footer, comments, and non-image links.
 */
export function htmlToMarkdown(html: string, baseUrl?: URL | null): string {
  let md = String(html || "");

  // ── Step 1: Remove noise elements ──
  md = md.replace(/<script[\s\S]*?<\/script>/gi, "");
  md = md.replace(/<style[\s\S]*?<\/style>/gi, "");
  md = md.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  md = md.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  md = md.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  md = md.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  md = md.replace(/<header[\s\S]*?<\/header>/gi, "");
  md = md.replace(/<!--[\s\S]*?-->/g, "");
  md = md.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  md = md.replace(/<button[\s\S]*?<\/button>/gi, "");
  md = md.replace(/<form[\s\S]*?<\/form>/gi, "");
  md = md.replace(/<input[\s\S]*?>/gi, "");
  md = md.replace(/<select[\s\S]*?<\/select>/gi, "");
  md = md.replace(/<textarea[\s\S]*?<\/textarea>/gi, "");

  // ── Step 2: Convert images (self-closing, before stripping other tags) ──
  md = md.replace(/<img\b[^>]*>/gi, (tag) => {
    const resolved = getImageSourceFromTag(tag, baseUrl);
    if (!resolved) return "";
    const altMatch = tag.match(/alt\s*=\s*["']([^"']+)["']/i);
    const alt = altMatch ? decodeEntities(altMatch[1]) : "";
    return `\n\n![${alt}](${resolved})\n\n`;
  });

  // ── Step 3: Convert inline formatting (innermost first) ──
  // Italic: <em> / <i> (use word-boundary \b to avoid matching <iframe>, <input> etc.)
  md = md.replace(/<(?:em|i)\b[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, (_, c) => {
    const t = c.trim();
    return t ? `*${t}*` : "";
  });
  // Bold: <strong> / <b> (use \b to avoid matching <br>, <blockquote>)
  md = md.replace(
    /<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi,
    (_, c) => {
      const t = c.trim();
      return t ? `**${t}**` : "";
    }
  );

  // ── Step 4: Remove links but keep their text content ──
  md = md.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");

  // ── Step 5: Convert list items ──
  md = md.replace(/<li\b[^>]*>([\s\S]*?)<\/?li>/gi, (_, c) => {
    const t = stripTags(decodeEntities(c)).trim();
    if (/^!\[[^\]]*]\([^)]+\)$/.test(t)) {
      return `\n\n${t}\n\n`;
    }
    return t ? `\n- ${t}` : "";
  });
  md = md.replace(/<\/?(?:ul|ol|menu)\b[^>]*>/gi, "\n");

  // ── Step 5b: Convert tables ──
  md = md.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_, tableBody) => {
    const rows: string[] = [];
    const headerCells = Array.from(tableBody.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi) as IterableIterator<RegExpMatchArray>)
      .map((m: RegExpMatchArray) => stripTags(decodeEntities(m[1])).trim())
      .filter(Boolean);
    if (headerCells.length > 0) {
      rows.push(`| ${headerCells.join(" | ")} |`);
      rows.push(`| ${headerCells.map(() => "---").join(" | ")} |`);
    }
    const bodyRows = tableBody.match(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    for (const tr of bodyRows) {
      const cells = Array.from(tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi) as IterableIterator<RegExpMatchArray>)
        .map((m: RegExpMatchArray) => stripTags(decodeEntities(m[1])).trim())
        .filter(Boolean);
      if (cells.length > 0) {
        rows.push(`| ${cells.join(" | ")} |`);
      }
    }
    return rows.length > 0 ? `\n\n${rows.join("\n")}\n\n` : "";
  });

  // ── Step 6: Convert code blocks ──
  md = md.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => {
    const text = stripTags(decodeEntities(code)).trim();
    return text ? `\n\n\`\`\`\n${text}\n\`\`\`\n\n` : "";
  });
  md = md.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => {
    const text = decodeEntities(code).trim();
    return text ? `\`${text}\`` : "";
  });

  // ── Step 6: Convert blockquotes ──
  md = md.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => {
    const t = stripTags(decodeEntities(c)).trim();
    return t ? `\n\n> ${t}\n\n` : "";
  });

  // ── Step 7: Convert headings (h6 → h1, so outer headings override inner ones) ──
  for (let i = 6; i >= 1; i--) {
    const prefix = "#".repeat(i);
    md = md.replace(
      new RegExp(`<h${i}\\b[^>]*>([\\s\\S]*?)<\\/h${i}>`, "gi"),
      (_, c) => {
        const t = stripTags(decodeEntities(c)).trim();
        return t ? `\n\n${prefix} ${t}\n\n` : "";
      }
    );
  }

  // ── Step 8: Convert paragraphs ──
  md = md.replace(/<p\b[^>]*>([\s\S]*?)<\/?p>/gi, (_, c) => {
    // By now inline formatting is already converted; strip leftover tags
    const t = stripTags(decodeEntities(c)).trim();
    return t ? `\n\n${t}\n\n` : "";
  });

  // ── Step 9: Convert line-level elements ──
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<hr\s*\/?>/gi, "\n\n---\n\n");

  // ── Step 10: Handle figure/figcaption ──
  md = md.replace(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/gi, (_, c) => {
    const t = stripTags(decodeEntities(c)).trim();
    return t ? `\n*${t}*\n` : "";
  });
  md = md.replace(/<\/?figure\b[^>]*>/gi, "\n");

  // ── Step 11: Strip all remaining HTML tags ──
  md = md.replace(/<[^>]+>/g, " ");

  // ── Step 12: Decode remaining HTML entities ──
  md = decodeEntities(md);

  // ── Step 13: Normalize whitespace ──
  md = normalizeWs(md);

  // ── Step 14: Post-conversion text cleanup (remove residual noise) ──
  // Remove navigation menu patterns (bullets with short link-like text)
  // Pattern: lines starting with "- " that contain only short nav-like text
  const lines = md.split("\n");
  const cleanedLines: string[] = [];
  let skipMode = false;
  let skipLooseMode = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Stop article at source attribution ("Theo <Source>  Copy link" / canonical link)
    if (/^\[?\s*Theo\s+[^\]\n]{2,80}\s*(?:Copy\s+link|\])/i.test(line)) {
      break;
    }
    if (/^Theo\s+[^\n]{2,80}\s*Copy\s+link/i.test(line)) {
      break;
    }
    if (/^https?:\/\/[^\s]*nguoiduatin\.vn\/.+$/i.test(line)) {
      break;
    }

    // Detect and skip "TIN LIÊN QUAN" sections
    if (/^(?:\d+\s+)?TIN LI[EÊ]N QUAN/i.test(line)) {
      skipMode = true;
      continue;
    }

    // Detect "Xem thêm:" / "Xem thêm" sections (skip until next paragraph)
    if (/^\*?\*?Xem th[eê]m\s*:?\*?\*?\s*$/i.test(line)) {
      skipMode = true;
      continue;
    }

    if (/^game m[ớo]i cho b[aạ]n$/i.test(line)) {
      skipLooseMode = true;
      continue;
    }

    if (skipLooseMode) {
      if (!line) continue;
      if (line.length < 80 || /^[-*+]\s+/.test(line) || /^th[eể] lo[aạ]i\s*:/i.test(line) || /^nph\s*:/i.test(line)) {
        continue;
      }
      skipLooseMode = false;
    }

    // Exit skip mode on empty line or a real paragraph (>80 chars without bullets)
    if (skipMode) {
      if (!line) {
        skipMode = false;
        continue;
      }
      // Skip bullet lines in skip mode (related article titles)
      if (line.startsWith("- ") || line.startsWith("* ")) continue;
      // If line is very short, still in noise zone
      if (line.length < 40) continue;
      // Long line = probably real content, stop skipping
      skipMode = false;
    }

    // Skip copyright/footer lines
    if (/^©\s*Copyright/i.test(line)) continue;
    if (/^©\s*\d{4}/i.test(line)) continue;
    if (/Công ty Cổ phần VCCorp/i.test(line)) continue;
    if (/Giấy phép thiết lập trang/i.test(line)) continue;
    if (/Chịu trách nhiệm quản lý nội dung/i.test(line)) continue;
    if (/Liên hệ quảng cáo/i.test(line)) continue;
    if (/Hotline hỗ trợ quảng cáo/i.test(line)) continue;
    if (/Chính sách bảo mật\s*Chat với/i.test(line)) continue;
    if (/^TRANG CHỦ$/i.test(line)) continue;
    if (/^TRỤ SỞ HÀ NỘI/i.test(line)) continue;
    if (/^VPĐD tại TP\.HCM/i.test(line)) continue;
    if (/^Hỗ trợ & CSKH/i.test(line)) continue;

    // Skip pure navigation lines (multiple uppercase menu items)
    if (/^(?:GAME\s+(?:MOBILE|ONLINE)|eSPORTS|KHÁM PHÁ|MANGA|FILM|HÓNG|CỘNG ĐỒNG|GAMING GEAR|PC\/CONSOLE|360°|GAMEFI)/i.test(line)) continue;

    // Skip lines that are just category navigation (very short bullets)
    if (line.startsWith("- ") && line.length < 30) {
      // Check if it's a nav-like bullet (no sentence structure)
      const bulletText = line.slice(2).trim();
      if (/^[A-ZÀÁẢÃẠĂẮẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ\s\/&:]+$/.test(bulletText)) {
        continue; // All-caps navigation item → skip
      }
    }

    // Skip lines that are just "›Category Name" breadcrumb style
    if (/^›/.test(line) && line.length < 40) continue;

    // Skip lines that are just numbers (view counts, etc.)
    if (/^\d+$/.test(line)) continue;
    if (/^[-*+]\s*!\[[^\]]*]\([^)]+\)$/i.test(line)) continue;
    if (/^th[eể] lo[aạ]i\s*:/i.test(line)) continue;
    if (/^nph\s*:/i.test(line)) continue;

    cleanedLines.push(lines[i]);
  }

  md = cleanedLines.join("\n");

  // Final cleanup: normalize whitespace again
  md = normalizeWs(md);

  return md;
}
