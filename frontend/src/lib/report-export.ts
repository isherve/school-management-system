export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (cell: string) => {
    const s = String(cell ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printReportHtml(title: string, schoolName: string, bodyHtml: string) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${title}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; margin: 24px; color: #111; }
  h1 { font-size: 1.35rem; margin: 0 0 4px; }
  .meta { color: #555; font-size: 0.85rem; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f3f4f6; }
  @media print { body { margin: 12mm; } }
</style></head><body>
  <h1>${title}</h1>
  <p class="meta">${schoolName} · ${new Date().toLocaleString()}</p>
  ${bodyHtml}
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
}

export function tableHtml(headers: string[], rows: string[][]): string {
  const head = headers.map((h) => `<th>${h}</th>`).join('');
  const body = rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
