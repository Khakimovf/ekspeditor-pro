import React from 'react';
// lucide-react removed

export interface InventoryItem {
    id: string;
    name: string;
    perBox: number;
    currentStock: number;
    minLimit: number;
}

interface StockListProps {
    items: InventoryItem[];
    searchQuery: string;
}

const StockList: React.FC<StockListProps> = ({ items, searchQuery }) => {
    const filteredItems = items.filter(
        (item) =>
            item.id.includes(searchQuery) ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 p-2 sm:p-4">
            {filteredItems.map((item) => {
                const isLowStock = item.currentStock <= item.minLimit; // User specifically said less than or equal to

                return (
                    <div
                        key={item.id}
                        className={`flex flex-col p-4 rounded-2xl shadow-sm border transition-all duration-300 ${isLowStock
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                    ID: {item.id}
                                </span>
                                <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 leading-tight">
                                    {item.name}
                                </h3>
                            </div>
                            {isLowStock ? (
                                <div className="flex items-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 p-1.5 rounded-full animate-pulse" title="Kam Zaxira">
                                    <span className="text-xs">⚠️</span>
                                </div>
                            ) : (
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full" title="Joyida">
                                    <span className="text-xs">✅</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto flex flex-col gap-1 pt-3 border-t border-slate-200/60 dark:border-slate-700/50 transition-colors duration-300">
                            <div className="flex items-baseline gap-1.5">
                                <span
                                    className={`text-3xl sm:text-4xl font-black tracking-tight ${isLowStock ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                                        }`}
                                >
                                    {item.currentStock.toLocaleString('uz-UZ')}
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">dona</span>
                            </div>

                            <div className="flex flex-col mt-1">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    📦 {(item.currentStock / item.perBox).toLocaleString('uz-UZ', { maximumFractionDigits: 1 })} karobka
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}

            {filteredItems.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <span className="text-5xl mb-4 opacity-50">📂</span>
                    <p className="text-lg font-bold">Hech narsa topilmadi</p>
                </div>
            )}
        </div>
    );
};

export default StockList;
