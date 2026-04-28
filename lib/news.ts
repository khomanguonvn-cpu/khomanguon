import { getNewsAiConfig, type NewsAiProvider } from "@/lib/news-ai-config";
import { extractArticleHtml, htmlToMarkdown } from "@/lib/news-html-to-md";
import puppeteer, { type Browser } from "puppeteer-core";
import he from "he";

// Puppeteer browser singleton - lazy init, reused across crawl calls
let _browser: Browser | null = null;

// Cleanup browser on process exit
if (typeof process !== "undefined") {
  const cleanupBrowser = () => {
    if (_browser) {
      try { _browser.close(); } catch {}
      _browser = null;
    }
  };
  process.on("SIGINT", cleanupBrowser);
  process.on("SIGTERM", cleanupBrowser);
  process.on("exit", cleanupBrowser);
}

async function getBrowser(): Promise<Browser> {
  if (_browser) {
    try {
      if (_browser.connected) {
        await _browser.pages();
        return _browser;
      }
    } catch {
      // Browser is stale or crashed, discard it
    }
    try { await _browser.close(); } catch {}
    _browser = null;
  }

  const executablePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
      : undefined,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean) as string[];

  const launchOptions = {
    headless: true as boolean | "shell" | undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--allow-running-insecure-content",
      "--disable-extensions",
      "--disable-plugins",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-hang-monitor",
      "--disable-popup-blocking",
      "--disable-prompt-on-repost",
      "--disable-sync",
      "--disable-translate",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-first-run",
      "--safebrowsing-disable-auto-update",
      "--ignore-certificate-errors",
      "--ignore-ssl-errors",
      "--ignore-certificate-errors-spki-list",
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    ],
  };

  for (const execPath of executablePaths) {
    try {
      const fs = await import("fs");
      if (fs.existsSync(execPath)) {
        (launchOptions as Record<string, unknown>).executablePath = execPath;
        break;
      }
    } catch {
      // ignore
    }
  }

  _browser = await puppeteer.launch(launchOptions);
  return _browser;
}

type CrawlResult = {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  sourceUrl: string;
  keywords: string[];
  tags: string[];
  imageUrls: string[];
};

type RewriteInput = {
  title: string;
  content: string;
  sourceUrl?: string;
  customPrompt?: string;
  imageUrls?: string[];
};

type RewriteResult = {
  title: string;
  excerpt: string;
  content: string;
  keywords: string[];
  tags: string[];
  promptUsed: string;
  provider: NewsAiProvider | "fallback";
  model: string;
  imageUrls: string[];
  warning: string | null;
};

type RewriteRuntime = {
  provider: NewsAiProvider;
  model: string;
  apiKey: string;
  endpoint: string;
  headers: Record<string, string>;
};

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".svg",
  ".avif",
  ".heic",
  ".heif",
  ".tif",
  ".tiff",
];

const STOP_WORDS = new Set([
  "và", "là", "của", "cho", "với", "các", "những", "được", "đang",
  "trong", "theo", "khi", "để", "từ", "một", "này", "đã", "thì",
  "sẽ", "có", "không", "nên", "vào", "đến", "trên", "dưới", "cùng", "đó",
  "about", "after", "all", "and", "are", "but", "for", "from", "have",
  "into", "its", "not", "that", "the", "their", "this", "was", "with", "you", "your",
]);

const DEFAULT_AI_PROMPT = `
Bạn là biên tập viên SEO tiếng Việt cho website thương mại điện tử.

Mục tiêu:
1) Viết lại tiêu đề và nội dung để dễ index, rõ nghĩa, tự nhiên, không nhồi nhét từ khóa.
2) Giữ đúng ý chính của bài gốc, không bịa dữ kiện, không thêm thông tin không có trong bài.
3) Tạo phiên bản thân thiện với Google: độc đáo, dễ đọc, cấu trúc rõ ràng, không spam.

Yêu cầu đầu ra dạng JSON hợp lệ với đúng các key:
- title: string (50-70 ký tự, có từ khóa chính, tự nhiên)
- excerpt: string (140-180 ký tự, tóm tắt hấp dẫn)
- content: string (nội dung viết lại hoàn chỉnh, chia đoạn rõ ràng, có các tiêu đề phụ khi cần)
- keywords: string[] (8-12 từ khóa liên quan trực tiếp nội dung)
- tags: string[] (4-8 tag ngắn gọn, sát chủ đề)

Quy tắc liên kết và hình ảnh:
- BẮT BUỘC giữ nguyên TẤT CẢ các thẻ hình ảnh Markdown (ví dụ: ![Ảnh mô tả](https://...)) ở CÙNG VỊ TRÍ vốn có trong nội dung gốc. KHÔNG ĐƯỢC XÓA ẢNH NÀY!
- KHÔNG thay đổi đường link (URL) của hình ảnh.
- Tự động lọc và xóa TOÀN BỘ các đường dẫn/link thông thường (không phải ảnh) để bài viết sạch sẽ. Khỏi thêm chữ "tại đây" hoặc chèn link ẩn.

Quy t?c ch?t l??ng:
- Không dùng thủ thuật SEO mũ đen.
- Không lặp từ khóa quá mức.
- Ưu tiên trải nghiệm người đọc.
- Giữ văn phong chuyên nghiệp, rõ ràng, đáng tin cậy.
`.trim();

function decodeHtmlEntities(input: string) {
  return he.decode(String(input || ""));
}

