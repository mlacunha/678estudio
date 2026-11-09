export const GALLERY_PAGE_SIZE = 12;
export const MAX_GALLERY_PHOTOS = 8;
export const GALLERY_THUMB_SIZE = 480;
export const GALLERY_LARGE_SIZE = 1200;
export const GALLERY_ID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

export interface WorkFields {
  title: string;
  description: string;
  category: string;
  date: string;
  instagram: string;
  published: boolean;
  featured: boolean;
  order: number;
}

export function readWorkFields(form: FormData): WorkFields {
  const field = (key: string) => {
    const value = form.get(key);
    return typeof value === 'string' ? value.trim() : '';
  };
  const title = field('title');
  const description = field('description');
  const category = field('category');
  const date = field('date');
  const instagram = field('instagram');
  const order = Number(field('order') || '0');
  if (!title || title.length > 120 || description.length > 2000 || !/^[a-z0-9-]{1,64}$/.test(category)) {
    throw new Error('Confira o título, a descrição e a categoria.');
  }
  if (!Number.isInteger(order) || order < 0 || order > 9999) throw new Error('Informe uma ordem entre 0 e 9999.');
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date)) throw new Error('Informe uma data válida.');
  const link = instagram && instagramPostUrl(instagram);
  if (instagram && !link) throw new Error('Informe um link HTTPS de uma publicação do Instagram.');
  return {
    title, description, category, date, instagram: link || '', order,
    published: field('published') === 'on', featured: field('featured') === 'on',
  };
}

export function instagramPostUrl(value: string): string | undefined {
  if (value.length > 512 || !URL.canParse(value)) return;
  const url = new URL(value);
  if (url.protocol !== 'https:' || !['www.instagram.com', 'instagram.com'].includes(url.host) ||
      url.username || url.password || !/^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) return;
  return `https://www.instagram.com${url.pathname.replace(/\/$/, '')}/`;
}

export function galleryPhotoUrl(id: string, size: 'thumb' | 'large' = 'thumb', admin = false) {
  return `${admin ? '/admin' : ''}/trabalhos/imagem/${id}?tamanho=${size}`;
}
