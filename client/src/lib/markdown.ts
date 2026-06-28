export function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_: string, lang: string, code: string) => {
    const l = lang || '';
    return `<pre><code class="language-${l}">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // LaTeX block $$...$$
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_: string, math: string) =>
    `<div class="math-block" style="font-style:italic;padding:8px 0;overflow-x:auto;background:hsl(var(--muted));border-radius:6px;padding:8px 12px;margin:8px 0;">[math: ${math.trim()}]</div>`
  );

  // LaTeX inline $...$
  html = html.replace(/\$([^$\n]+)\$/g, (_: string, math: string) =>
    `<span class="math-inline" style="font-style:italic;background:hsl(var(--muted));padding:1px 4px;border-radius:3px;">[${math}]</span>`
  );

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Tables
  html = html.replace(/(\|.+\|\n)((?:\|[-:]+)+\|\n)((?:\|.+\|\n?)+)/g, (_: string, header: string, _sep: string, body: string) => {
    const headers = header.split('|').filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Unordered list items
  html = html.replace(/^(\s*)[-*+] (.+)$/gm, '$1<li>$2</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match: string) => `<ul>${match}</ul>`);

  // Ordered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // HR
  html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:1rem 0">');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Paragraphs
  html = html.split(/\n{2,}/).map((block: string) => {
    if (!block.trim()) return '';
    if (block.match(/^<(h[1-6]|ul|ol|pre|blockquote|table|hr|div)/)) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}
