import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend
} from 'recharts';

interface StatData {
    date: string;
    fullDate: string;
    stock: number;
    minLimitTotal: number;
}

export default function StockDynamicsChart() {
    const [data, setData] = useState<StatData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await fetch("http://factoryerp.uz" + '/api/statistics/stock-dynamics');
            if (response.ok) {
                const json = await response.json();
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const handleUpdate = () => fetchStats();
        window.addEventListener('inventory-updated', handleUpdate);
        return () => window.removeEventListener('inventory-updated', handleUpdate);
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Calculate dynamic colors based on dark mode class on document element
    const isDarkMode = document.documentElement.classList.contains('dark');
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
    const textColor = isDarkMode ? '#94a3b8' : '#64748b';
    const tooltipBg = isDarkMode ? '#0f172a' : '#ffffff';
    const tooltipColor = isDarkMode ? '#f8fafc' : '#0f172a';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300 w-full mb-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Zaxira Dinamikasi
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Oxirgi 7 kunlik uzluksiz holat</p>
                </div>
                <span className="text-2xl">📉</span>
            </div>
            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: textColor }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: textColor }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: isDarkMode ? '1px solid #1e293b' : 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                backgroundColor: tooltipBg,
                                color: tooltipColor
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        {data.length > 0 && (
                            <ReferenceLine
                                y={data[0]?.minLimitTotal || 0}
                                stroke="#ef4444"
                                strokeDasharray="5 5"
                                label={{ position: 'top', value: 'Xavfsizlik chegarasi', fill: '#ef4444', fontSize: 12 }}
                            />
                        )}
                        <Line
                            type="monotone"
                            name="Jami Zaxira"
                            dataKey="stock"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
