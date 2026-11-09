import { createClient } from '@libsql/client';
import { expect, it } from 'vitest';
import { getAllProducts } from './catalogRepository';
import { DEFAULT_STUDIO_SETTINGS, getStudioSettings, saveStudioSettings, validateStudioSettings } from './studioSettings';

it('reads and updates persisted settings without changing products', async () => {
  const client = createClient({ url: ':memory:' });
  try {
    const products = await getAllProducts(client);
    expect(await getStudioSettings(client)).toEqual(DEFAULT_STUDIO_SETTINGS);
    const first = validateStudioSettings({ ...DEFAULT_STUDIO_SETTINGS, whatsapp: '+1 (202) 555-0100', email: 'studio@example.test' });
    expect(first.errors).toEqual({});
    await saveStudioSettings(first.settings, client);
    expect(await getStudioSettings(client)).toEqual({ ...DEFAULT_STUDIO_SETTINGS, whatsapp: '12025550100', email: 'studio@example.test' });
    const second = validateStudioSettings({ ...first.settings, whatsapp: '+1 (202) 555-0101', instagram: '' });
    await saveStudioSettings(second.settings, client);
    expect(await getStudioSettings(client)).toMatchObject({ whatsapp: '12025550101', instagram: '' });
    expect(await getAllProducts(client)).toEqual(products);
  } finally {
    client.close();
  }
});

it('rejects local numbers, unrelated social URLs and malformed email addresses', () => {
  const { errors } = validateStudioSettings({
    whatsapp: '(11) 99999-9999',
    instagram: 'https://instagram.com.example.test/678estudio',
    facebook: 'javascript:alert(1)',
    email: 'nome@example.test?subject=outro',
  });
  expect(Object.keys(errors).sort()).toEqual(['email', 'facebook', 'instagram', 'whatsapp']);
});

it('accepts optional fields cleared and normalizes Brazilian country and area codes', () => {
  const empty = { whatsapp: '', instagram: '', facebook: '', email: '' };
  expect(validateStudioSettings(empty)).toEqual({ settings: empty, errors: {} });
  expect(validateStudioSettings({ ...empty, whatsapp: '+55 (11) 91234-5678' }).settings.whatsapp).toBe('5511912345678');
});
