import { useState, useEffect } from 'react';
import StockList from '../components/StockList';
import type { InventoryItem } from '../components/StockList';
import ExcelExport from '../components/ExcelExport';
import StockDynamicsChart from '../components/StockDynamicsChart';

const STATIC_FALLBACK_ITEMS: InventoryItem[] = [
  { id: '26211281', name: 'Item 1281', perBox: 100, currentStock: 0, minLimit: 50 },
  { id: '26211284', name: 'Item 1284', perBox: 160, currentStock: 0, minLimit: 50 },
  { id: '26211277', name: 'Item 1277', perBox: 160, currentStock: 0, minLimit: 50 },
  { id: '26211286', name: 'Item 1286', perBox: 168, currentStock: 0, minLimit: 50 },
  { id: '26244137', name: 'Item 4137', perBox: 70, currentStock: 0, minLimit: 50 },
  { id: '26214138', name: 'Item 4138', perBox: 70, currentStock: 0, minLimit: 50 },
  { id: '26279885', name: 'Item 9885', perBox: 70, currentStock: 0, minLimit: 50 },
  { id: '26279886', name: 'Item 9886', perBox: 70, currentStock: 0, minLimit: 50 },
  { id: '26235140', name: 'Item 5140', perBox: 216, currentStock: 0, minLimit: 50 },
  { id: '13536589', name: 'Item 6589', perBox: 144, currentStock: 0, minLimit: 50 },
  { id: '13547616', name: 'Item 7616', perBox: 30, currentStock: 0, minLimit: 50 },
  { id: '52165067', name: 'Item 5067', perBox: 168, currentStock: 0, minLimit: 50 },
  { id: '52165069', name: 'Item 5069', perBox: 168, currentStock: 0, minLimit: 50 },
  { id: '52164050', name: 'Item 4050', perBox: 48, currentStock: 0, minLimit: 50 },
  { id: '13504351', name: 'Item 4351', perBox: 1000, currentStock: 0, minLimit: 50 },
  { id: '25774623', name: 'Item 4623', perBox: 460, currentStock: 0, minLimit: 50 },
  { id: '26434099', name: 'Item 4099', perBox: 100, currentStock: 0, minLimit: 50 },
  { id: '26216360', name: 'Item 6360', perBox: 210, currentStock: 0, minLimit: 50 }
];

function Dashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [todaysOperations, setTodaysOperations] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(false);

  const fetchInventory = async (search?: string) => {
    try {
      setLoading(true);
      setErrorVisible(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec timeout

      let fetchUrl = (import.meta.env.VITE_API_URL || '') + '/api/inventory';
      if (search) {
        fetchUrl += `?search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setInventory(data);
        localStorage.setItem('cached_inventory', JSON.stringify(data)); // Save to cache
      } else {
        throw new Error('Empty database returned');
      }

      const historyRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/history', { signal: AbortSignal.timeout(3000) });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const today = new Date().toISOString().split('T')[0];
        const todaysCount = historyData.filter((h: any) => h.timestamp.startsWith(today)).length;
        setTodaysOperations(todaysCount);
      }

    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setErrorVisible(true);

      // Fallback to local cache
      const cached = localStorage.getItem('cached_inventory');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setInventory(Array.isArray(parsed) && parsed.length > 0 ? parsed : STATIC_FALLBACK_ITEMS);
        } catch (e) {
          setInventory(STATIC_FALLBACK_ITEMS);
        }
      } else {
        setInventory(STATIC_FALLBACK_ITEMS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();

    // Listen for cross-component global updates (e.g. from Ostatka Entry)
    const handleUpdate = () => fetchInventory();
    window.addEventListener('inventory-updated', handleUpdate);
    return () => window.removeEventListener('inventory-updated', handleUpdate);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchInventory(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);



  const criticalStocks = inventory.filter(item => item.currentStock <= item.minLimit);
  const totalLowStock = criticalStocks.length;

  return (
    <div className="bg-transparent font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="container mx-auto max-w-7xl">

        {/* Search Bar & Error Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96 shadow-sm">
            <input
              type="text"
              placeholder="ID yoki Nom bo'yicha qidirish..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3 top-3.5 text-slate-400 text-xl">🔍</span>
          </div>

          {errorVisible && (
            <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm animate-pulse">
              <span>⚠️</span>
              <span className="text-sm font-bold">Baza bilan aloqa uzildi. Keshdan o'qilmoqda.</span>
            </div>
          )}
        </div>

        {/* Top Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between border-l-4 border-l-indigo-500 transition-colors duration-300">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Jami Tovarlar Turi</p>
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{inventory.length}</h2>
            </div>
            <span className="text-4xl">🗄️</span>
          </div>

          <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border flex items-center justify-between border-l-4 transition-colors duration-300 ${totalLowStock > 0 ? 'border-red-300 dark:border-red-900/50 border-l-red-500 shadow-red-100 dark:shadow-none shadow-md bg-red-50 dark:bg-red-500/10' : 'border-emerald-200 dark:border-emerald-900/50 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'}`}>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Kam Zaxiradagi Tovarlar</p>
              <h2 className={`text-3xl font-black ${totalLowStock > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                {totalLowStock}
              </h2>
            </div>
            <span className={`text-4xl ${totalLowStock > 0 ? 'text-red-400' : 'text-emerald-400'}`}>📉</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between border-l-4 border-l-blue-500 transition-colors duration-300">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Bugungi Operatsiyalar</p>
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{todaysOperations}</h2>
            </div>
            <span className="text-4xl">🔄</span>
          </div>

          <div className="flex items-center justify-center bg-transparent col-span-1 md:col-span-4 lg:col-span-1">
            <ExcelExport inventory={inventory} />
          </div>
        </div>

        {/* Stock Dynamics Chart */}
        <StockDynamicsChart />

        {/* Critical Stock List */}
        {criticalStocks.length > 0 && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-200 dark:border-red-900/50">
            <h3 className="text-xl font-bold text-red-800 dark:text-red-300 flex items-center gap-2 mb-4">
              <span>⚠️</span> Tanqidiy Zaxiradagi Tovarlar
            </h3>
            <div className="flex flex-wrap gap-3">
              {criticalStocks.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-red-100 dark:border-red-800 flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{item.id}</span>
                  <span className="font-semibold">{item.name}</span>
                  <span className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-1 rounded-full text-xs font-bold">
                    {item.currentStock} / {item.minLimit} qoldi
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Inventory View */}
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6 pl-4 border-l-4 border-indigo-600">
            Joriy Zaxira Holati
          </h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <StockList items={inventory} searchQuery={searchQuery} />
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
