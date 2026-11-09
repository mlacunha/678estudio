export function getCatalogLargeImage(thumbnail: string): string | undefined {
  if (/^\/uploads\/catalog-[0-9a-f-]{36}\.webp$/.test(thumbnail)) {
    return thumbnail.replace(/\.webp$/, '-large.webp');
  }
}
