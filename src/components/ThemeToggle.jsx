import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
        >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
            <span>{isDark ? 'فاتح' : 'داكن'}</span>
        </button>
    );
};

export default ThemeToggle;
