export type MobileStepId = 'arte' | 'ajustes' | 'concluir';

export interface MobileStepMeta {
  id: MobileStepId;
  label: string;
}

export interface BottomBarState {
  prevStep: MobileStepId | null;
  prevLabel: string;
  nextStep: MobileStepId | null;
  nextLabel: string;
  showPrimaryAction: boolean;
}

export const DEFAULT_MOBILE_STEPS: MobileStepMeta[] = [
  { id: 'arte', label: '1. Arte' },
  { id: 'ajustes', label: '2. Ajustes' },
  { id: 'concluir', label: '3. Concluir' },
];

/** Calcula os rótulos e destinos da barra inferior conforme a etapa ativa. */
export function computeBottomBarState(
  activeStep: MobileStepId,
  primaryActionLabel = 'Gerar prévia',
): BottomBarState {
  if (activeStep === 'arte') {
    return { prevStep: null, prevLabel: '', nextStep: 'ajustes', nextLabel: 'Ajustes →', showPrimaryAction: false };
  }
  if (activeStep === 'ajustes') {
    return { prevStep: 'arte', prevLabel: '← Arte', nextStep: 'concluir', nextLabel: 'Concluir →', showPrimaryAction: false };
  }
  return { prevStep: 'ajustes', prevLabel: '← Ajustes', nextStep: null, nextLabel: primaryActionLabel, showPrimaryAction: true };
}

/** Detecta abertura provável de teclado virtual pela redução da viewport visual. */
export function isKeyboardLikelyOpen(
  visualHeight: number,
  layoutHeight: number,
  activeTagName?: string,
): boolean {
  if (layoutHeight > 0 && visualHeight > 0 && visualHeight < layoutHeight * 0.78) {
    return true;
  }
  return activeTagName === 'INPUT' || activeTagName === 'TEXTAREA';
}

export interface MobileStepsController {
  getStep: () => MobileStepId;
  setStep: (step: MobileStepId) => void;
}

/** Conecta a barra de etapas mobile e a barra inferior contextual ao container do personalizador. */
export function initCustomizerMobileSteps(
  root: HTMLElement | null,
  options?: { onStepChange?: (step: MobileStepId) => void },
): MobileStepsController | null {
  if (!root) return null;

  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-mobile-step-tab]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-mobile-step-panel]'));
  const bottomBar = root.querySelector<HTMLElement>('[data-mobile-bottom-bar]');
  const btnPrev = root.querySelector<HTMLButtonElement>('[data-mobile-prev]');
  const btnNext = root.querySelector<HTMLButtonElement>('[data-mobile-next]');
  const primaryTargetSelector = root.dataset.mobilePrimaryTarget || '#btn-export-quote';
  const primaryActionLabel = root.dataset.mobilePrimaryLabel || 'Gerar prévia';
  const desktopQuery = window.matchMedia('(min-width: 1024px)');

  let activeStep: MobileStepId = 'arte';

  function syncUi(): void {
    const isDesktop = desktopQuery.matches;
    for (const tab of tabs) {
      const selected = tab.dataset.mobileStepTab === activeStep;
      tab.setAttribute('aria-selected', String(selected));
      for (const cls of ['bg-surface', 'text-ink', 'shadow-sm', 'border-accent']) {
        tab.classList.toggle(cls, selected);
      }
      tab.classList.toggle('text-ink-secondary', !selected);
    }

    for (const panel of panels) {
      const match = panel.dataset.mobileStepPanel === activeStep;
      panel.hidden = !isDesktop && !match;
    }

    const bar = computeBottomBarState(activeStep, primaryActionLabel);
    if (btnPrev) {
      btnPrev.hidden = !bar.prevStep;
      btnPrev.textContent = bar.prevLabel;
    }
    if (btnNext) {
      btnNext.textContent = bar.nextLabel;
      btnNext.dataset.mobileActionMode = bar.showPrimaryAction ? 'primary' : 'next';
    }
  }

  function setStep(step: MobileStepId): void {
    activeStep = step;
    syncUi();
    options?.onStepChange?.(step);
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const target = tab.dataset.mobileStepTab as MobileStepId | undefined;
      if (target) setStep(target);
    });
  }

  btnPrev?.addEventListener('click', () => {
    const { prevStep } = computeBottomBarState(activeStep, primaryActionLabel);
    if (prevStep) setStep(prevStep);
  });

  btnNext?.addEventListener('click', () => {
    const { nextStep, showPrimaryAction } = computeBottomBarState(activeStep, primaryActionLabel);
    if (nextStep) {
      setStep(nextStep);
      return;
    }
    if (showPrimaryAction) {
      const targetBtn = root.querySelector<HTMLButtonElement>(primaryTargetSelector);
      targetBtn?.click();
    }
  });

  const syncKeyboardState = (): void => {
    const activeEl = document.activeElement as HTMLElement | null;
    const isTextInput = activeEl instanceof HTMLInputElement
      ? !['range', 'radio', 'checkbox', 'file', 'button', 'submit'].includes(activeEl.type)
      : activeEl instanceof HTMLTextAreaElement;
    const open = !desktopQuery.matches && isKeyboardLikelyOpen(
      window.visualViewport?.height ?? window.innerHeight,
      window.innerHeight,
      isTextInput ? activeEl?.tagName : undefined,
    );
    root.dataset.keyboardOpen = String(open);
    if (bottomBar) bottomBar.classList.toggle('hidden', open);
  };

  desktopQuery.addEventListener('change', syncUi);
  window.visualViewport?.addEventListener('resize', syncKeyboardState);
  root.addEventListener('focusin', syncKeyboardState);
  root.addEventListener('focusout', () => window.setTimeout(syncKeyboardState, 60));

  syncUi();
  syncKeyboardState();

  return {
    getStep: () => activeStep,
    setStep,
  };
}
