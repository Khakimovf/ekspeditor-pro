import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface HistoryRecord {
    _id: string;
    timestamp: string;
    itemId: string;
    type: 'IN' | 'OUT' | 'SET';
    boxes: number;
    totalPieces: number;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [presetFilter, setPresetFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK'>('ALL');
    const [customDate, setCustomDate] = useState('');
    const [searchId, setSearchId] = useState('');

    const [isPulling, setIsPulling] = useState(false);
    const [startY, setStartY] = useState(0);

    const fetchHistory = () => {
        setLoading(true);
        fetch('http://localhost:5000/api/history')
            .then(res => res.ok ? res.json() : [])
            .then(data => setHistory(Array.isArray(data) ? data : []))
            .catch(() => setHistory([]))
            .finally(() => {
                setLoading(false);
                setIsPulling(false);
            });
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Rostdan ham ushbu amalni o'chirish va zaxirani oldingi holatiga qaytarishni xohlaysizmi?")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/history/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (navigator.vibrate) navigator.vibrate([200]);
                alert("Muvaffaqiyatli o'chirildi va zaxira tiklandi!");
                fetchHistory(); // Refresh
                window.dispatchEvent(new Event('inventory-updated')); // Trigger global refresh
            } else {
                const data = await res.json();
                alert(`Xatolik: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Server ulanishida xatolik");
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (window.scrollY === 0 && startY > 0) {
            const currentY = e.touches[0].clientY;
            if (currentY - startY > 80) setIsPulling(true);
        }
    };

    const handleTouchEnd = () => {
        if (isPulling) fetchHistory();
        setIsPulling(false);
        setStartY(0);
    };

    // Derived Date Boundaries
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Apply Filters
    const filteredHistory = history.filter(record => {
        const matchId = searchId === '' || record.itemId.includes(searchId);

        const d = new Date(record.timestamp);
        let matchDate = true;

        if (customDate) {
            matchDate = record.timestamp.startsWith(customDate);
        } else {
            if (presetFilter === 'TODAY') matchDate = d >= today;
            else if (presetFilter === 'YESTERDAY') matchDate = d >= yesterday && d < today;
            else if (presetFilter === 'WEEK') matchDate = d >= lastWeek;
        }

        return matchId && matchDate;
    });

    // Summary Calculations
    const totalOperations = filteredHistory.length;
    const totalBoxesPeriod = filteredHistory.reduce((sum, r) => sum + r.boxes, 0);

    const itemCounts: Record<string, number> = {};
    filteredHistory.forEach(r => {
        itemCounts[r.itemId] = (itemCounts[r.itemId] || 0) + 1;
    });
    let mostActiveItem = '-';
    let maxOps = 0;
    Object.entries(itemCounts).forEach(([id, count]) => {
        if (count > maxOps) {
            maxOps = count;
            mostActiveItem = id;
        }
    });

    // Excel Export Function
    const exportToExcel = () => {
        if (filteredHistory.length === 0) {
            alert("Eksport qilish uchun ma'lumot yo'q");
            return;
        }
        const ws = XLSX.utils.json_to_sheet(filteredHistory.map(r => ({
            'Sana va Vaqt': new Date(r.timestamp).toLocaleString('uz-UZ'),
            'ID': r.itemId,
            'Harakat Turi': r.type === 'IN' ? 'Kirim (+)' : r.type === 'OUT' ? 'Chiqim (-)' : 'Tenglash (=)',
            'Karobkalar': r.boxes,
            'Jami Dona': r.totalPieces
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tarix Export');

        // Auto-sizing columns
        ws['!cols'] = [{ wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

        XLSX.writeFile(wb, `Logistika_Tarixi_${new Date().toLocaleDateString('uz-UZ')}.xlsx`);
    };

    return (
        <div
            className="max-w-7xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen pb-20 transition-colors duration-300 relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {isPulling && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full shadow-lg font-bold flex items-center gap-2 z-50 animate-bounce cursor-pointer" onClick={fetchHistory}>
                    <span className="text-xl">⬇️</span> Yangilash (Qo'yib yuboring)
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-b-3xl mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">📋</span>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">Logistika Tarixi</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Barcha transaksiyalar va audit logi</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <button
                            onClick={exportToExcel}
                            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">📥</span> Excel
                        </button>
                        <button
                            onClick={fetchHistory}
                            className="w-full sm:w-auto px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 font-bold transition flex items-center justify-center gap-2"
                        >
                            🔄 Yangilash
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Jami Operatsiyalar</p>
                        <h2 className="text-4xl font-black text-indigo-950 dark:text-indigo-100">{totalOperations}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Harbiy Karobkalar</p>
                        <h2 className="text-4xl font-black text-emerald-950 dark:text-emerald-100">{totalBoxesPeriod}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Eng Ko'p Harakat (ID)</p>
                        <h2 className="text-4xl font-black text-amber-950 dark:text-amber-100">{mostActiveItem}</h2>
                    </div>
                </div>

                {/* Advanced Filtering */}
                <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">

                    {/* Date Presets */}
                    <div className="flex bg-slate-200/50 dark:bg-slate-900 rounded-xl p-1 overflow-x-auto w-full xl:w-auto shrink-0">
                        {(['ALL', 'TODAY', 'YESTERDAY', 'WEEK'] as const).map(preset => (
                            <button
                                key={preset}
                                onClick={() => { setPresetFilter(preset); setCustomDate(''); }}
                                className={`px-4 lg:px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${presetFilter === preset && !customDate
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                {preset === 'ALL' ? 'Barchasi' : preset === 'TODAY' ? 'Bugun' : preset === 'YESTERDAY' ? 'Kecha' : 'Oxirgi 7 kun'}
                            </button>
                        ))}
                    </div>

                    <div className="text-slate-300 dark:text-slate-600 hidden xl:block">|</div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <div className="relative w-full">
                            <span className="absolute left-4 top-3 text-slate-400">📅</span>
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => { setCustomDate(e.target.value); setPresetFilter('ALL'); }}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>

                        <div className="relative w-full">
                            <span className="absolute left-4 top-3 text-slate-400">🔍</span>
                            <input
                                type="text"
                                placeholder="ID bo'yicha izlash..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-bold"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <span className="text-6xl mb-4 opacity-50">📂</span>
                    <p className="text-xl font-bold text-slate-600 dark:text-slate-400">Hech qanday tarix topilmadi</p>
                    <p className="text-sm mt-2">Tanlangan filter bo'yicha ma'lumot yo'q.</p>
                </div>
            ) : (
                <div className="px-4 md:px-8">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Wrapper for sticky header */}
                        <div className="max-h-[700px] overflow-y-auto w-full scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md shadow-sm">
                                    <tr>
                                        <th className="p-5 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Vaqt</th>
                                        <th className="p-5 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Harbiy ID</th>
                                        <th className="p-5 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Harakat Turi</th>
                                        <th className="p-5 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Karobkalar</th>
                                        <th className="p-5 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Jami Dona</th>
                                        <th className="p-5 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs text-right">Amal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900">
                                    {filteredHistory.map((record, idx) => (
                                        <tr key={record._id || idx} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                            <td className="p-5 text-slate-500 dark:text-slate-400 font-medium text-sm">
                                                {new Date(record.timestamp).toLocaleString('uz-UZ', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="p-5 font-black text-lg text-slate-800 dark:text-slate-100">
                                                {record.itemId}
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-black tracking-wide border ${record.type === 'IN'
                                                        ? 'bg-emerald-500 text-white border-emerald-600 dark:bg-emerald-600 dark:border-emerald-500 shadow-[0_4px_15px_rgba(16,185,129,0.3)]'
                                                        : record.type === 'OUT'
                                                            ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                                                            : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50'
                                                    }`}>
                                                    {record.type === 'IN' ? '➕ STOCK IN' : record.type === 'OUT' ? '➖ CHIQIM' : '🔄 OSTATKA'}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{record.boxes}</span>
                                                <span className="text-xs text-slate-400 ml-1 uppercase">Quti</span>
                                            </td>
                                            <td className="p-5">
                                                <span className="font-black text-indigo-900 dark:text-indigo-100">{record.totalPieces}</span>
                                                <span className="text-xs text-slate-400 ml-1 uppercase">Dona</span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => handleDelete(record._id)}
                                                    className="p-2 sm:px-4 sm:py-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg font-bold transition-all opacity-100 lg:opacity-50 lg:group-hover:opacity-100 border border-transparent hover:border-red-600 focus:opacity-100 text-sm flex items-center gap-1 justify-end ml-auto"
                                                    title="O'chirish va zaxirani qaytarish"
                                                >
                                                    <span>🗑️</span> <span className="hidden sm:inline">O'chirish</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
