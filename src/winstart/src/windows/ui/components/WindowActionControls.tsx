/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file WindowActionControls.tsx
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

import React from 'react';

interface WindowActionControlsProps {
    isMaximized: boolean;
    allowMinimize: boolean;
    allowMaximize: boolean;
    allowClose: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
    onClose: () => void;
}

export const WindowActionControls: React.FC<WindowActionControlsProps> = ({
    isMaximized,
    allowMinimize,
    allowMaximize,
    allowClose,
    onMinimize,
    onMaximize,
    onClose,
}) => {
    return (
        <div className="win-action-controls">
            {allowMinimize && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onMinimize();
                    }}
                    className="win-control-btn"
                    title="Minimizar"
                >
                    🗕
                </button>
            )}

            {allowMaximize && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onMaximize();
                    }}
                    className="win-control-btn"
                    title={isMaximized ? 'Restaurar' : 'Maximizar'}
                >
                    {isMaximized ? '🗗' : '🗖'}
                </button>
            )}

            {allowClose && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="win-control-btn win-control-btn-close"
                    title="Cerrar"
                >
                    ✕
                </button>
            )}
        </div>
    );
};