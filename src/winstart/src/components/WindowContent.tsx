/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file WindowContent.tsx
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

import React from 'react';

interface WindowContentProps {
    runtime?: string;
    sourcePath?: string;
    children?: React.ReactNode;
}

export const WindowContent: React.FC<WindowContentProps> = ({
    runtime = 'native',
    sourcePath = 'internal',
    children,
}) => {
    return (
        <div className="win-content-viewport">
            {children || (
                <span className="win-runtime-placeholder">
                    Runtime [{runtime}] → {sourcePath}
                </span>
            )}
        </div>
    );
};