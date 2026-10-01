/** Resolve API-relative or absolute file URLs for download links */
export function resolveFileUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  const origin = base.replace(/\/api\/v\d+$/, '');
  if (url.startsWith('/api/')) return `${origin}${url}`;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export function parseAttachment(raw: unknown): { fileName: string; fileUrl: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  if (typeof a.fileUrl === 'string') {
    return { fileUrl: a.fileUrl, fileName: String(a.fileName || 'assignment.pdf') };
  }
  return null;
}
