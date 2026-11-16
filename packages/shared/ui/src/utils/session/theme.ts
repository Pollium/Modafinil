import { Theme } from '../../contracts/theme';

const THEME_STORAGE_KEY = 'modafinil.theme';

export const resolveTheme = (): Theme => {
    const fromQuery = new URLSearchParams(window.location.search).get('theme');
    if(fromQuery === 'light' || fromQuery === 'dark') return fromQuery;

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if(stored === 'light' || stored === 'dark') return stored;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const initTheme = () => applyTheme(resolveTheme());
