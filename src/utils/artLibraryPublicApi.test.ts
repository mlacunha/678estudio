import { describe, expect, it } from 'vitest';
import { GET as getPublicList } from '../pages/api/artes/index';
import { GET as getPublicImage } from '../pages/api/artes/[id]/imagem';

describe('public art library API routes', () => {
  it('should require valid product on GET /api/artes', async () => {
    const res = await getPublicList({ url: new URL('https://example.test/api/artes') } as never);
    expect(res.status).toBe(400);
  });

  it('should forbid downloading original print files on public image route', async () => {
    const id = '11111111-2222-4333-8444-555555555555';
    const url = new URL(`https://example.test/api/artes/${id}/imagem?variante=orig`);
    const res = await getPublicImage({
      params: { id },
      url,
      request: new Request(url),
    } as never);
    expect(res.status).toBe(403);
  });
});

