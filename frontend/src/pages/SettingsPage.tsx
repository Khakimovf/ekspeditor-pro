import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

interface Item {
    id: string;
    name: string;
    perBox: number;
    minLimit: number;
    currentStock?: number;
    updatedAt?: string;
}

export default function SettingsPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit item state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ perBox: number, minLimit: number }>({ perBox: 0, minLimit: 0 });

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Add Item Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addForm, setAddForm] = useState({ id: '', name: '', perBox: '', minLimit: '' });

    // Global Settings State
    const [globalMinLimit, setGlobalMinLimit] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/inventory');
            const data = await res.json();
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- Inline Edit Logic ---
    const handleEditClick = (item: Item) => {
        setEditingId(item.id);
        setEditForm({ perBox: item.perBox, minLimit: item.minLimit });
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    const handleSave = async (id: string) => {
        try {
            // Optimistic update
            setItems(items.map(i => i.id === id ? { ...i, ...editForm, updatedAt: new Date().toISOString() } : i));
            setEditingId(null);

            const response = await fetch(`http://localhost:5000/api/inventory/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (!response.ok) {
                alert('Saqlashda xatolik yuz berdi :(');
                fetchInventory(); // revert
            }
        } catch (error) {
            console.error(error);
            alert("Xatolik yuz berdi");
        }
    };

    // --- Add New Item Logic ---
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: addForm.id,
                    name: addForm.name,
                    perBox: Number(addForm.perBox),
                    minLimit: Number(addForm.minLimit)
                })
            });
            const data = await res.json();
            if (res.ok) {
                setItems([...items, data.item]);
                setIsAddModalOpen(false);
                setAddForm({ id: '', name: '', perBox: '', minLimit: '' });
                alert("Yangi tovar muvaffaqiyatli qo'shildi!");
                window.dispatchEvent(new Event('inventory-updated'));
            } else {
                alert(`Xatolik: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Serverga ulanishda xato");
        }
    };

    // --- Global Controls Logic ---
    const handleApplyGlobalLimit = async () => {
        if (!globalMinLimit) return;
        if (!window.confirm(`Barcha tovarlar uchun minimal zaxira limitini ${globalMinLimit} qilib belgilashni tasdiqlaysizmi?`)) return;

        try {
            const res = await fetch('http://localhost:5000/api/inventory/global-limit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minLimit: Number(globalMinLimit) })
            });
            if (res.ok) {
                alert("Global limit muvaffaqiyatli o'rnatildi!");
                fetchInventory();
                setGlobalMinLimit('');
            } else {
                alert("Xatolik yuz berdi");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // --- Danger Zone Logic ---
    const handleResetAllStock = async () => {
        const confirm1 = window.confirm("DIQQAT! Siz barcha tovarlarning Joriy Zaxira sonini 0 ga tenglashtirmoqchisiz. Davom etamizmi?");
        if (!confirm1) return;

        const confirm2 = window.prompt("Buni tasdiqlash uchun 'RESET' so'zini kiriting:");
        if (confirm2 !== 'RESET') {
            alert("Bekor qilindi.");
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/inventory/reset-stock', { method: 'PUT' });
            if (res.ok) {
                alert("BARCHA ZAXIRA 0 GA TUSHIRILDI!");
                fetchInventory();
                window.dispatchEvent(new Event('inventory-updated'));
            } else {
                alert("Xatolik yuz berdi");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // --- Data Portability Logic ---
    const handleBackupJSON = () => {
        const dataStr = JSON.stringify(items, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `Database_Backup_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const bstr = event.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                alert(`Excel fayli o'qildi. (${data.length} ta qator topildi). Ushbu fungsionallik hozircha faqat faylni o'qiydi. Backend integratsiyasi kelgusida qo'shiladi.`);
                // Here we would map the data to the expected format and send multiple POST requests or a bulk import endpoint.
            } catch (error) {
                console.error(error);
                alert("Excel faylini o'qishda xatolik");
            }
        };
        reader.readAsBinaryString(file);
    };

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    // --- Filtering ---
    const filteredItems = items.filter(i =>
        i.id.includes(searchQuery) || i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen pb-20 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-b-3xl mb-8">

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">⚙️</span>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">ERP Settings</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Tizim bozqaruv va ma'lumotlar bazasi markazi</p>
                        </div>
                    </div>
                </div>

                {/* Top Action Bar */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6">
                    <div className="relative w-full lg:w-96">
                        <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="ID yoki Nom bo'yicha qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-bold"
                        />
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full lg:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">➕</span> Yangi Tovar Qo'shish
                    </button>
                </div>

                {/* ERP Control Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Global Settings */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                        <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                            <span>🌍</span> Global Sozlamalar
                        </h3>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4 font-medium">Barcha tovarlar uchun bir xil minimal zaxira (minLimit) o'rnatish.</p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Masalan: 50"
                                value={globalMinLimit}
                                onChange={(e) => setGlobalMinLimit(e.target.value)}
                                className="w-full p-3 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                            />
                            <button
                                onClick={handleApplyGlobalLimit}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all whitespace-nowrap"
                            >
                                Qo'llash
                            </button>
                        </div>
                    </div>

                    {/* Data Portability */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-2 flex items-center gap-2">
                                <span>💾</span> Data Portability
                            </h3>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4 font-medium">Baza ma'lumotlarini eksport yoki import qilish.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleBackupJSON}
                                className="flex-1 py-3 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <span>📦</span> JSON Backup
                            </button>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                ref={fileInputRef}
                                onChange={handleImportExcel}
                                className="hidden"
                            />
                            <button
                                onClick={triggerImport}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                <span>📤</span> Excel Import
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        {/* Desktop Table with Sticky Header */}
                        <div className="hidden md:block max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="p-4 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">ID</th>
                                        <th className="p-4 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Nomi</th>
                                        <th className="p-4 text-center font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">perBox</th>
                                        <th className="p-4 text-center font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">minLimit</th>
                                        <th className="p-4 text-center font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Last Modified</th>
                                        <th className="p-4 text-right font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs pr-8">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {filteredItems.map((item) => {
                                        const isEditing = editingId === item.id;
                                        return (
                                            <tr key={item.id} className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isEditing ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                                                <td className="p-4 font-black text-indigo-600 dark:text-indigo-400">{item.id}</td>
                                                <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{item.name}</td>
                                                <td className="p-4 text-center">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editForm.perBox}
                                                            onChange={(e) => setEditForm({ ...editForm, perBox: Number(e.target.value) })}
                                                            className="w-24 p-2 text-center rounded-lg border-2 border-indigo-400 focus:outline-none focus:border-indigo-600 dark:bg-slate-800 dark:text-white font-bold"
                                                        />
                                                    ) : (
                                                        <span className="font-bold text-slate-600 dark:text-slate-300">{item.perBox}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editForm.minLimit}
                                                            onChange={(e) => setEditForm({ ...editForm, minLimit: Number(e.target.value) })}
                                                            className="w-24 p-2 text-center rounded-lg border-2 border-indigo-400 focus:outline-none focus:border-indigo-600 dark:bg-slate-800 dark:text-white font-bold"
                                                        />
                                                    ) : (
                                                        <span className="font-bold text-slate-600 dark:text-slate-300">{item.minLimit}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                                                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Noma\'lum'}
                                                </td>
                                                <td className="p-4 text-right pr-6">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleSave(item.id)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition shadow-md shadow-emerald-200 dark:shadow-none">Saqlash</button>
                                                            <button onClick={handleCancel} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition">Bekor</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => handleEditClick(item)} className="px-4 py-2 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 dark:bg-slate-800/50 dark:hover:bg-indigo-500/20 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg font-bold text-sm transition border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30">
                                                            ✏️ Tahrirlash
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-900/50">
                            {filteredItems.map((item) => {
                                const isEditing = editingId === item.id;
                                return (
                                    <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="font-black text-indigo-600 dark:text-indigo-400 text-xl flex flex-col">
                                                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">ID</span>
                                                {item.id}
                                            </div>
                                            {isEditing ? (
                                                <div className="flex flex-col gap-2 w-1/2">
                                                    <button onClick={() => handleSave(item.id)} className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold text-sm transition">Saqlash</button>
                                                    <button onClick={handleCancel} className="px-4 py-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition">Bekor</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleEditClick(item)} className="px-4 py-2 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm">
                                                    ✏️ Tahrirlash
                                                </button>
                                            )}
                                        </div>
                                        <div className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                                            {item.name}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">perBox</span>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={editForm.perBox}
                                                        onChange={(e) => setEditForm({ ...editForm, perBox: Number(e.target.value) })}
                                                        className="w-full p-3 text-center rounded-xl border-2 border-indigo-400 focus:outline-none dark:bg-slate-900 dark:text-white font-bold"
                                                    />
                                                ) : (
                                                    <span className="font-black text-slate-800 dark:text-slate-200 text-xl">{item.perBox}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">minLimit</span>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={editForm.minLimit}
                                                        onChange={(e) => setEditForm({ ...editForm, minLimit: Number(e.target.value) })}
                                                        className="w-full p-3 text-center rounded-xl border-2 border-indigo-400 focus:outline-none dark:bg-slate-900 dark:text-white font-bold"
                                                    />
                                                ) : (
                                                    <span className="font-black text-slate-800 dark:text-slate-100 text-xl">{item.minLimit}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* DANGER ZONE */}
            <div className="px-6 md:px-8 max-w-7xl mx-auto mt-12 mb-20">
                <div className="bg-red-50 dark:bg-red-900/10 p-6 md:p-8 rounded-3xl border-2 border-red-200 dark:border-red-900/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h2 className="text-2xl font-black text-red-700 dark:text-red-400 flex items-center gap-3 mb-2">
                                <span>⚠️</span> System Management (Danger Zone)
                            </h2>
                            <p className="text-red-600/80 dark:text-red-400/80 font-medium">Bu yerdagi amallar butun tizim ma'lumotlariga bevosita ta'sir qiladi. Ehtiyotkorlik bilan foydalaning.</p>
                        </div>
                        <button
                            onClick={handleResetAllStock}
                            className="w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-lg shadow-red-200 dark:shadow-none transition-all tracking-wider whitespace-nowrap"
                        >
                            Reset All Stock to Zero
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for Adding Item */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Yangi Tovar Qo'shish</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">✖️</button>
                        </div>
                        <form onSubmit={handleAddItem} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Harbiy ID (max 8 belgi)</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={10}
                                    value={addForm.id}
                                    onChange={e => setAddForm({ ...addForm, id: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Nomi</label>
                                <input
                                    type="text"
                                    required
                                    value={addForm.name}
                                    onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Per Box</label>
                                    <input
                                        type="number"
                                        required
                                        value={addForm.perBox}
                                        onChange={e => setAddForm({ ...addForm, perBox: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Min Limit</label>
                                    <input
                                        type="number"
                                        required
                                        value={addForm.minLimit}
                                        onChange={e => setAddForm({ ...addForm, minLimit: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition">Bekor qilish</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-200 dark:shadow-none">Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
