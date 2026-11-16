import { describe, expect, it } from 'vitest';
import { computeBottomBarState, isKeyboardLikelyOpen } from './customizerMobileSteps';

describe('customizerMobileSteps helpers', () => {
  it('should compute contextual bottom bar state for each step', () => {
    expect(computeBottomBarState('arte')).toEqual({
      prevStep: null,
      prevLabel: '',
      nextStep: 'ajustes',
      nextLabel: 'Ajustes →',
      showPrimaryAction: false,
    });

    expect(computeBottomBarState('ajustes')).toEqual({
      prevStep: 'arte',
      prevLabel: '← Arte',
      nextStep: 'concluir',
      nextLabel: 'Concluir →',
      showPrimaryAction: false,
    });

    expect(computeBottomBarState('concluir', 'Gerar prévia')).toEqual({
      prevStep: 'ajustes',
      prevLabel: '← Ajustes',
      nextStep: null,
      nextLabel: 'Gerar prévia',
      showPrimaryAction: true,
    });
  });

  it('should detect virtual keyboard from visualViewport shrink or focused text input', () => {
    expect(isKeyboardLikelyOpen(420, 800)).toBe(true);
    expect(isKeyboardLikelyOpen(780, 800)).toBe(false);
    expect(isKeyboardLikelyOpen(780, 800, 'INPUT')).toBe(true);
    expect(isKeyboardLikelyOpen(780, 800, 'TEXTAREA')).toBe(true);
  });
});
