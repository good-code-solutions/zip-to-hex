import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white">About Zip to Hex</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 text-white/80 leading-relaxed">
                    <p>
                        Zip to Hex is a powerful tool designed for visualizing H3 hexagonal grids over US Zip Codes and custom areas.
                        Built for data analysts, cartographers, and geospatial enthusiasts.
                    </p>

                    <div className="space-y-2">
                        <h3 className="text-white font-medium">Key Features</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-white/60">
                            <li>Convert US Zip Codes to H3 Hexagons</li>
                            <li>Address Search with Multi-Resolution Analysis</li>
                            <li>Custom Polygon Drawing with Dynamic Resolution</li>
                            <li>Export Hex Indices for Analysis</li>
                        </ul>
                    </div>

                    <div className="pt-4 border-t border-white/10 text-sm">
                        <p className="flex justify-between">
                            <span>Version</span>
                            <span className="text-white">1.2.0</span>
                        </p>

                    </div>
                </div>

                <div className="p-6 bg-white/5 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
