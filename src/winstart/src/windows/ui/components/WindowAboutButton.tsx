/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file WindowsAboutButton.tsx
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

import React, { useRef, useState } from "react";

interface WindowAboutButtonProps {
    icon?: string;
    onClick: () => void;
}

export const WindowAboutButton: React.FC<WindowAboutButtonProps> = ({ icon, onClick }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const timerRef = useRef<number | null>(null);

    const handleTouchInput = () => {
        timerRef.current = window.setTimeout(() => setShowTooltip(true), 800);
    };

    const handleTouchLeave = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowTooltip(false);
    };

    return (
        <button
            onMouseEnter={handleTouchInput}
            onMouseLeave={handleTouchLeave}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="win-about-btn"
        >
            {showTooltip && (
                <section className="win-about-tooltip">
                    Sobre la aplicación
                </section>
            )}

            {icon ? (
                <img src={icon} className="win-about-icon" alt="App Icon" />
            ) : (
                <span className="win-about-caret">▼</span>
            )}
        </button>
    );
};