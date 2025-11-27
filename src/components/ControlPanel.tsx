import { useState, useEffect } from 'react';
import { Search, Loader2, Hexagon, Map, Settings2, MapPin, PenTool, Hash, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface ControlPanelProps {
    onSearch: (query: string, resolution: number, type: 'zip' | 'address') => void;
    onDrawMode: () => void;
    onReset: (targetMode?: 'zip' | 'address' | 'draw') => void;
    onModeChange: (targetMode: 'zip' | 'address' | 'draw') => void;
    isLoading: boolean;
    error: string | null;
    stats: {
        hexCount: number;
        hexes: string[];
    } | null;
    opacity: number;
    onOpacityChange: (opacity: number) => void;
    zipQuery: string;
    addressQuery: string;
    initialResolution: number;
    initialMode: 'zip' | 'address' | 'draw';
    fillGaps: boolean;
    onFillGapsChange: (fill: boolean) => void;
}

type SearchMode = 'zip' | 'address' | 'draw';

export function ControlPanel({
    onSearch,
    onDrawMode,
    onReset: _onReset,
    onModeChange,
    isLoading,
    error,
    stats,
    opacity,
    onOpacityChange,
    zipQuery,
    addressQuery,
    initialResolution,
    initialMode,
    fillGaps,
    onFillGapsChange
}: ControlPanelProps) {
    const [zipInput, setZipInput] = useState(zipQuery);
    const [addressInput, setAddressInput] = useState(addressQuery);
    const [resolution, setResolution] = useState(initialResolution);
    const [isSettingsOpen, setIsSettingsOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(true);
    const [mode, setMode] = useState<SearchMode>(initialMode);
    const [isCopied, setIsCopied] = useState(false);

    // Update state if props change (e.g. from localStorage load)
    useEffect(() => {
        setZipInput(zipQuery);
    }, [zipQuery]);

    useEffect(() => {
        setAddressInput(addressQuery);
    }, [addressQuery]);

    useEffect(() => {
        setResolution(initialResolution);
    }, [initialResolution]);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'draw') {
            onDrawMode();
            if (window.innerWidth < 768) setIsMobileOpen(false);
            return;
        }

        const currentQuery = mode === 'zip' ? zipInput : addressInput;

        if (currentQuery.length >= 3) {
            onSearch(currentQuery, resolution, mode);
            if (window.innerWidth < 768) setIsMobileOpen(false);
        }
    };

    const currentInput = mode === 'zip' ? zipInput : addressInput;
    const isInputValid = currentInput.length >= 3;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-[1000] md:absolute md:top-6 md:left-6 md:right-auto md:bottom-auto md:w-80"
        >
            <div className="relative overflow-hidden rounded-t-3xl md:rounded-2xl border-t md:border border-white/10 bg-slate-900/90 md:bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/50">
                {/* Decorative gradient blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Mobile Drag Handle */}
                <div
                    className="md:hidden w-full flex items-center justify-center pt-3 pb-1 cursor-pointer active:opacity-70"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                >
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
                </div>

                <div className="p-5 pt-2 md:pt-5">
                    {/* Header */}
                    <div
                        className="flex items-center justify-between mb-6 cursor-pointer md:cursor-default"
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500 blur-md opacity-50" />
                                <Hexagon className="relative text-emerald-400 w-7 h-7" strokeWidth={2.5} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold font-['Outfit'] tracking-tight text-white flex items-center gap-2">
                                        Zip<span className="text-emerald-400">2</span>H3
                                        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
                                    </h1>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Spatial Indexer</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSettingsOpen(!isSettingsOpen);
                                }}
                                className={`text-slate-400 hover:text-white transition-colors ${!isMobileOpen && 'md:block hidden'}`}
                            >
                                <Settings2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`${isMobileOpen ? 'block' : 'hidden'} md: block`}>
                        {/* Mode Tabs */}
                        <div className="flex p-1 bg-slate-800/50 rounded-xl mb-4 border border-white/5">
                            <button
                                onClick={() => {
                                    const wasDrawMode = mode === 'draw';
                                    setMode('zip');
                                    if (wasDrawMode) {
                                        // Clear draw mode state when switching from draw
                                        onModeChange('zip');
                                    }
                                }}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                                    mode === 'zip' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Hash className="w-3 h-3" /> Zip
                            </button>
                            <button
                                onClick={() => {
                                    const wasDrawMode = mode === 'draw';
                                    setMode('address');
                                    if (wasDrawMode) {
                                        // Clear draw mode state when switching from draw
                                        onModeChange('address');
                                    }
                                }}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                                    mode === 'address' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <MapPin className="w-3 h-3" /> Address
                            </button>
                            <button
                                onClick={() => {
                                    setMode('draw');
                                    onDrawMode();
                                }}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                                    mode === 'draw' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <PenTool className="w-3 h-3" /> Draw
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {mode !== 'draw' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">
                                        {mode === 'zip' ? 'Zip Code' : 'Address'}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                        <input
                                            type="text"
                                            value={mode === 'zip' ? zipInput : addressInput}
                                            onChange={(e) => mode === 'zip' ? setZipInput(e.target.value) : setAddressInput(e.target.value)}
                                            placeholder={mode === 'zip' ? "Enter Zip Code..." : "Enter full address..."}
                                            className="relative w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-base md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 transition-all"
                                        />
                                        <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                    </div>
                                </div>
                            )}

                            <AnimatePresence>
                                {isSettingsOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-1 pb-1 space-y-2">
                                            <div className="flex justify-between items-end">
                                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">H3 Resolution</label>
                                                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                                    Res {resolution}
                                                </span>
                                            </div>

                                            <div className="relative pt-4 pb-2">
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="10"
                                                    value={resolution}
                                                    onChange={(e) => setResolution(Number(e.target.value))}
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all relative z-10"
                                                />
                                                <div className="absolute top-0 left-0 right-0 flex justify-between px-1">
                                                    {[5, 7, 8, 10].map((val) => (
                                                        <div key={val} className="flex flex-col items-center gap-1">
                                                            <span className="text-[9px] text-slate-500 font-mono">{val}</span>
                                                            <div className="w-px h-1 bg-slate-700" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 pb-1 space-y-2 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-end gap-2">
                                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Hex Opacity</label>
                                                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                                        {Math.round(opacity * 100)}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => onFillGapsChange(!fillGaps)}>Fill Gaps</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => onFillGapsChange(!fillGaps)}
                                                        className={cn(
                                                            "relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-slate-900",
                                                            fillGaps ? "bg-emerald-500" : "bg-slate-700"
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform",
                                                                fillGaps ? "translate-x-3.5" : "translate-x-1"
                                                            )}
                                                            style={{ transform: fillGaps ? 'translateX(14px)' : 'translateX(4px)' }}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="relative pt-2 pb-2">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.05"
                                                    value={opacity}
                                                    onChange={(e) => onOpacityChange(Number(e.target.value))}
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all relative z-10"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {mode !== 'draw' && (
                                <button
                                    type="submit"
                                    disabled={isLoading || !isInputValid}
                                    className={cn(
                                        "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden relative",
                                        isLoading || !isInputValid
                                            ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                                            : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40 border border-emerald-500/20 group"
                                    )}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="relative z-10">Generate Hexes</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        </>
                                    )}
                                </button>
                            )}
                        </form>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2"
                                >
                                    <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            {stats && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-4 p-4 bg-slate-800/40 border border-white/5 rounded-xl"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Map className="w-3 h-3 text-emerald-400" />
                                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Analysis Result</span>
                                    </div>
                                    <div className="flex justify-between items-baseline mb-3">
                                        <span className="text-sm text-slate-400">Hexagons Generated</span>
                                        <span className="text-lg font-mono font-bold text-white">{stats.hexCount.toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (stats.hexes) {
                                                navigator.clipboard.writeText(JSON.stringify(stats.hexes));
                                                setIsCopied(true);
                                                setTimeout(() => setIsCopied(false), 2000);
                                            }
                                        }}
                                        className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Settings2 className="w-3 h-3" />}
                                        {isCopied ? <span className="text-emerald-400">Copied!</span> : "Copy Hex JSON"}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
