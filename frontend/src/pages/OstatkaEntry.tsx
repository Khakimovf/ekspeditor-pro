import { useState, useEffect, useRef } from 'react';
import VoiceInput from '../components/VoiceInput';
import { resilientFetch } from '../utils/api';

interface Item {
    id: string;
    name: string;
    perBox: number;
    currentStock: number;
    minLimit: number;
}

interface RecentActivity {
    _id: string;
    itemId: string;
    boxes: number;
    timestamp: string;
    type: 'IN' | 'OUT' | 'SET';
}

const STATIC_FALLBACK_ITEMS: Item[] = [
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

export default function OstatkaEntry() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Split Input State
    const [inputId, setInputId] = useState('');
    const [inputQty, setInputQty] = useState('');
    const [inputMode, setInputMode] = useState<'IN' | 'OUT' | 'SET'>('IN');

    // Refs for focus management
    const idInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);

    const [successFlash, setSuccessFlash] = useState(false);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [errorVisible, setErrorVisible] = useState(false);

    const loadFromCache = () => {
        const cached = localStorage.getItem('cached_inventory');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setItems(parsed);
                    return true;
                }
            } catch (e) { /* ignore */ }
        }
        return false;
    };

    useEffect(() => {
        const fetchAll = async () => {
            const hasCache = loadFromCache();
            if (!hasCache) setLoading(true);
            setIsSyncing(true);
            setErrorVisible(false);

            try {
                const iRes = await resilientFetch((import.meta.env.VITE_API_URL || '') + '/api/inventory');
                const inventoryData = await iRes.json();

                const hRes = await resilientFetch((import.meta.env.VITE_API_URL || '') + '/api/history', {}, 1);
                const historyData = await hRes.json();

                if (Array.isArray(inventoryData)) {
                    setItems(inventoryData);
                    localStorage.setItem('cached_inventory', JSON.stringify(inventoryData));
                } else {
                    throw new Error('Invalid data format returned');
                }
                if (Array.isArray(historyData)) {
                    setRecentActivity(historyData.slice(0, 5));
                }
            } catch (err) {
                console.error("Data fetch failed:", err);
                setErrorVisible(true);
                if (!loadFromCache()) {
                    setItems(STATIC_FALLBACK_ITEMS);
                }
            } finally {
                setLoading(false);
                setIsSyncing(false);
            }
        };

        fetchAll();
    }, []);

    const playSuccessSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800 Hz
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.log("Audio play failed", e);
        }
    };

    // Auto-focus logic: Jump to Qty when ID is 4 digits
    useEffect(() => {
        if (inputId.length === 4) {
            qtyInputRef.current?.focus();
        }
    }, [inputId]);

    // Handle voice saqlash trigger
    useEffect(() => {
        const handleVoiceSubmit = () => {
            submitEntry();
        };
        document.addEventListener('voice-submit', handleVoiceSubmit);
        return () => {
            document.removeEventListener('voice-submit', handleVoiceSubmit);
        };
    }, [inputId, inputQty, inputMode, items]); // dependencies needed to capture current state on submit

    // Derived Preview Item
    const previewItem = items.find((i) => i.id === inputId || i.id.endsWith(inputId));

    const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            submitEntry();
        } else if (e.key === 'Backspace' && inputQty === '') {
            // Optional: jump back to ID field if backspacing on empty qty
            idInputRef.current?.focus();
        }
    };

    const submitEntry = () => {
        if (!previewItem) {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            alert("ID topilmadi!");
            idInputRef.current?.focus();
            return;
        }

        const qBoxes = parseInt(inputQty, 10);
        if (isNaN(qBoxes) || qBoxes <= 0) {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            alert("Iltimos, to'g'ri karobka sonini kiriting.");
            qtyInputRef.current?.focus();
            return;
        }

        const pieces = qBoxes * previewItem.perBox;

        fetch((import.meta.env.VITE_API_URL || '') + '/api/inventory/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: previewItem.id, type: inputMode, totalPieces: pieces, boxes: qBoxes })
        }).then(async (res) => {
            if (res.ok) {
                if (navigator.vibrate) navigator.vibrate([200]);
                playSuccessSound();

                setSuccessFlash(true);
                setTimeout(() => setSuccessFlash(false), 800);

                // Clear inputs and jump back to ID field
                setInputId('');
                setInputQty('');
                idInputRef.current?.focus();

                window.dispatchEvent(new Event('inventory-updated'));

                setRecentActivity(prev => [
                    { _id: Date.now().toString(), itemId: previewItem.id, boxes: qBoxes, timestamp: new Date().toISOString(), type: inputMode },
                    ...prev
                ].slice(0, 5));
            } else {
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                const data = await res.json();
                alert(`Xatolik: ${data.error}`);
            }
        }).catch(() => {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            alert("Serverga ulanishda xatolik");
        });
    };

    const handleVoiceCommand = (idFragment: string, voicedBoxes: number, type: 'IN' | 'OUT' | 'SET') => {
        const item = items.find((i) => i.id === idFragment || i.id.endsWith(idFragment));
        if (item) {
            // 1. Visually fill the inputs
            setInputId(item.id.slice(-4)); // Fill last 4 digits
            setInputQty(voicedBoxes.toString());
            setInputMode(type);

            // 2. Auto-submit after a brief visual delay so user sees the fields populated
            setTimeout(() => {
                const pieces = voicedBoxes * item.perBox;
                fetch((import.meta.env.VITE_API_URL || '') + '/api/inventory/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: item.id, type, totalPieces: pieces, boxes: voicedBoxes })
                }).then((res) => {
                    if (res.ok) {
                        if (navigator.vibrate) navigator.vibrate([200]);
                        playSuccessSound();
                        setSuccessFlash(true);
                        setTimeout(() => setSuccessFlash(false), 800);

                        // Sync Dashboard
                        window.dispatchEvent(new Event('inventory-updated'));

                        setRecentActivity(prev => [
                            { _id: Date.now().toString(), itemId: item.id, boxes: voicedBoxes, timestamp: new Date().toISOString(), type: type as 'IN' | 'OUT' | 'SET' },
                            ...prev
                        ].slice(0, 5));

                        // Clear visually after success
                        setTimeout(() => {
                            setInputId('');
                            setInputQty('');
                            idInputRef.current?.focus();
                        }, 1000);
                    }
                });
            }, 800);
        } else {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            alert(`ID ${idFragment} topilmadi!`);
        }
    };

    // Calculate visual totals
    const qBoxesNum = parseInt(inputQty, 10);
    const isValidQty = !isNaN(qBoxesNum) && qBoxesNum > 0;

    return (
        <div className="max-w-3xl mx-auto w-full transition-colors duration-300 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-4 sm:px-0">
                <div className="flex items-center gap-3">
                    <span className="text-4xl">📥</span>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Ostatka Entry (Split)</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Professional Dispetcher Kiritish Tizimi</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isSyncing && !loading && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse border border-indigo-100 dark:border-indigo-800">
                            <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            Baza bilan ulanilmoqda...
                        </div>
                    )}
                    {errorVisible && !isSyncing && (
                        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm animate-pulse whitespace-nowrap">
                            <span>⚠️</span>
                            <span className="text-xs font-bold">Baza aloqasi yo'q.</span>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className={`space-y-6 transition-all duration-500 rounded-3xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm ${successFlash ? 'bg-emerald-100 dark:bg-emerald-900/40 shadow-[0_0_40px_rgba(16,185,129,0.5)] ring-4 ring-emerald-400 border-emerald-400 transform scale-[1.02]' : ''}`}>

                    {/* 3 Mode Clear Buttons */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <button
                            onClick={() => setInputMode('IN')}
                            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${inputMode === 'IN'
                                ? 'bg-emerald-100 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.3)] dark:bg-emerald-900/40'
                                : 'bg-slate-50 border-slate-200 hover:border-emerald-300 dark:bg-slate-800 dark:border-slate-700'
                                }`}
                        >
                            <span className="text-2xl sm:text-3xl mb-1">➕</span>
                            <span className={`font-black uppercase tracking-wider text-xs sm:text-sm ${inputMode === 'IN' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>Kirim</span>
                        </button>
                        <button
                            onClick={() => setInputMode('OUT')}
                            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${inputMode === 'OUT'
                                ? 'bg-red-100 border-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.3)] dark:bg-red-900/40'
                                : 'bg-slate-50 border-slate-200 hover:border-red-300 dark:bg-slate-800 dark:border-slate-700'
                                }`}
                        >
                            <span className="text-2xl sm:text-3xl mb-1">➖</span>
                            <span className={`font-black uppercase tracking-wider text-xs sm:text-sm ${inputMode === 'OUT' ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>Chiqim</span>
                        </button>
                        <button
                            onClick={() => setInputMode('SET')}
                            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${inputMode === 'SET'
                                ? 'bg-indigo-100 border-indigo-500 shadow-[0_4px_20px_rgba(99,102,241,0.3)] dark:bg-indigo-900/40'
                                : 'bg-slate-50 border-slate-200 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700'
                                }`}
                        >
                            <span className="text-2xl sm:text-3xl mb-1">🔄</span>
                            <span className={`font-black uppercase tracking-wider text-xs sm:text-sm ${inputMode === 'SET' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Ostatka (=)</span>
                        </button>
                    </div>

                    {/* Split Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Field A: ID */}
                        <div className="relative">
                            <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2 mb-2">
                                Field A (ID)
                            </label>
                            <input
                                ref={idInputRef}
                                type="text"
                                inputMode="numeric"
                                value={inputId}
                                onChange={e => {
                                    // only allow numbers
                                    const val = e.target.value.replace(/\D/g, '');
                                    setInputId(val);
                                }}
                                placeholder="Oxirgi 4 raqam"
                                className={`w-full h-16 sm:h-20 px-6 text-2xl sm:text-3xl rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 transition-all font-black tracking-widest shadow-inner text-center ${inputId.length > 0 && !previewItem
                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                                    }`}
                                autoFocus
                            />
                            {inputId.length > 0 && !previewItem && (
                                <p className="text-red-500 font-bold mt-2 pl-2 flex items-center gap-1 animate-pulse">
                                    <span>⚠️</span> ID topilmadi!
                                </p>
                            )}
                        </div>

                        {/* Field B: Qty */}
                        <div className="relative">
                            <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2 mb-2">
                                Field B (Karobka)
                            </label>
                            <input
                                ref={qtyInputRef}
                                type="text"
                                inputMode="numeric"
                                value={inputQty}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setInputQty(val);
                                }}
                                onKeyDown={handleQtyKeyDown}
                                placeholder="Soni"
                                className="w-full h-16 sm:h-20 px-6 text-2xl sm:text-3xl rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-black tracking-widest shadow-inner text-center"
                            />
                            {/* Enter Hint */}
                            <div className="absolute right-4 top-[50px] sm:top-[58px] text-slate-300 dark:text-slate-600 pointer-events-none hidden sm:block">
                                <span className="text-sm font-black uppercase">Enter ⏎</span>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button for Mobile / Touch Users */}
                    <button
                        onClick={submitEntry}
                        disabled={!previewItem || !isValidQty}
                        className={`w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest transition-all ${previewItem && isValidQty
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_20px_rgba(79,70,229,0.4)] translate-y-0 active:translate-y-1'
                            : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed hidden sm:block' // mostly hide if disabled on desktop, but show if wanted
                            }`}
                    >
                        Saqlash
                    </button>

                    {/* Visual Calculation Card */}
                    {previewItem && (
                        <div className="mt-4 p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800 dark:to-indigo-900/20 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-widest mb-1">
                                        Tanlangan Tovar
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                                        {previewItem.name}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Joriy Zaxira</div>
                                    <div className="text-xl font-black text-slate-600 dark:text-slate-300">{previewItem.currentStock} dona</div>
                                </div>
                            </div>

                            <div className="flex items-center flex-wrap gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/50 p-3 rounded-xl border border-white/50 dark:border-slate-700/50">
                                <span>📦 1 kar = {previewItem.perBox} dona</span>
                                <span className="text-slate-300 dark:text-slate-600 px-2">|</span>

                                <div className="flex items-center gap-2 mt-2 w-full">
                                    <span className="text-slate-400 dark:text-slate-500 font-medium">Hisob: </span>
                                    <span className="text-slate-600 dark:text-slate-300">{previewItem.currentStock}</span>
                                    <span className={inputMode === 'IN' ? 'text-emerald-500' : inputMode === 'OUT' ? 'text-red-500' : 'text-indigo-500'}>
                                        {inputMode === 'IN' ? '+' : inputMode === 'OUT' ? '-' : '→'}
                                    </span>
                                    <span className="text-slate-800 dark:text-slate-200">
                                        {isValidQty ? qBoxesNum * previewItem.perBox : 0}
                                    </span>
                                    <span className="text-slate-400">=</span>
                                    <span className={`text-xl font-black ${inputMode === 'IN' ? 'text-emerald-600 dark:text-emerald-400' :
                                        inputMode === 'OUT' ? 'text-red-600 dark:text-red-400' :
                                            'text-indigo-600 dark:text-indigo-400'
                                        }`}>
                                        {inputMode === 'IN' ? previewItem.currentStock + (isValidQty ? qBoxesNum * previewItem.perBox : 0) :
                                            inputMode === 'OUT' ? previewItem.currentStock - (isValidQty ? qBoxesNum * previewItem.perBox : 0) :
                                                (isValidQty ? qBoxesNum * previewItem.perBox : 0)}
                                    </span>
                                    <span className="text-xs uppercase text-slate-400">Yangi Dona</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Futuristic AI Voice Orb (FAB) */}
            <VoiceInput onCommandParsed={handleVoiceCommand} />

            {/* Audit Log */}
            {!loading && recentActivity.length > 0 && (
                <div className="mt-8 px-2 sm:px-0">
                    <h3 className="text-sm font-black uppercase pl-2 tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                        🕒 So'nggi Kiritmalar
                    </h3>
                    <div className="flex flex-col gap-3">
                        {recentActivity.map((act) => (
                            <div key={act._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-all">
                                <div className="flex flex-col">
                                    <div className="text-base font-black text-slate-800 dark:text-slate-100">ID: {act.itemId}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                        {new Date(act.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${act.type === 'IN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : act.type === 'OUT' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'}`}>
                                        {act.type}
                                    </span>
                                    <div className="text-xl font-black text-slate-800 dark:text-slate-100 w-16 text-right">
                                        {act.boxes} <span className="text-[10px] text-slate-400 uppercase">quti</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
