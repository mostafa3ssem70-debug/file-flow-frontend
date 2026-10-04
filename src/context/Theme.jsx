import { useLayoutEffect, useMemo, useState } from 'react';
import { ThemeContext } from './ThemeContext';

const THEME_STORAGE_KEY = 'fileflow-theme';

const getInitialTheme = () => {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
        return 'light';
    }
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme);

    useLayoutEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // The in-memory theme remains usable when storage is unavailable.
        }
    }, [theme]);

    const value = useMemo(() => ({
        theme,
        toggleTheme: () => setTheme((currentTheme) => (
            currentTheme === 'light' ? 'dark' : 'light'
        )),
    }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
