import type { APIRoute } from 'astro';
import { serveGalleryPhoto } from '../../../utils/galleryImages';
export const prerender = false;
export const GET: APIRoute = ({ request, params, url }) =>
  serveGalleryPhoto(request, params.id ?? '', url.searchParams.get('tamanho'));