function stripHtmlTags(input: string) {
  return String(input || "").replace(/<[^>]+>/g, " ");
}

function normalizeSpaces(input: string) {
  return String(input || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizePlainText(input: string) {
  return normalizeSpaces(decodeHtmlEntities(stripHtmlTags(input)));
}

function normalizeForKeyword(input: string) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d");
}

function resolveBaseUrl(rawUrl?: string) {
  const url = String(rawUrl || "").trim();
  if (!url) {
    return null;
  }
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function normalizeUrl(rawUrl: string, baseUrl?: URL | null) {
  const cleaned = String(rawUrl || "")
    .trim()
    .replace(/^["'(<]+/, "")
    .replace(/[>'"),.;!?]+$/, "");
  if (!cleaned || /^data:/i.test(cleaned)) {
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

function isImageUrl(url: string) {
  const value = String(url || "").trim().toLowerCase();
  if (!value) {
    return false;
  }
  if (IMAGE_EXTENSIONS.some((ext) => value.includes(`${ext}?`) || value.endsWith(ext))) {
    return true;
  }
  return /[?&](format|fm|ext|type)=(jpg|jpeg|png|webp|gif|svg|avif|bmp)/i.test(value);
}

function extractTagAttribute(tag: string, attr: string) {
  const safeAttr = String(attr || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(tag || "").match(
    new RegExp(`(?:^|\\s)${safeAttr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  );
  return String(match?.[1] || match?.[2] || match?.[3] || "").trim();
}

function pickBestSrcsetUrl(srcset: string) {
  const candidates = String(srcset || "")
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
  return candidates[candidates.length - 1] || "";
}

function extractImageSourceFromTag(tag: string, baseUrl?: URL | null) {
  const attrs = ["data-src", "data-lazy-src", "data-original", "data-image", "src"];
  for (const attr of attrs) {
    const value = extractTagAttribute(tag, attr);
    const normalized = normalizeUrl(value, baseUrl);
    if (normalized && isImageUrl(normalized)) {
      return normalized;
    }
  }
  const srcsetUrl = normalizeUrl(
    pickBestSrcsetUrl(extractTagAttribute(tag, "data-srcset") || extractTagAttribute(tag, "srcset")),
    baseUrl
  );
  return isImageUrl(srcsetUrl) ? srcsetUrl : "";
}

function isLikelyNoiseImageUrl(url: string) {
  const value = String(url || "").trim().toLowerCase();
  if (!value) {
    return true;
  }
  let filename = value;
  try {
    filename = decodeURIComponent(new URL(value).pathname.split("/").pop() || value);
  } catch {
    filename = value.split("?")[0].split("#")[0].split("/").pop() || value;
  }
  const stem = filename.replace(/\.(?:jpe?g|png|webp|gif|svg|avif|bmp|heic|heif|tiff?)$/i, "");
  if (/(^|[-_.\s])(?:logo|favicon|sprite|icon|avatar|placeholder|loading|blank|transparent|pixel|share|social|default|noimage)(?:[-_.\s]|$)/i.test(stem)) {
    return true;
  }
  if (/[?&](?:width|w|height|h)=(?:1|2|8|16|24|32|48|64)(?:&|$)/i.test(value)) {
    return true;
  }
  return false;
}

function normalizeImageUrls(rawUrls: unknown[], baseUrl?: URL | null, limit = 80) {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const raw of rawUrls) {
    const normalized = normalizeUrl(String(raw || ""), baseUrl);
    if (!normalized || !isImageUrl(normalized) || isLikelyNoiseImageUrl(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(normalized);
    if (unique.length >= limit) {
      break;
    }
  }
  return unique;
}

function extractMetaContent(html: string, key: string) {
  const safeKey = String(key || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${safeKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${safeKey}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1]).trim();
    }
  }
  return "";
}

function extractTitle(html: string) {
  const ogTitle = extractMetaContent(html, "og:title");
  if (ogTitle) {
    return ogTitle;
  }
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch?.[1]) {
    return "";
  }
  return sanitizePlainText(titleMatch[1]);
}

function extractImageUrlsFromHtml(html: string, baseUrl: URL) {
  const candidates: string[] = [];
  for (const match of Array.from(html.matchAll(/<img\b[^>]*>/gi))) {
    const tag = match[0] || "";
    candidates.push(extractImageSourceFromTag(tag, baseUrl));
  }
  for (const match of Array.from(html.matchAll(/<source\b[^>]*>/gi))) {
    const tag = match[0] || "";
    candidates.push(pickBestSrcsetUrl(extractTagAttribute(tag, "srcset") || extractTagAttribute(tag, "data-srcset")));
  }
  return normalizeImageUrls(candidates, baseUrl, 80);
}

function extractImageUrlsFromText(input: string, baseUrl?: URL | null) {
  const candidates: string[] = [];
  const text = String(input || "");
  for (const match of Array.from(text.matchAll(/!\[[^\]]*]\(([^)]+)\)/g))) {
    if (match[1]) {
      candidates.push(match[1]);
    }
  }
  for (const match of Array.from(text.matchAll(/https?:\/\/[^\s<>"'`\])]+/gi))) {
    if (match[0]) {
      candidates.push(match[0]);
    }
  }
  return normalizeImageUrls(candidates, baseUrl, 80);
}

function appendImageUrlsToContent(content: string, imageUrls: string[]) {
  const normalizedContent = sanitizeNewsContent(content);
  if (imageUrls.length === 0) {
    return normalizedContent;
  }
  const existing = new Set(extractImageUrlsFromText(normalizedContent));
  const missing = imageUrls.filter((url) => !existing.has(url));
  if (missing.length === 0) {
    return normalizedContent;
  }
  const imageBlock = missing.map((url) => `![Ảnh bài viết](${url})`).join("\n");
  const result = normalizedContent
    ? `${normalizedContent}\n\nẢnh bài viết:\n${imageBlock}`
    : `Ảnh bài viết:\n${imageBlock}`;
  return sanitizeNewsContent(result);
}

function extractMainContent(html: string) {
  // Try article element
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch?.[1]) {
    const articleText = sanitizePlainText(articleMatch[1]);
    if (articleText.length >= 120) {
      return articleText;
    }
  }
  // Try div-based article containers
  const divPatterns = [
    /<div[^>]*class="[^"]*(?:article|post|entry|content|story|detail|news)[^"]*"[^>]*>([\s\S]*?)<\/div>(?=[\s\S]*<div[^>]*class="[^"]*(?:article|post|entry|content|story|detail|news)[^"]*")/gi,
  ];
  // Strip known noise and get body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch?.[1]) {
    return sanitizePlainText(
      bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    );
  }
  return sanitizePlainText(html);
}

function toWords(input: string) {
  return normalizeForKeyword(input)
    .replace(/[^0-9a-z\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

export function extractKeywords(input: string, limit = 12) {
  const words = toWords(input);
  const frequency = new Map<string, number>();
  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(1, Math.min(50, limit)))
    .map(([word]) => word);
}

export function slugifyNewsTitle(input: string) {
  const base = normalizeForKeyword(input)
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `news-${Date.now()}`;
}

export function sanitizeNewsContent(input: string) {
  return normalizeSpaces(String(input || "").replace(/\r\n/g, "\n"));
}

export function buildExcerpt(input: string, maxChars = 180) {
  const text = sanitizePlainText(input);
  if (!text) {
    return "";
  }
  const safeMax = Math.max(60, Math.min(300, Math.floor(maxChars || 180)));
  if (text.length <= safeMax) {
    return text;
  }
  return `${text.slice(0, safeMax).replace(/[\s,.;:!?-]+$/g, "").trim()}...`;
}

export function safeParseJsonList(value: unknown, limit = 20) {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit || 20)));
  if (Array.isArray(value)) {
    return normalizeListInput(value, safeLimit);
  }
  const raw = String(value || "").trim();
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return normalizeListInput(parsed, safeLimit);
  } catch {
    return normalizeListInput(raw.split(","), safeLimit);
  }
}

export function normalizeListInput(value: unknown, limit = 20) {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit || 20)));
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,]/g)
      : [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of values) {
    const normalized = sanitizePlainText(String(item || ""));
    if (!normalized) {
      continue;
    }
    const key = normalizeForKeyword(normalized);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
    if (result.length >= safeLimit) {
      break;
    }
  }
  return result;
}

