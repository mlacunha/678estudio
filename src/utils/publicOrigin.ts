export function getPublicOrigin(fallback: string): string {
  const configured = process.env.PUBLIC_ORIGIN;
  if (!configured) return fallback;

  const url = new URL(configured);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_ORIGIN deve conter somente a origem HTTPS pública.');
  }

  return url.origin;
}
