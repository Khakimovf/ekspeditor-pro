import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLit, setIsLit] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (username.toLowerCase() !== 'admin') {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setErrorMsg("Noto'g'ri foydalanuvchi");
            return;
        }

        const success = login(password);
        if (success) {
            if (navigator.vibrate) navigator.vibrate([200]);
            navigate('/');
        } else {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setErrorMsg("Noto'g'ri parol");
        }
    };

    const handleDragEnd = (_event: any, info: any) => {
        // If pulled down sufficiently, toggle the lamp
        if (info.offset.y > 20) {
            setIsLit(prev => !prev);
            if (navigator.vibrate) navigator.vibrate([40]);
        }
    };

    return (
        <motion.div
            className="min-h-screen flex flex-col items-center justify-start pt-16 sm:pt-24 p-4 relative overflow-hidden"
            animate={{
                backgroundColor: isLit ? '#1c1f24' : '#121417'
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            {/* Branding Header */}
            <div className="absolute top-6 w-full text-center z-50">
                <h1 className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-600/50">
                    KHAKIMOVF
                </h1>
            </div>

            {/* Ambient Warm Radial Radiating specifically from the Lamp Head */}
            <AnimatePresence>
                {isLit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute z-0 pointer-events-none"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '150vw',
                            height: '150vh',
                            background: 'radial-gradient(circle at 45% 30%, rgba(253, 224, 71, 0.12) 0%, rgba(253, 224, 71, 0.04) 40%, transparent 65%)',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Centered Desk Lamp Element (Upper Half) */}
            <div className="relative w-full max-w-sm h-64 sm:h-72 z-20 pointer-events-none flex justify-center mt-4">

                {/* The Lamp Container, absolutely positioned relative to parent center */}
                <div className="absolute inset-0 flex justify-center pointer-events-auto scale-90 sm:scale-100">

                    {/* Lamp Base */}
                    <div className="absolute bottom-0 left-1/2 -ml-20 w-32 h-6 bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-3xl border-t border-slate-600 shadow-xl z-20"></div>

                    {/* Lower Stem */}
                    <div className="absolute bottom-4 left-1/2 -ml-10 w-4 h-32 bg-slate-700 rounded-full transform -rotate-12 origin-bottom shadow-md border-r border-slate-600 z-10"></div>

                    {/* Center Joint */}
                    <div className="absolute bottom-[115px] left-1/2 -ml-16 w-8 h-8 bg-slate-800 rounded-full shadow-inner border-2 border-slate-600 z-30"></div>

                    {/* Upper Stem */}
                    <div className="absolute bottom-[125px] left-1/2 -ml-12 w-3 h-28 bg-slate-700 rounded-full transform rotate-[45deg] origin-bottom shadow-md border-r border-slate-600 z-10"></div>

                    {/* Head Joint */}
                    <div className="absolute bottom-[205px] left-1/2 ml-5 w-6 h-6 bg-slate-800 rounded-full shadow-inner border-2 border-slate-600 z-30"></div>

                    {/* Lamp Shade (Head) */}
                    <div className="absolute bottom-[170px] left-1/2 -ml-20 w-[140px] h-[70px] bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-[100px] rounded-b-xl transform -rotate-[20deg] z-40 border-t border-slate-600 shadow-2xl flex justify-center items-end pb-1 overflow-hidden">

                        {/* The Light Bulb inside Shade */}
                        <motion.div
                            animate={{
                                opacity: isLit ? 1 : 0.2,
                                backgroundColor: isLit ? '#fde047' : '#334155',
                                boxShadow: isLit ? '0 10px 40px 20px rgba(253, 224, 71, 0.7)' : 'none'
                            }}
                            transition={{ duration: 0.2 }}
                            className="w-16 h-8 rounded-full blur-[2px] z-10 translate-y-2"
                        />
                    </div>

                    {/* The Pull Cord */}
                    {/* Attached to hang straight down from the angled shade */}
                    <motion.div
                        className="absolute bottom-[40px] left-1/2 ml-[5px] cursor-grab active:cursor-grabbing z-50 p-6 -ml-6"
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        // Adding bounce properties to drag elastic recoil directly
                        dragTransition={{ bounceStiffness: 300, bounceDamping: 10 }}
                        onDragEnd={handleDragEnd}
                        whileHover={{ scale: 1.05 }}
                    >
                        {/* String and bobble */}
                        <div className="flex flex-col items-center pointer-events-none">
                            <div className="w-[1.5px] h-20 bg-amber-900/80"></div>
                            <div className="w-4 h-4 bg-red-600 rounded-full shadow-[0_2px_8px_rgba(220,38,38,0.5)] border-2 border-red-800 pointer-events-auto"></div>
                        </div>
                    </motion.div>
                </div>

                {/* Thin Subscript Table Line */}
                <div className="absolute bottom-[-1px] w-[140%] h-[2px] bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
            </div>

            {/* Login Form Container - Positioned precisely below the lamp */}
            <div className="z-40 w-full max-w-sm sm:max-w-md mx-auto mt-8 sm:mt-12 flex-1 flex flex-col">
                <AnimatePresence>
                    {isLit && (
                        <motion.div
                            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="w-full pb-8"
                        >
                            {/* Logo / Header */}
                            <div className="flex flex-col items-center mb-6">
                                <h1 className="text-3xl font-black text-white/95 tracking-[0.15em] drop-shadow-md">EKSPEDITOR</h1>
                                <p className="text-amber-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">UzAuto Motors</p>
                            </div>

                            {/* Glassmorphism Card */}
                            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] p-6 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden">

                                <h2 className="text-lg font-black text-white/80 mb-6 uppercase tracking-[0.15em] text-center">Tizimga Kirish</h2>

                                <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                                    {/* Username */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-2">Foydalanuvchi</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 text-white rounded-[1.25rem] px-5 py-3.5 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium placeholder:text-slate-600/70"
                                            placeholder="Admin"
                                            required
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-2">Parol</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 text-white rounded-[1.25rem] px-5 py-3.5 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium placeholder:text-slate-600/70 tracking-widest"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    {/* Error Message */}
                                    <AnimatePresence>
                                        {errorMsg && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-[1rem] text-xs font-bold flex items-center justify-center gap-2"
                                            >
                                                <span>⚠️</span> {errorMsg}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Golden Button */}
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-black py-4 rounded-[1.25rem] shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all uppercase tracking-[0.2em] text-sm mt-4 active:scale-[0.98]"
                                    >
                                        Login
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Footer */}
            <div className="absolute bottom-6 w-full text-center text-[9px] font-bold text-slate-600/60 tracking-widest uppercase pointer-events-none">
                Ekspeditor Pro © 2026
            </div>
        </motion.div>
    );
}