function buildTagsFromKeywords(keywords: string[], limit = 8) {
  return normalizeListInput(keywords, limit);
}

function fallbackRewrite(
  input: RewriteInput,
  promptUsed: string,
  warning: string | null,
  sourceImageUrls: string[]
): RewriteResult {
  const sourceTitle = normalizeSpaces(String(input.title || ""));
  const sourceContent = sanitizeNewsContent(String(input.content || ""));
  const content = appendImageUrlsToContent(sourceContent, sourceImageUrls);
  const title = sourceTitle || "Bài viết tin tức";
  const excerpt = buildExcerpt(content, 180);
  const keywords = extractKeywords(`${title}\n${content}`, 10);
  const tags = buildTagsFromKeywords(keywords, 6);
  const imageUrls = extractImageUrlsFromText(content, resolveBaseUrl(input.sourceUrl));
  return {
    title,
    excerpt,
    content,
    keywords,
    tags,
    provider: "fallback",
    model: "fallback",
    imageUrls,
    promptUsed,
    warning,
  };
}

function parseAiJsonContent(rawContent: string) {
  const text = String(rawContent || "").trim();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(text.slice(first, last + 1)) as Record<string, unknown>;
    }
    return null;
  }
}

async function getRewriteRuntime(): Promise<RewriteRuntime> {
  const config = await getNewsAiConfig();
  const provider = config.provider;
  const model = String(config.model || "").trim();
  const apiKey =
    provider === "groq"
      ? String(config.groqApiKey || "").trim()
      : provider === "mistral"
        ? String(config.mistralApiKey || "").trim()
        : String(config.openrouterApiKey || "").trim();

  if (provider === "groq") {
    return {
      provider,
      model,
      apiKey,
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    };
  }
  if (provider === "mistral") {
    return {
      provider,
      model,
      apiKey,
      endpoint: "https://api.mistral.ai/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    };
  }
  return {
    provider,
    model,
    apiKey,
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEWS_AI_REFERER || process.env.NEXT_PUBLIC_SITE_URL || "https://localhost",
      "X-Title": process.env.NEWS_AI_APP_NAME || "News Admin",
    },
  };
}

function buildRewriteUserPayload(input: RewriteInput, sourceImageUrls: string[]) {
  const sourceUrl = String(input.sourceUrl || "N/A").trim();
  const sourceTitle = String(input.title || "").trim();
  const sourceContent = String(input.content || "");
  const imageBlock =
    sourceImageUrls.length > 0
      ? `Danh sách link ảnh bắt buộc giữ lại:\n${sourceImageUrls.join("\n")}`
      : "Danh sách link ảnh bắt buộc giữ lại: Không có";
  return [
    `Nguồn bài viết: ${sourceUrl}`,
    `Tiêu đề gốc:\n${sourceTitle}`,
    `Nội dung gốc:\n${sourceContent}`,
    imageBlock,
  ].join("\n\n");
}

