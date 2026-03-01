import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm("Rostdan ham tizimdan chiqishni xohlaysizmi?")) {
            logout();
            navigate('/login');
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 sm:hidden transition-opacity backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed sm:relative z-50 w-64 bg-indigo-900 text-white min-h-screen p-4 flex flex-col dark:bg-slate-900 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
                <div className="text-2xl font-black mb-8 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl">📦</span>
                        EKSPEDITOR
                    </div>
                    <button onClick={onClose} className="sm:hidden text-indigo-300 p-1">
                        ✖️
                    </button>
                </div>
                <nav className="flex-1 space-y-2">
                    <NavLink onClick={onClose} to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${isActive ? 'bg-indigo-800 dark:bg-slate-800 scale-105 shadow-md shadow-indigo-900/20' : 'hover:bg-indigo-800/50 dark:hover:bg-slate-800/50'}`}>
                        <span className="text-xl">🏠</span>
                        <span className="font-medium">Dashboard</span>
                    </NavLink>
                    <NavLink onClick={onClose} to="/ostatka" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${isActive ? 'bg-indigo-800 dark:bg-slate-800 scale-105 shadow-md shadow-indigo-900/20' : 'hover:bg-indigo-800/50 dark:hover:bg-slate-800/50'}`}>
                        <span className="text-xl">📊</span>
                        <span className="font-medium">Ostatka Entry</span>
                    </NavLink>
                    <NavLink onClick={onClose} to="/history" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${isActive ? 'bg-indigo-800 dark:bg-slate-800 scale-105 shadow-md shadow-indigo-900/20' : 'hover:bg-indigo-800/50 dark:hover:bg-slate-800/50'}`}>
                        <span className="text-xl">⏳</span>
                        <span className="font-medium">History</span>
                    </NavLink>
                    <NavLink onClick={onClose} to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${isActive ? 'bg-indigo-800 dark:bg-slate-800 scale-105 shadow-md shadow-indigo-900/20' : 'hover:bg-indigo-800/50 dark:hover:bg-slate-800/50'}`}>
                        <span className="text-xl">⚙️</span>
                        <span className="font-medium">Settings</span>
                    </NavLink>
                </nav>

                {/* Secure Logout Section */}
                <div className="mt-auto pt-8 border-t border-indigo-800 dark:border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] text-red-500 hover:text-white rounded-xl font-bold transition-all duration-300 mb-6 group"
                    >
                        <span className="text-xl group-hover:-translate-x-1 transition-transform">🚪</span>
                        <span className="uppercase tracking-widest text-sm">Chiqish</span>
                    </button>
                    <div className="text-center text-xs font-bold text-indigo-400/50 dark:text-slate-600 tracking-widest uppercase">
                        Ekspeditor Pro © 2026
                    </div>
                </div>
            </aside >
        </>
    );
}
