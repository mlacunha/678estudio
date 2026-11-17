import { describe, expect, it } from 'vitest';
import {
  computeDeskBaseGeometry,
  computeDeskPageLayout,
  DEFAULT_DESK_BASE_FOLD_MM,
  DEFAULT_DESK_BASE_FRONT_HEIGHT_MM,
  DEFAULT_DESK_SHEET_HEIGHT_MM,
  DEFAULT_DESK_SHEET_WIDTH_MM,
  DEFAULT_DESK_WIREO_MARGIN_MM,
  resolveEffectiveBase,
} from './deskTemplates';
import type { DeskCalendarConfig } from './types';

function makeDeskConfig(overrides: Partial<DeskCalendarConfig> = {}): DeskCalendarConfig {
  return {
    year: 2027,
    sheetWidthMm: DEFAULT_DESK_SHEET_WIDTH_MM,
    sheetHeightMm: DEFAULT_DESK_SHEET_HEIGHT_MM,
    weekStart: 'sunday',
    templateId: 'institutional',
    includeCover: true,
    includeFederalHolidays: true,
    includeGoodFriday: false,
    includeBleed: false,
    wireOMarginMm: DEFAULT_DESK_WIREO_MARGIN_MM,
    advertiser: {
      name: 'Café Serra Alta',
      slogan: 'Torra artesanal desde 2010',
      phone: '(11) 3333-4444',
      whatsapp: '(11) 98888-7777',
      website: 'https://cafeserraalta.com.br',
      address: 'Rua das Palmeiras, 88',
      qrText: 'https://cafeserraalta.com.br',
      primaryColor: '#3f2305',
      accentColor: '#b45309',
      visibility: {
        showLogo: true,
        showName: true,
        showSlogan: true,
        showPhone: true,
        showWhatsapp: true,
        showWebsite: true,
        showAddress: true,
        showQrCode: true,
      },
    },
    base: {
      syncWithAdvertiser: true,
      primaryColor: '#1c1917',
      accentColor: '#b45309',
      name: '',
      slogan: '',
      phone: '',
      whatsapp: '',
      website: '',
      qrText: '',
      showLogo: true,
      showName: true,
      showSlogan: true,
      showPhone: true,
      showWhatsapp: true,
      showWebsite: true,
      showQrCode: true,
      frontHeightMm: DEFAULT_DESK_BASE_FRONT_HEIGHT_MM,
      foldAllowanceMm: DEFAULT_DESK_BASE_FOLD_MM,
    },
    sharedPlacement: { scale: 1, anchorX: 0.5, anchorY: 0.5 },
    ...overrides,
  };
}

describe('deskTemplates geometry', () => {
  it('it should compute 200x120 mm horizontal layout with Wire-O top reserve and parametrized dimensions', () => {
    const cfg = makeDeskConfig();
    const layout = computeDeskPageLayout(cfg, 1);
    expect(layout.trimWidthMm).toBe(200);
    expect(layout.trimHeightMm).toBe(120);
    expect(layout.wireOMarginMm).toBe(14);
    expect(layout.safeBox.y).toBeGreaterThanOrEqual(14);
    expect(layout.gridBox.x).toBeGreaterThan(layout.photoBox.x);

    const custom = computeDeskPageLayout(makeDeskConfig({ sheetWidthMm: 220, sheetHeightMm: 140, includeBleed: true }), 1);
    expect(custom.pageWidthMm).toBe(226);
    expect(custom.pageHeightMm).toBe(146);
  });

  it('it should allow base triangular config to inherit from advertiser or override independently', () => {
    const inherited = resolveEffectiveBase(makeDeskConfig());
    expect(inherited.name).toBe('Café Serra Alta');
    expect(inherited.primaryColor).toBe('#3f2305');

    const customCfg = makeDeskConfig({
      base: {
        ...makeDeskConfig().base,
        syncWithAdvertiser: false,
        name: 'Campanha Inverno 2027',
        primaryColor: '#0f172a',
      },
    });
    const customBase = resolveEffectiveBase(customCfg);
    expect(customBase.name).toBe('Campanha Inverno 2027');
    expect(customBase.primaryColor).toBe('#0f172a');

    const baseGeom = computeDeskBaseGeometry(customCfg);
    expect(baseGeom.trimWidthMm).toBe(200);
    expect(baseGeom.frontHeightMm).toBe(DEFAULT_DESK_BASE_FRONT_HEIGHT_MM);
    expect(baseGeom.foldAllowanceMm).toBe(DEFAULT_DESK_BASE_FOLD_MM);
  });
});
