export function slugifyWriterName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48);
}

export function generateWriterEmail(name: string, instanceId: string): string {
  const slug = slugifyWriterName(name) || 'writer';
  const instanceSegment = instanceId.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8) || 'site';
  const localPart = `${slug}.${instanceSegment}`.slice(0, 64);
  const domain = `writers.${instanceSegment}.example.com`;
  return `${localPart}@${domain}`;
}

export function normalizeWriterName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, 120);
}
