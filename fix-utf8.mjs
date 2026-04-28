import fs from 'fs';

const filePath = 'lib/news.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const replacements = {
  // Line 159-161: STOP_WORDS
  159: '  "và", "là", "của", "cho", "với", "các", "những", "được", "đang",',
  160: '  "trong", "theo", "khi", "để", "từ", "một", "này", "đã", "thì",',
  161: '  "sẽ", "có", "không", "nên", "vào", "đến", "trên", "dưới", "cùng", "đó",',

  // Lines 167-190: DEFAULT_AI_PROMPT
  167: 'Bạn là biên tập viên SEO tiếng Việt cho website thương mại điện tử.',
  169: 'Mục tiêu:',
  170: '1) Viết lại tiêu đề và nội dung để dễ index, rõ nghĩa, tự nhiên, không nhồi nhét từ khóa.',
  171: '2) Giữ đúng ý chính của bài gốc, không bịa dữ kiện, không thêm thông tin không có trong bài.',
  172: '3) Tạo phiên bản thân thiện với Google: độc đáo, dễ đọc, cấu trúc rõ ràng, không spam.',
  174: 'Yêu cầu đầu ra dạng JSON hợp lệ với đúng các key:',
  175: '- title: string (50-70 ký tự, có từ khóa chính, tự nhiên)',
  176: '- excerpt: string (140-180 ký tự, tóm tắt hấp dẫn)',
  177: '- content: string (nội dung viết lại hoàn chỉnh, chia đoạn rõ ràng, có các tiêu đề phụ khi cần)',
  178: '- keywords: string[] (8-12 từ khóa liên quan trực tiếp nội dung)',
  179: '- tags: string[] (4-8 tag ngắn gọn, sát chủ đề)',
  181: 'Quy tắc liên kết và hình ảnh:',
  182: '- Bắt buộc giữ nguyên tất cả URL hình ảnh (jpg, jpeg, png, webp, gif, svg, avif...) có trong nội dung gốc.',
  183: '- Xóa toàn bộ URL không phải hình ảnh khỏi nội dung kết quả.',
  184: '- Không thêm link quảng cáo hoặc link ngoài không cần thiết.',
  187: '- Không dùng thủ thuật SEO mũ đen.',
  188: '- Không lặp từ khóa quá mức.',
  189: '- Ưu tiên trải nghiệm người đọc.',
  190: '- Giữ văn phong chuyên nghiệp, rõ ràng, đáng tin cậy.',

  // Lines 360-364: appendImageUrlsToContent
  360: '  const imageBlock = missing.map((url) => `![Ảnh bài viết](${url})`).join("\\n");',
  363: '    ? `${normalizedContent}\\n\\nẢnh bài viết:\\n${imageBlock}`',
  364: '    : `Ảnh bài viết:\\n${imageBlock}`;',

  // Line 491: fallbackRewrite title
  491: '  const title = sourceTitle || "Bài viết tin tức";',

  // Line 581: truncateForAi
  581: '  return `${clean.slice(0, maxChars).trim()}\\n\\n[Nội dung gốc đã được cắt bớt để tránh vượt giới hạn token của model.]`;',

  // Lines 590-591: buildRewriteUserPayload
  590: '      ? `Danh sách link ảnh bắt buộc giữ lại:\\n${sourceImageUrls.join("\\n")}`',
  591: '      : "Danh sách link ảnh bắt buộc giữ lại: Không có";',

  // Lines 593-594: buildRewriteUserPayload labels
  593: '    `Nguồn bài viết: ${sourceUrl}`,',
  594: '    `Tiêu đề gốc:\\n${sourceTitle}`,',
  595: '    `Nội dung gốc:\\n${sourceContent}`,',

  // Line 603: extractProviderErrorMessage
  603: '    return "Lỗi không xác định";',

  // Line 621: comment
  621: '    // trả về text thuần nếu không parse được JSON',

  // Line 659: callRewriteModel error
  659: '    throw new Error(`${runtime.provider.toUpperCase()} trả về dữ liệu không phải JSON hợp lệ`);',

  // Lines 668-669: JSDoc
  668: ' * Lấy nội dung từ URL sử dụng Puppeteer (Chrome không hiện).',
  669: ' * Hỗ trợ các trang SPA/SSR bằng cách cho JavaScript render trước khi lấy nội dung.',

  // Line 674: missing URL error
  674: '    throw new Error("Thiếu URL cần cào bài viết");',

  // Line 678: invalid URL error
  678: '    throw new Error("URL không hợp lệ");',

  // Line 710: HTTP error
  710: '      throw new Error(`Trang trả về lỗi HTTP ${status}`);',

  // Line 713: comment
  713: '    // Cho thêm thời gian để JS render nội dung',

  // Line 716: comment
  716: '    // Thu nhỏ màn hình để trigger lazy loading',

  // Line 738: no content error
  738: '      throw new Error("Không nhận được nội dung từ trang. Trang có thể chặn bot.");',

  // Line 741: comment
  741: '    // Kiểm tra trang Cloudflare',

  // Line 754: Cloudflare error
  754: '      throw new Error("Trang bị Cloudflare chặn. Vui lòng thử lại sau hoặc truy cập trực tiếp trên trình duyệt.");',

  // Line 759: comment
  759: '    // Trích xuất nội dung bằng DOM traversal',

  // Line 808: content empty error
  808: '      throw new Error("Không cào được nội dung bài viết. Trang có thể chặn bot hoặc cần JavaScript.");',

  // Line 811: comment
  811: '    // Trích xuất ảnh từ trang đã render',

  // Line 918: comment fallback
  918: '    // Fallback: thử fetch thuần nếu Puppeteer thất bại',

  // Line 949: fallback content error
  949: '        throw new Error("Không cào được nội dung bài viết. Trang có thể chặn bot hoặc tải nội dung bằng JavaScript.");',

  // Line 994: no model warning
  994: '      "Chưa cấu hình model AI cho module tin tức, hệ thống dùng chế độ viết lại dự phòng.",',

  // Line 1002: no API key warning
  1002: '      `Chưa cấu hình API key ${runtime.provider.toUpperCase()}, hệ thống dùng chế độ viết lại dự phòng.`,',

  // Line 1022: JSON parse error
  1022: '          throw new Error("Không parse được JSON từ AI");',

  // Line 1046: fallback title
  1046: '      title: title || String(input.title || "").trim() || "Bài viết tin tức",',

  // Line 1061: AI rewrite failure warning
  1061: '      `AI viết lại thất bại, đã dùng chế độ dự phòng: ${String(error)}`,',
};

let fixCount = 0;
for (const [lineNumStr, correctText] of Object.entries(replacements)) {
  const lineNum = Number(lineNumStr);
  const idx = lineNum - 1;
  if (idx < 0 || idx >= lines.length) {
    console.log(`SKIP line ${lineNum}: out of range`);
    continue;
  }

  const oldLine = lines[idx];
  // Preserve the leading whitespace from the original line
  const leadingWs = oldLine.match(/^(\s*)/)?.[1] || '';
  const newLine = leadingWs + correctText.trimStart();

  if (oldLine !== newLine) {
    lines[idx] = newLine;
    fixCount++;
    console.log(`FIXED line ${lineNum}`);
  } else {
    console.log(`OK    line ${lineNum} (already correct)`);
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log(`\nDone! Fixed ${fixCount} lines in ${filePath}`);
