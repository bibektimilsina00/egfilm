'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function FullscreenLoader() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="relative group">
                {/* Outer Glow */}
                <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-500" />

                {/* Logo or Icon placeholder if desired, but let's stick to a premium spinner */}
                <div className="relative flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />

                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold text-white tracking-wider animate-pulse">
                            PREPARING YOUR STREAM
                        </h2>
                        <div className="flex items-center justify-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quality Indicator Text */}
            <p className="absolute bottom-12 text-gray-500 text-sm font-medium tracking-[0.2em] uppercase">
                Optimizing HD Buffers...
            </p>
        </div>
    );
}
