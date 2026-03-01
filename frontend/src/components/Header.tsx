import { useState, useEffect } from 'react';

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const [time, setTime] = useState(new Date());
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <header className="bg-indigo-900 dark:bg-slate-900 text-white shadow-xl sticky top-0 z-50 transition-colors duration-300">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={onMenuClick}
                        className="sm:hidden p-2 bg-indigo-800/50 hover:bg-indigo-700/50 text-white rounded-xl transition"
                    >
                        <span className="text-xl block leading-none">☰</span>
                    </button>
                    <span className="text-2xl sm:text-3xl hidden sm:block">🏢</span>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-none">EKSPEDITOR</h1>
                        <p className="text-indigo-200 text-xs sm:text-sm font-medium hidden sm:block">Aqlli Ombor Boshqaruvi</p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 sm:gap-6 flex-1">
                    <div className="text-right sm:block flex flex-col items-end">
                        <div className="text-sm sm:text-lg font-bold tabular-nums leading-tight">
                            {time.toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tashkent' })}
                        </div>
                        <div className="text-[10px] sm:text-sm text-indigo-300 font-medium">
                            {time.toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' })}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 sm:p-3 rounded-full bg-indigo-800/50 hover:bg-indigo-700/50 text-indigo-200 hover:text-white transition-colors border border-indigo-700 dark:bg-slate-800 dark:border-slate-700 dark:text-yellow-400 dark:hover:bg-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                        aria-label="Toggle Dark Mode"
                    >
                        <span className="text-lg sm:text-xl leading-none block">{isDark ? '☀️' : '🌙'}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
