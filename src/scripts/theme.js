(() => {
  const storageKey = '678estudio-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  let toggle = null;

  function readPreference() {
    try {
      const value = localStorage.getItem(storageKey);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  let preference = readPreference();

  function applyTheme() {
    const theme = preference ?? (system.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.title = theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
    }
  }

  // Resolve a preferência no head, antes de a página ser pintada.
  applyTheme();

  system.addEventListener('change', applyTheme);
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== storageKey) return;
    preference = readPreference();
    applyTheme();
  });

  document.addEventListener('DOMContentLoaded', () => {
    toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    applyTheme();
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(storageKey, preference);
      } catch {
        // A escolha ainda vale na página quando o armazenamento está indisponível.
      }
      applyTheme();
    });
  }, { once: true });
})();
