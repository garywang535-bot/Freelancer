/** 转义 HTML 特殊字符，防止邮件正文注入 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 将纯文本换行转为 HTML 段落 */
export function textToHtmlParagraphs(text: string): string {
  return escapeHtml(text)
    .split(/\n/)
    .map((line) => (line.trim() ? `<p style="margin:0 0 12px">${line}</p>` : "<br/>"))
    .join("");
}
