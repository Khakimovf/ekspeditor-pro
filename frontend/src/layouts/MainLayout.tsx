import { Outlet, NavLink } from 'react-router-dom';
import { Home, PackagePlus, FileText, Settings, Warehouse } from 'lucide-react';
import { useState, useEffect } from 'react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-indigo-900 dark:bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-6 flex items-center gap-3 border-b border-indigo-800 dark:border-slate-800">
        <Warehouse size={28} className="text-indigo-300" />
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none">EKSPEDITOR</h1>
          <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Management</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-600 dark:bg-indigo-600 font-bold shadow-md' : 'hover:bg-indigo-800/50 dark:hover:bg-slate-800 text-indigo-100 font-medium'}`}>
          <Home size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/entry" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-600 dark:bg-indigo-600 font-bold shadow-md' : 'hover:bg-indigo-800/50 dark:hover:bg-slate-800 text-indigo-100 font-medium'}`}>
          <PackagePlus size={20} />
          <span>Inventory Entry</span>
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-600 dark:bg-indigo-600 font-bold shadow-md' : 'hover:bg-indigo-800/50 dark:hover:bg-slate-800 text-indigo-100 font-medium'}`}>
          <FileText size={20} />
          <span>Historical Reports</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-600 dark:bg-indigo-600 font-bold shadow-md' : 'hover:bg-indigo-800/50 dark:hover:bg-slate-800 text-indigo-100 font-medium'}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
};

const Header = () => {
    const [time, setTime] = useState(new Date());
    
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="bg-white dark:bg-slate-900 border-b border-indigo-50 dark:border-slate-800 h-16 flex items-center justify-between px-8 z-10 sticky top-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ekspeditor System</h2>
            <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 px-4 py-2 rounded-lg font-mono">
                    {time.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', dateStyle: 'long', timeStyle: 'medium' })}
                </div>
            </div>
        </header>
    );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
