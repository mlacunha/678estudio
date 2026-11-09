import type { Client } from '@libsql/client';
import { getDbClient, initDatabase } from './database';
import { normalizeWhatsAppNumber } from '../utils/whatsapp';

export const DEFAULT_STUDIO_SETTINGS = {
  whatsapp: '',
  instagram: 'https://www.instagram.com/678estudio/',
  facebook: '',
  email: '',
};

export type StudioSettings = typeof DEFAULT_STUDIO_SETTINGS;
export const STUDIO_FIELDS = ['whatsapp', 'instagram', 'facebook', 'email'] as const;

function socialUrl(value: string, network: 'instagram' | 'facebook'): string | undefined {
  if (!value) return '';
  const url = URL.canParse(value) ? new URL(value) : undefined;
  const host = url?.hostname.replace(/^(www\.|m\.)/, '');
  if (!url || url.protocol !== 'https:' || host !== `${network}.com` ||
      url.username || url.password || url.port || url.pathname === '/') return undefined;
  return url.href;
}

export function validateStudioSettings(input: StudioSettings) {
  const whatsapp = !input.whatsapp ? ''
    : /^(\+|55)/.test(input.whatsapp) ? normalizeWhatsAppNumber(input.whatsapp) : undefined;
  const instagram = socialUrl(input.instagram, 'instagram');
  const facebook = socialUrl(input.facebook, 'facebook');
  const errors: Partial<Record<keyof StudioSettings, string>> = {};
  if (whatsapp === undefined) errors.whatsapp = 'Informe o número com +, código do país e DDD.';
  if (instagram === undefined) errors.instagram = 'Informe um endereço HTTPS de perfil do Instagram.';
  if (facebook === undefined) errors.facebook = 'Informe um endereço HTTPS de página ou perfil do Facebook.';
  if (input.email && !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(input.email)) {
    errors.email = 'Informe um endereço de e-mail válido.';
  }
  return { errors, settings: { whatsapp: whatsapp ?? '', instagram: instagram ?? '', facebook: facebook ?? '', email: input.email } };
}

export async function getStudioSettings(client: Client = getDbClient()): Promise<StudioSettings> {
  await initDatabase(client);
  const { rows: [row] } = await client.execute('SELECT whatsapp, instagram, facebook, email FROM site_settings WHERE id = 1');
  if (!row) return DEFAULT_STUDIO_SETTINGS;
  return { whatsapp: String(row.whatsapp), instagram: String(row.instagram), facebook: String(row.facebook), email: String(row.email) };
}

export async function saveStudioSettings(settings: StudioSettings, client: Client = getDbClient()): Promise<void> {
  await initDatabase(client);
  await client.execute({
    sql: `INSERT INTO site_settings (id, whatsapp, instagram, facebook, email) VALUES (1, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET whatsapp = excluded.whatsapp, instagram = excluded.instagram,
          facebook = excluded.facebook, email = excluded.email`,
    args: STUDIO_FIELDS.map(field => settings[field]),
  });
}

export function getRequestStudioSettings(locals: App.Locals): Promise<StudioSettings> {
  return locals.studioSettings ??= Promise.resolve().then(() => getStudioSettings()).catch(error => {
    console.error('Falha ao consultar configurações do estúdio', error);
    return { whatsapp: '', instagram: '', facebook: '', email: '' };
  });
}
