import React, { useState, useEffect, useRef } from 'react';

interface VoiceInputProps {
    onCommandParsed: (id: string, boxes: number, type: 'IN' | 'OUT' | 'SET') => void;
    compact?: boolean;
}

const parseUzbekToDigits = (text: string) => {
    const numberWords: Record<string, number> = {
        'nol': 0, 'bir': 1, 'ikki': 2, 'uch': 3, 'to\'rt': 4, 'tort': 4, 'besh': 5,
        'olti': 6, 'yetti': 7, 'sakkiz': 8, 'to\'qqiz': 9, 'toqqiz': 9,
        'o\'n': 10, 'on': 10, 'yigirma': 20, 'o\'ttiz': 30, 'ottiz': 30,
        'qirq': 40, 'ellik': 50, 'oltmish': 60, 'yetmish': 70, 'sakson': 80,
        'to\'qson': 90, 'toqson': 90
    };

    const multipliers: Record<string, number> = {
        'yuz': 100,
        'ming': 1000
    };

    // Normalize quotes for Uzbek words like to'rt
    let normalized = text.toLowerCase().replace(/[`’]/g, "'").replace(/[^\w\s']/g, '');
    let words = normalized.split(/\s+/);
    let result = '';

    let currentNumber = 0;
    let tempNumber = 0;
    let isParsingNumber = false;

    for (let i = 0; i < words.length; i++) {
        let w = words[i];
        if (numberWords[w] !== undefined) {
            isParsingNumber = true;
            tempNumber += numberWords[w];
        } else if (multipliers[w] !== undefined) {
            isParsingNumber = true;
            if (tempNumber === 0) tempNumber = 1;
            if (multipliers[w] === 100) {
                tempNumber *= 100;
            } else if (multipliers[w] === 1000) {
                currentNumber += tempNumber * 1000;
                tempNumber = 0;
            }
        } else {
            if (isParsingNumber) {
                currentNumber += tempNumber;
                result += currentNumber + ' ';
                currentNumber = 0;
                tempNumber = 0;
                isParsingNumber = false;
            }
            result += w + ' ';
        }
    }

    if (isParsingNumber) {
        currentNumber += tempNumber;
        result += currentNumber;
    }

    return result.trim();
};

const VoiceInput: React.FC<VoiceInputProps> = ({ onCommandParsed }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('');

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = useRef<any>(null);

    useEffect(() => {
        if (SpeechRecognition) {
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.lang = 'uz-UZ';
            recognition.current.interimResults = false;
            recognition.current.maxAlternatives = 1;

            recognition.current.onresult = (event: any) => {
                const speechResult = event.results[0][0].transcript.toLowerCase();
                setTranscript(speechResult);
                parseCommand(speechResult);
                setIsListening(false);
            };

            recognition.current.onerror = (event: any) => {
                setFeedback(`Xatolik: ${event.error === 'no-speech' ? 'Ovoz aniqlanmadi' : event.error}`);
                setIsListening(false);
                setTimeout(() => setFeedback(''), 4000);
            };

            recognition.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognition.current) {
                recognition.current.abort();
            }
        };
    }, []);

    const toggleListen = () => {
        if (isListening) {
            recognition.current?.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            setFeedback('Listening...');
            recognition.current?.start();
            setIsListening(true);
        }
    };

    const parseCommand = (rawText: string) => {
        const text = parseUzbekToDigits(rawText);
        const cleanText = text.replace(/id/g, '').trim();
        const numbers = cleanText.match(/\d+/g);

        const isKirim = text.includes('kirim') || text.includes('qo\'shish') || text.includes('plyus') || text.includes('in');
        const isChiqim = text.includes('chiqim') || text.includes('olish') || text.includes('minus') || text.includes('out') || text.includes('chiqarib');
        const isSet = text.includes('set') || text.includes('o\'rnatish') || text.includes('teng') || text.includes('ostatka');

        if (!numbers || numbers.length < 2) {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setFeedback(`Tushunilmadi: "${rawText}" -> [${text}]`);
            setTimeout(() => setFeedback(''), 4000);
            return;
        }

        let id = numbers[0];
        let boxes = parseInt(numbers[1], 10);

        // Handle variations where number comes before ID or ID is 2nd number
        if (id.length < numbers[1].length || (parseInt(id) < parseInt(numbers[1]) && parseInt(numbers[1]) >= 1000)) {
            id = numbers[1];
            boxes = parseInt(numbers[0], 10);
        }

        let mode: 'IN' | 'OUT' | 'SET' = 'IN';
        if (isChiqim) mode = 'OUT';
        if (isSet) mode = 'SET';
        if (isKirim) mode = 'IN';

        if (navigator.vibrate) navigator.vibrate([200]);
        setFeedback(`AI: ID ${id}, Karobka ${boxes}, Rejim ${mode}`);
        setTimeout(() => setFeedback(''), 4000);
        onCommandParsed(id, boxes, mode);
    };

    return (
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end">
            {/* Real-time Transcription Floating Bubble */}
            {isListening && (transcript || feedback) && (
                <div className="mb-4 bg-slate-900/95 dark:bg-black/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-indigo-500/30 text-right animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-xs sm:max-w-sm pointer-events-none transform origin-bottom-right">
                    {transcript && (
                        <div className="text-white/90 italic text-sm mb-1 font-medium break-words">"{transcript}"</div>
                    )}
                    {feedback && (
                        <div className={`font-bold text-xs sm:text-sm bg-gradient-to-r bg-clip-text text-transparent break-words ${feedback.startsWith('Xatolik') || feedback.startsWith('Tushunilmadi') ? 'from-red-400 to-rose-400' : 'from-indigo-400 to-cyan-400'}`}>
                            {feedback === 'Listening...' ? 'Aytishingizni kutyapman...' : feedback}
                        </div>
                    )}
                </div>
            )}

            {/* Sticky bottom-right FAB */}
            <button
                onClick={toggleListen}
                aria-label="Ovozli kiritish"
                className={`flex items-center justify-center rounded-full transition-all duration-300 transform overflow-hidden focus:outline-none focus:ring-4 focus:ring-indigo-500/30 shadow-2xl ${isListening
                        ? 'w-16 h-16 sm:w-20 sm:h-20 scale-105 shadow-[0_0_40px_rgba(99,102,241,0.5)] bg-slate-900 border-2 border-indigo-500/50'
                        : 'w-14 h-14 sm:w-16 sm:h-16 hover:scale-105 hover:-translate-y-1 shadow-indigo-900/20 bg-gradient-to-tr from-indigo-600 to-violet-600 active:scale-95'
                    }`}
            >
                {isListening ? (
                    // Subtle neon glow wave animation inside FAB
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 backdrop-blur-sm">
                        <div className="w-1 bg-cyan-400 rounded-full h-3 animate-[wave_1s_ease-in-out_infinite] shadow-[0_0_8px_#22d3ee]" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1 bg-blue-500 rounded-full h-6 animate-[wave_1s_ease-in-out_infinite] shadow-[0_0_8px_#3b82f6]" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 bg-indigo-500 rounded-full h-8 animate-[wave_1s_ease-in-out_infinite] shadow-[0_0_8px_#6366f1]" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 bg-purple-500 rounded-full h-6 animate-[wave_1s_ease-in-out_infinite] shadow-[0_0_8px_#a855f7]" style={{ animationDelay: '0.3s' }}></div>
                        <div className="w-1 bg-pink-500 rounded-full h-3 animate-[wave_1s_ease-in-out_infinite] shadow-[0_0_8px_#ec4899]" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                ) : (
                    // Static Mic Icon for FAB
                    <span className="text-2xl sm:text-3xl text-white drop-shadow-md">🎙️</span>
                )}
            </button>
        </div>
    );
};

export default VoiceInput;
