'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lightbulb, LightbulbOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TheaterModeContextType {
    isTheaterMode: boolean;
    toggleTheaterMode: () => void;
}

const TheaterModeContext = createContext<TheaterModeContextType | undefined>(undefined);

export function TheaterModeProvider({ children }: { children: ReactNode }) {
    const [isTheaterMode, setIsTheaterMode] = useState(false);

    useEffect(() => {
        // Load from localStorage
        const saved = localStorage.getItem('theaterMode');
        if (saved === 'true') {
            setIsTheaterMode(true);
        }
    }, []);

    useEffect(() => {
        // Save to localStorage
        localStorage.setItem('theaterMode', String(isTheaterMode));

        // Apply theater mode styles
        if (isTheaterMode) {
            document.body.classList.add('theater-mode');
        } else {
            document.body.classList.remove('theater-mode');
        }
    }, [isTheaterMode]);

    const toggleTheaterMode = () => {
        setIsTheaterMode(prev => !prev);
    };

    return (
        <TheaterModeContext.Provider value={{ isTheaterMode, toggleTheaterMode }}>
            {children}
        </TheaterModeContext.Provider>
    );
}

export function useTheaterMode() {
    const context = useContext(TheaterModeContext);
    if (context === undefined) {
        throw new Error('useTheaterMode must be used within TheaterModeProvider');
    }
    return context;
}

export function TheaterModeToggle({ className }: { className?: string }) {
    const { isTheaterMode, toggleTheaterMode } = useTheaterMode();

    return (
        <Button
            onClick={toggleTheaterMode}
            variant="outline"
            size="icon"
            className={className}
            title={isTheaterMode ? 'Lights On' : 'Lights Off'}
        >
            {isTheaterMode ? (
                <Lightbulb className="w-5 h-5 text-yellow-400" />
            ) : (
                <LightbulbOff className="w-5 h-5" />
            )}
        </Button>
    );
}
