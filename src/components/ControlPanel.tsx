import { useState } from 'react';
import { Search, Loader2, Hexagon, Map, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface ControlPanelProps {
    onSearch: (zip: string, resolution: number) => void;
    isLoading: boolean;
    error: string | null;
    stats: {
        hexCount: number;
        hexes: string[];
    } | null;
}

export function ControlPanel({ onSearch, isLoading, error, stats }: ControlPanelProps) {
    const [zip, setZip] = useState('');
    const [resolution, setResolution] = useState(7);
    const [isExpanded, setIsExpanded] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (zip.length >= 5) {
            onSearch(zip, resolution);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute top-6 left-6 z-[1000] w-80"
        >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/50">
                {/* Decorative gradient blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="p-5">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500 blur-md opacity-50" />
                                <Hexagon className="relative text-emerald-400 w-7 h-7" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold font-['Outfit'] tracking-tight text-white">
                                    Zip<span className="text-emerald-400">2</span>H3
                                </h1>
                                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Spatial Indexer</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Target Location</label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <input
                                    type="text"
                                    value={zip}
                                    onChange={(e) => setZip(e.target.value)}
                                    placeholder="Enter US Zip Code..."
                                    className="relative w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 transition-all"
                                    maxLength={5}
                                />
                                <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                            </div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-1 pb-2 space-y-3">
                                        <div className="flex justify-between items-end">
                                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">H3 Resolution</label>
                                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                                Res {resolution}
                                            </span>
                                        </div>

                                        <div className="relative h-6 flex items-center">
                                            <input
                                                type="range"
                                                min="5"
                                                max="10"
                                                value={resolution}
                                                onChange={(e) => setResolution(Number(e.target.value))}
                                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                            <span>Coarse (5)</span>
                                            <span>Fine (10)</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={isLoading || zip.length < 5}
                            className={cn(
                                "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden relative",
                                isLoading || zip.length < 5
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
                                            // Optional: Show toast or feedback
                                        }
                                    }}
                                    className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Settings2 className="w-3 h-3" /> Copy Hex JSON
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