function extractProviderErrorMessage(rawText: string) {
  const text = String(rawText || "").trim();
  if (!text) {
    return "Lỗi không xác định";
  }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const errorNode =
      (parsed.error as Record<string, unknown> | undefined) ||
      (parsed.data as Record<string, unknown> | undefined) ||
      parsed;
    const message = String(
      errorNode?.message ||
        errorNode?.error ||
        (errorNode as Record<string, unknown>)?.detail ||
        ""
    ).trim();
    if (message) {
      return message;
    }
  } catch {
    // trả về text thuần nếu không parse được JSON
  }
  return text.length > 300 ? `${text.slice(0, 300)}...` : text;
}

async function callRewriteModel(params: {
  runtime: RewriteRuntime;
  promptUsed: string;
  userPayload: string;
  useJsonResponseFormat: boolean;
}) {
  const { runtime, promptUsed, userPayload, useJsonResponseFormat } = params;
  const requestBody: Record<string, unknown> = {
    model: runtime.model,
    temperature: 0.2,
    messages: [
      { role: "system", content: promptUsed },
      { role: "user", content: userPayload },
    ],
  };
  if (useJsonResponseFormat) {
    requestBody.response_format = { type: "json_object" };
  }
  const response = await fetch(runtime.endpoint, {
    method: "POST",
    headers: runtime.headers,
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });
  const rawText = await response.text();
  if (!response.ok) {
    const providerMessage = extractProviderErrorMessage(rawText);
    throw new Error(`${runtime.provider.toUpperCase()} HTTP ${response.status}: ${providerMessage}`);
  }
  let parsedJson: Record<string, any> = {};
  try {
    parsedJson = JSON.parse(rawText) as Record<string, any>;
  } catch {
    throw new Error(`${runtime.provider.toUpperCase()} trả về dữ liệu không phải JSON hợp lệ`);
  }
  const messageContent = parsedJson?.choices?.[0]?.message?.content;
  return Array.isArray(messageContent)
    ? messageContent.map((part) => String(part?.text || part?.content || "")).join("\n")
    : String(messageContent || "");
}

/**
 * Lấy nội dung từ URL sử dụng Puppeteer (Chrome không hiện).
 * Hỗ trợ các trang SPA/SSR bằng cách cho JavaScript render trước khi lấy nội dung.
 */
