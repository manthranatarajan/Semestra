const THEME_KEY = 'semestra_theme';

export type Theme = 'light' | 'dark' | 'system';

export function getInitialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(THEME_KEY) as Theme | null;

  if (saved === 'light' || saved === 'dark') {
    return saved;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.toggle('light', theme === 'light');
  localStorage.setItem(THEME_KEY, theme);
}

export function initializeTheme(): void {
  const theme = getInitialTheme();
  applyTheme(theme);
}
