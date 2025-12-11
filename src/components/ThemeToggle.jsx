import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const useDarkMode = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const colorTheme = theme === 'light' ? 'dark' : 'light';

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(colorTheme);
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme, colorTheme]);

    return [colorTheme, setTheme];
};

export default function ThemeToggle() {
    const [colorTheme, setTheme] = useDarkMode();

    return (
        <button
            onClick={() => setTheme(colorTheme)}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
            {colorTheme === 'light' ? (
                <>
                    <Sun size={20} />
                    <span className="font-medium">Light Mode</span>
                </>
            ) : (
                <>
                    <Moon size={20} />
                    <span className="font-medium">Dark Mode</span>
                </>
            )}
        </button>
    );
}
