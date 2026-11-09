import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import bootstrap from './theme.js?raw';

const storageKey = '678estudio-theme';

function startPage(systemDark: boolean, storage: Map<string, string> | null = new Map()) {
  const system = Object.assign(new EventTarget(), { matches: systemDark });
  const root = { dataset: {} as { theme?: string } };
  const attributes = new Map<string, string>();
  const toggle = Object.assign(new EventTarget(), {
    hidden: true,
    title: '',
    setAttribute: (name: string, value: string) => attributes.set(name, value),
  });
  const document = Object.assign(new EventTarget(), {
    documentElement: root,
    getElementById: () => toggle,
  });
  const window = Object.assign(new EventTarget(), { matchMedia: () => system });
  const localStorage = {
    getItem(key: string) {
      if (!storage) throw new Error('Storage unavailable');
      return storage.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (!storage) throw new Error('Storage unavailable');
      storage.set(key, value);
    },
  };

  runInNewContext(bootstrap, { document, window, localStorage });

  return {
    root,
    toggle,
    attributes,
    ready: () => document.dispatchEvent(new Event('DOMContentLoaded')),
    click: () => toggle.dispatchEvent(new Event('click')),
    systemChange(dark: boolean) {
      system.matches = dark;
      system.dispatchEvent(new Event('change'));
    },
  };
}

describe('theme bootstrap', () => {
  it('applies the system preference before DOMContentLoaded and follows changes', () => {
    const page = startPage(false, new Map([[storageKey, 'invalid']]));
    expect(page.root.dataset.theme).toBe('light');
    page.ready();
    expect(page.toggle.hidden).toBe(false);
    page.systemChange(true);
    expect(page.root.dataset.theme).toBe('dark');
    expect(page.attributes.get('aria-pressed')).toBe('true');
  });

  it('persists the manual choice and gives it precedence on the next page', () => {
    const storage = new Map<string, string>();
    const page = startPage(true, storage);
    page.ready();
    page.click();
    expect(storage.get(storageKey)).toBe('light');
    expect(page.attributes.get('aria-pressed')).toBe('false');
    expect(startPage(true, storage).root.dataset.theme).toBe('light');
  });

  it('allows a manual choice on the page when storage is unavailable', () => {
    const page = startPage(false, null);
    page.ready();
    page.click();
    page.systemChange(false);
    expect(page.root.dataset.theme).toBe('dark');
  });
});