export async function crawlArticleFromUrl(rawUrl: string): Promise<CrawlResult> {
  const url = String(rawUrl || "").trim();
  if (!url) {
    throw new Error("Thiếu URL cần cào bài viết");
  }
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("URL không hợp lệ");
  }

  let browser: Browser | null = null;
  let page: Awaited<ReturnType<Browser["newPage"]>> | null = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    });

    // An bot detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      // @ts-expect-error chrome runtime
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, "languages", { get: () => ["vi-VN", "vi", "en-US", "en"] });
    });

    const response = await page.goto(parsed.toString(), {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const status = response?.status() || 0;
    if (status >= 400) {
      throw new Error(`Trang trả về lỗi HTTP ${status}`);
    }

    // Cho JS render nội dung
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Scroll to bottom to trigger lazy loading and infinite scroll
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const scrollH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const step = Math.max(500, window.innerHeight);
      for (let y = 0; y <= scrollH; y += step) {
        window.scrollTo(0, Math.min(y, scrollH));
        await delay(400);
      }
      window.scrollTo(0, 0);
      await delay(600);
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const html = await page.content();
    if (!html || html.length < 500) {
      throw new Error("Không nhận được nội dung từ trang. Trang có thể chặn bot.");
    }

    // Kiem tra Cloudflare
    const cfCheck = await page.evaluate(() => {
      const title = document.title.toLowerCase();
      const bodyText = document.body?.textContent?.toLowerCase() || "";
      return (
        title.includes("checking your browser") ||
        title.includes("cloudflare") ||
        bodyText.includes("checking your browser") ||
        bodyText.includes("ray id") ||
        bodyText.includes("dismissible-whitelist-onboarding-modal")
      );
    });
    if (cfCheck) {
      throw new Error("Trang bị Cloudflare chặn. Vui lòng thử lại sau hoặc truy cập trực tiếp trên trình duyệt.");
    }

    const title = extractTitle(html) || parsed.hostname;

    // Trích xuất nội dung bằng cách tìm block bài viết chính xác nhất
    const extractResult = await page.evaluate(() => {
      // Bước 1: Loại bỏ noise trước để giảm nhiễu
      const noiseSelectors = [
        // HTML elements không liên quan
        "script", "style", "noscript", "iframe", "svg", "button", "form",
        "input", "textarea", "select", "canvas", "video", "audio",
        // Structural noise
        "nav", "footer", "header", "aside",
        // ARIA roles
        "[role='complementary']", "[role='navigation']", "[role='banner']",
        "[role='contentinfo']", "[role='search']", "[role='menu']",
        "[role='menubar']", "[role='toolbar']",
        // Sidebar & widgets
        ".sidebar", ".side-bar", ".widget", ".widget-area",
        // Ads
        ".advertisement", ".ads", ".ad", ".ad-wrapper", ".adsbygoogle",
        "[id*='google_ads']", "[class*='quangcao']", "[id*='quangcao']",
        ".sponsored", ".promo-block",
        // Comments & social
        ".comment", ".comments", ".comment-section", ".comment-list",
        ".fb-comments", ".fb-like", ".social-share", ".social-plugin",
        ".social", ".share", ".sharing", ".share-buttons",
        // Navigation elements
        ".breadcrumb", ".breadcrumbs", ".pagination", ".paging",
        ".menu", ".nav", ".navbar", ".header", ".footer",
        ".top-bar", ".topbar", ".bottom-bar",
        ".mobile-nav", ".mobile-menu",
        // Related articles (KEY for Vietnamese news sites)
        ".related", ".related-post", ".related-posts", ".related-news",
        ".related-articles", ".relate-news", ".relate-post",
        ".tin-lien-quan", ".bai-viet-lien-quan",
        ".knc-relate", ".kbwc-related", ".knc-related",
        ".box-related", ".box-relate",
        ".list-news-subfolder", ".list-relate",
        ".VCSortableIn498", // VCCorp related widget (GameK, Kenh14, etc)
        "[data-component='related']",
        ".link-content-footer", ".link-source-wrapper", "#urlSourceGamek",
        ".link-source-detail", ".link-source-name",
        // Vietnamese news site specific noise
        ".tags-wrapper", ".tag-wrapper", ".box-tags", ".tags",
        ".author-info", ".author-box", ".source-box",
        ".copyright", ".copy-right",
        ".newsletter", ".subscribe", ".popup", ".modal",
        ".sticky-ad", ".floating-ad",
        // Popular/trending/hot sections
        ".trending", ".popular", ".most-read", ".hot-news",
        ".box-category", ".category-list",
        // VCCorp network sites (GameK, CafeF, Kenh14, etc.)
        ".inner-sidebar", ".kbwscroll", ".kbwc-sidebar",
        ".kbwc-header", ".kbwc-footer", ".kbwc-nav",
        ".middle-comment", ".middle-relate",
        // Other common noise
        ".read-more", ".readmore", ".see-more", ".xem-them",
        ".back-to-top", ".go-top",
        ".rating-box", ".vote-box",
        ".print-btn", ".print-button",
      ];

      const clone = document.body.cloneNode(true) as HTMLElement;
      noiseSelectors.forEach((sel) => {
        try {
          clone.querySelectorAll(sel).forEach((n) => n.remove());
        } catch {}
      });

      // Also remove elements with "related" or "sidebar" in id/class
      try {
        clone.querySelectorAll("*").forEach((el) => {
          const cls = (el.className || "").toString().toLowerCase();
          const id = (el.id || "").toLowerCase();
          const combined = `${cls} ${id}`;
          if (
            (/\brelat(?:ed|e)\b/.test(combined) ||
             /\bsidebar\b/.test(combined) ||
             /\bfooter\b/.test(combined) ||
             /\bbreadcrumb\b/.test(combined) ||
             /\bpaginat(?:ion|e)\b/.test(combined) ||
             /\bads?\b/.test(combined) && el.querySelectorAll("p").length === 0 ||
             /\bcomment\b/.test(combined) ||
             /\bsocial\b/.test(combined) ||
             /\bshare\b/.test(combined) && !/share-content/.test(combined) ||
             /\bnewsletter\b/.test(combined) ||
             /\bsubscri(?:be|ption)\b/.test(combined) ||
             /\btag-list\b/.test(combined) ||
             /\btin-lien-quan\b/.test(combined)) &&
            // Don't remove if it's likely the main content
            !/\barticle.?body\b/.test(combined) &&
            !/\brightdetail_content\b/.test(combined) &&
            !/\bdetailsmallcontent\b/.test(combined) &&
            !/\bcontent.?detail\b/.test(combined) &&
            !/\bfck_detail\b/.test(combined)
          ) {
            el.remove();
          }
        });
      } catch {}

      // Bước 2: Tìm container bài viết chính (Readability-style scoring)
      const candidates: Array<{ el: Element; score: number; priority: number }> = [];

      // Helper: Tính link-text ratio (tỉ lệ text nằm trong links)
      function getLinkTextRatio(el: Element): number {
        const totalText = el.textContent?.trim() || "";
        if (!totalText) return 1;
        let linkTextLen = 0;
        el.querySelectorAll("a").forEach((a) => {
          linkTextLen += (a.textContent?.trim() || "").length;
        });
        return linkTextLen / totalText.length;
      }

      // Helper: Đếm paragraphs có nội dung thực (>30 chars)
      function countContentParagraphs(el: Element): number {
        let count = 0;
        el.querySelectorAll("p").forEach((p) => {
          if ((p.textContent?.trim() || "").length > 30) count++;
        });
        return count;
      }

      function getElementSignature(el: Element): string {
        return `${el.tagName.toLowerCase()} ${(el.getAttribute("class") || "").toLowerCase()} ${(el.id || "").toLowerCase()}`;
      }

      function isBroadPageContainer(el: Element): boolean {
        const signature = getElementSignature(el);
        return (
          el.tagName.toLowerCase() === "main" ||
          /\b(?:container|wrapper|layout|page|site|content-wrapper|main-content)\b/.test(signature)
        );
      }

      function hasNestedArticleContainer(el: Element): boolean {
        return Boolean(
          el.querySelector(
            "[itemprop='articleBody'], [data-field='body'][data-role='content'], .rightdetail_content, .detailsmallcontent, .fck_detail, .article-body, .article-content, .article__body, .article__content, .content-detail, .content-body, .detail-content, .detail-body, .news-content, .post-content, .entry-content, .story-content"
          )
        );
      }

      // Các selector ưu tiên cao - thường là container bài viết chính
      const highPrioritySelectors = [
        // Ưu tiên cao nhất - article body selectors
        "[itemprop='articleBody']",
        "[data-field='body'][data-role='content']",
        ".rightdetail_content",
        ".detailsmallcontent",
        ".fck_detail",  // VCCorp network (GameK, CafeF, Kenh14)
        ".article-body", ".article-content", ".article__body", ".article__content",
        ".article-detail", ".article-detail-content", ".article-body-content",
        "[data-type='ContentDetail']",
        // Content detail selectors
        ".content-detail", ".content-body", ".content__body", ".content__detail",
        ".detail-content", ".detail-body", ".detail__content", ".detail__body",
        ".news-content", ".news-detail", ".news-body",
        // Post/entry selectors
        ".post-content", ".post-body", ".post__body", ".post__content",
        ".entry-content", ".entry-body", ".entry__content",
        // Story/blog selectors
        ".story-content", ".story-body",
        ".cms-content", ".blog-content", ".blog-body",
        ".description-content", ".description-body",
        ".content-kb", ".kb-content",
        // Generic article/main
        "article",
        "[itemtype*='Article']",
        ".single-content", ".single-body",
        "main",
      ];

      for (const sel of highPrioritySelectors) {
        try {
          const els = Array.from(clone.querySelectorAll(sel));
          for (const el of els) {
            const text = el.textContent?.trim() || "";
            if (text.length < 200) continue;

            const linkTextRatio = getLinkTextRatio(el);
            // Nếu >50% text nằm trong links → skip (đây là nav, không phải bài viết)
            if (linkTextRatio > 0.5) continue;

            const contentParagraphs = countContentParagraphs(el);
            if (contentParagraphs < 2 && text.length < 500) continue;
            const imgs = el.querySelectorAll("img");
            const links = el.querySelectorAll("a");
            const listItems = el.querySelectorAll("li");

            // Tính điểm
            let score = text.length;

            // Strong penalty cho link density
            const linkDensity = links.length / Math.max(1, text.length / 100);
            score -= linkDensity * 80;

            // Strong penalty cho link-text ratio
            score -= linkTextRatio * text.length * 0.5;

            // Penalize list-heavy containers (nav menus)
            const listDensity = listItems.length / Math.max(1, text.length / 100);
            score -= listDensity * 50;

            if (isBroadPageContainer(el)) {
              score *= hasNestedArticleContainer(el) ? 0.15 : 0.35;
            }

            if (contentParagraphs > 0) {
              score = score / Math.max(1, text.length / Math.max(1, contentParagraphs * 900));
            }

            // Bonus lớn cho paragraphs có nội dung (đặc trưng bài viết)
            score += contentParagraphs * 40;

            // Bonus cho hình ảnh
            score += imgs.length * 20;

            // Priority boost cho các selector cụ thể hơn
            const priority =
              sel === "[itemprop='articleBody']" || sel === ".fck_detail" ? 5 :
              sel.includes("article") || sel.includes("detail") || sel.includes("content") ? 4 :
              sel === "main" ? 0 : 1;

            candidates.push({ el, score, priority });
          }
        } catch {}
      }

      // Tìm element có điểm cao nhất, ưu tiên priority cao hơn
      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          // Nếu priority khác nhau đáng kể, ưu tiên priority cao hơn
          if (a.priority !== b.priority) {
            // Chỉ ưu tiên priority nếu score không chênh lệch quá lớn
            const scoreDiff = Math.abs(a.score - b.score);
            const avgScore = (Math.abs(a.score) + Math.abs(b.score)) / 2;
            if (scoreDiff < avgScore * 0.3) {
              return b.priority - a.priority;
            }
          }
          return b.score - a.score;
        });
        const best = candidates[0].el;

        // Post-cleanup: Xóa noise còn sót trong best element (AGGRESSIVE)
        try {
          // 1. Xóa theo CSS selector cụ thể
          const postCleanupSelectors = [
            // Related/tin liên quan
            ".related", ".relate", ".tin-lien-quan", ".box-related", ".box-relate",
            ".knc-relate", ".kbwc-related", ".knc-related", ".VCSortableIn498",
            ".list-news-subfolder", ".middle-relate", ".list-relate",
            "[data-component='related']",
            ".link-content-footer", ".link-source-wrapper", "#urlSourceGamek",
            ".link-source-detail", ".link-source-name",
            // Tags
            ".tag-wrapper", ".tags-wrapper", ".tags", ".box-tags", ".tag-list",
            // Social/share
            ".social-share", ".share", ".sharing", ".share-buttons", ".social-plugin",
            ".fb-comments", ".fb-like", ".social",
            // Author/source
            ".source", ".source-box", ".author", ".author-info", ".author-box",
            // Nav/menu/breadcrumb
            ".breadcrumb", ".breadcrumbs", ".menu", ".nav", ".navbar",
            ".pagination", ".paging",
            // Ads
            ".ads", ".ad", ".advertisement", ".adsbygoogle", ".sponsored",
            // Category/trending boxes
            ".box-category", ".category-list", ".trending", ".popular",
            ".most-read", ".hot-news",
            // VCCorp specific
            ".kbwscroll", ".kbwc-sidebar", ".kbwc-header", ".kbwc-footer",
            ".kbwc-nav", ".middle-comment", ".inner-sidebar",
            ".VCSortableIn498",
            // Read more / xem thêm
            ".read-more", ".readmore", ".see-more", ".xem-them",
            // Header/footer/aside
            "nav", "footer", "header", "aside",
            // Comment sections
            ".comment", ".comments", ".comment-section",
            // Rating/vote
            ".rating-box", ".vote-box",
            // Newsletter
            ".newsletter", ".subscribe",
            // Copyright
            ".copyright", ".copy-right",
          ];
          postCleanupSelectors.forEach(sel => {
            try { best.querySelectorAll(sel).forEach(n => n.remove()); } catch {}
          });

          // 2. Xóa elements có class/id chứa keyword noise
          best.querySelectorAll("*").forEach(el => {
            const cls = (el.className || "").toString().toLowerCase();
            const id = (el.id || "").toLowerCase();
            const combined = `${cls} ${id}`;
            if (
              /\brelat(?:ed|e)\b/.test(combined) ||
              /\bsidebar\b/.test(combined) ||
              /\bfooter\b/.test(combined) ||
              /\bheader\b/.test(combined) ||
              /\bbreadcrumb\b/.test(combined) ||
              /\bcomment\b/.test(combined) ||
              /\bsocial\b/.test(combined) ||
              /\bnewsletter\b/.test(combined) ||
              /\btag-list\b/.test(combined) ||
              /\btags?\b/.test(combined) && !/\bfck/.test(combined) ||
              /\btin-lien-quan\b/.test(combined) ||
              /\blink-content-footer\b/.test(combined) ||
              /\blink-source\b/.test(combined) ||
              /\burlsourcegamek\b/.test(combined) ||
              /\bxem-them\b/.test(combined) ||
              /\bback-to-top\b/.test(combined) ||
              /\bcopyright\b/.test(combined) ||
              /\btrending\b/.test(combined) ||
              /\bpopular\b/.test(combined) ||
              /\bmost-read\b/.test(combined) ||
              /\bhot-news\b/.test(combined) ||
              /\bcategory-list\b/.test(combined) ||
              /\bbox-category\b/.test(combined) ||
              /\bVCSortable\b/i.test(combined) ||
              /\bknc-relate\b/.test(combined) ||
              /\bmiddle-(?:comment|relate)\b/.test(combined) ||
              /\bkbwc-(?:sidebar|header|footer|nav)\b/.test(combined) ||
              /\binner-sidebar\b/.test(combined)
            ) {
              el.remove();
            }
          });

          // 3. Xóa elements có quá nhiều links (nav blocks lọt vào)
          best.querySelectorAll("div, ul, section").forEach(el => {
            const text = el.textContent?.trim() || "";
            if (text.length < 20) return;
            const links = el.querySelectorAll("a");
            if (links.length < 3) return;
            let linkTextLen = 0;
            links.forEach(a => { linkTextLen += (a.textContent?.trim() || "").length; });
            const ratio = linkTextLen / text.length;
            // Nếu >60% text là links → nav block → remove
            if (ratio > 0.6 && el.querySelectorAll("p").length === 0) {
              el.remove();
            }
          });
        } catch {}

        return {
          html: best.innerHTML,
          imgs: Array.from(best.querySelectorAll("img")).map((img) => img.outerHTML),
        };
      }

      // Fallback: tìm div/section có tỉ lệ paragraph/text tốt nhất
      const allElements = Array.from(clone.querySelectorAll("div, section, article"));
      let bestEl: Element | null = null;
      let bestScore = -Infinity;
      for (const el of allElements) {
        const text = el.textContent?.trim() || "";
        if (text.length < 200) continue;

        const linkTextRatio = getLinkTextRatio(el);
        if (linkTextRatio > 0.4) continue; // Skip link-heavy blocks

        const contentP = countContentParagraphs(el);
        if (contentP < 2) continue; // Cần ít nhất 2 paragraphs có nội dung

        let score = text.length;
        score -= linkTextRatio * text.length;
        score += contentP * 40;
        score += el.querySelectorAll("img").length * 20;

        // Penalize very large containers (likely page wrappers)
        const childDivs = el.querySelectorAll(":scope > div, :scope > section");
        if (childDivs.length > 8) score *= 0.6;

        if (score > bestScore) {
          bestScore = score;
          bestEl = el;
        }
      }

      if (bestEl && bestScore > 0) {
        return {
          html: bestEl.innerHTML,
          imgs: Array.from(bestEl.querySelectorAll("img")).map((img) => img.outerHTML),
        };
      }

      // Cuối cùng: lấy body (đã cleaned)
      return {
        html: clone.innerHTML,
        imgs: Array.from(clone.querySelectorAll("img")).map((img) => img.outerHTML),
      };
    });

    if (!extractResult.html || extractResult.html.length < 100) {
      throw new Error("Không cào được nội dung bài viết. Trang có thể chặn bot hoặc cần JavaScript.");
    }

    const articleImages = extractImageUrlsFromHtml(extractResult.html, parsed);
    const metaImages = normalizeImageUrls(
      [
        extractMetaContent(html, "og:image"),
        extractMetaContent(html, "twitter:image"),
      ],
      parsed,
      2
    );
    const normalizedImages = articleImages;
    const coverImage = normalizedImages[0] || metaImages[0] || "";

    const contentMarkdown = htmlToMarkdown(extractResult.html, parsed);
    if (sanitizePlainText(contentMarkdown).length < 80) {
      throw new Error("Không cào được nội dung bài viết. Trang có thể chặn bot hoặc cần JavaScript.");
    }
    const content = appendImageUrlsToContent(contentMarkdown, normalizedImages);
    const excerpt = buildExcerpt(extractMetaContent(html, "description") || sanitizePlainText(content), 180);
    const keywords = extractKeywords(`${title}\n${content}`, 12);
    const tags = buildTagsFromKeywords(keywords, 8);

    return {
      title,
      excerpt,
      content,
      coverImage,
      sourceUrl: parsed.toString(),
      keywords,
      tags,
      imageUrls: normalizedImages,
    };
  } catch (puppeteerError) {
    const outerError = puppeteerError instanceof Error ? puppeteerError : new Error(String(puppeteerError));
    if (_browser) {
      try { if (!_browser.connected) { try { await _browser.close(); } catch {} _browser = null; } } catch { _browser = null; }
    }
    try {
      const response = await fetch(parsed.toString(), {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw outerError;
      }

      const html = await response.text();
      const title = extractTitle(html) || parsed.hostname;
      const articleHtml = extractArticleHtml(html);
      const contentBase = htmlToMarkdown(articleHtml, parsed);
      if (contentBase.length < 80) {
        throw new Error("Không cào được nội dung bài viết. Trang có thể chặn bot hoặc tải nội dung bằng JavaScript.");
      }
      const imageUrls = extractImageUrlsFromHtml(articleHtml, parsed);
      const metaImages = normalizeImageUrls(
        [
          extractMetaContent(html, "og:image"),
          extractMetaContent(html, "twitter:image"),
        ],
        parsed,
        2
      );
      const coverImage = imageUrls[0] || metaImages[0] || "";
      const excerpt = buildExcerpt(extractMetaContent(html, "description") || contentBase, 180);
      const content = appendImageUrlsToContent(contentBase, imageUrls);
      const keywords = extractKeywords(`${title}\n${content}`, 12);
      const tags = buildTagsFromKeywords(keywords, 8);

      return {
        title,
        excerpt,
        content,
        coverImage,
        sourceUrl: parsed.toString(),
        keywords,
        tags,
        imageUrls,
      };
    } catch {
      throw outerError;
    }
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

export async function rewriteNewsWithAI(input: RewriteInput): Promise<RewriteResult> {
  const promptUsed = String(input.customPrompt || "").trim() || DEFAULT_AI_PROMPT;
  const baseUrl = resolveBaseUrl(input.sourceUrl);
  const sourceImageUrls = normalizeImageUrls(
    [
      ...(Array.isArray(input.imageUrls) ? input.imageUrls : []),
      ...extractImageUrlsFromText(String(input.content || ""), baseUrl),
    ],
    baseUrl,
    80
  );

  const runtime = await getRewriteRuntime();
  if (!runtime.model) {
    return fallbackRewrite(
      input,
      promptUsed,
      "Chưa cấu hình model AI cho module tin tức, hệ thống dùng chế độ viết lại dự phòng.",
      sourceImageUrls
    );
  }
  if (!runtime.apiKey) {
    return fallbackRewrite(
      input,
      promptUsed,
      `Chưa cấu hình API key ${runtime.provider.toUpperCase()}, hệ thống dùng chế độ viết lại dự phòng.`,
      sourceImageUrls
    );
  }

  try {
    const userPayload = buildRewriteUserPayload(input, sourceImageUrls);
    let parsed: Record<string, unknown> | null = null;
    let lastError: unknown = null;

    for (const useJsonResponseFormat of [true, false]) {
      try {
        const raw = await callRewriteModel({
          runtime,
          promptUsed,
          userPayload,
          useJsonResponseFormat,
        });
        parsed = parseAiJsonContent(raw);
        if (!parsed) {
          throw new Error("Không parse được JSON từ AI");
        }
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!parsed) {
      throw lastError instanceof Error ? lastError : new Error(String(lastError));
    }

    const title = normalizeSpaces(String(parsed.title || input.title || ""));
    const rewrittenContent = sanitizeNewsContent(String(parsed.content || input.content || ""));
    const content = appendImageUrlsToContent(rewrittenContent, sourceImageUrls);
    const excerpt = buildExcerpt(String(parsed.excerpt || content), 180);
    const keywordsRaw = normalizeListInput(parsed.keywords, 12);
    const tagsRaw = normalizeListInput(parsed.tags, 8);
    const fallbackKeywords = extractKeywords(`${title}\n${content}`, 10);
    const keywords = keywordsRaw.length > 0 ? keywordsRaw : fallbackKeywords;
    const tags = tagsRaw.length > 0 ? tagsRaw : buildTagsFromKeywords(keywords, 6);
    const imageUrls = extractImageUrlsFromText(content, baseUrl);

    return {
      title: title || String(input.title || "").trim() || "Bài viết tin tức",
      excerpt,
      content,
      keywords,
      tags,
      provider: runtime.provider,
      model: runtime.model,
      imageUrls,
      promptUsed,
      warning: null,
    };
  } catch (error) {
    return fallbackRewrite(
      input,
      promptUsed,
      `AI viết lại thất bại, đã dùng chế độ dự phòng: ${String(error)}`,
      sourceImageUrls
    );
  }
}

export const NEWS_AI_PROMPT_TEMPLATE = DEFAULT_AI_PROMPT;
