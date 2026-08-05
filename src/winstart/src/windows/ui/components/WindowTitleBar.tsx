/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file WindowTitleBar.tsx
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

import React from 'react';
import { WindowAboutButton } from './WindowAboutButton';
import { WindowActionControls } from './WindowActionControls';

interface TitleBarState {
    title: string;
    isFocused: boolean;
    isMaximized: boolean;
    allowMinimize: boolean;
    allowMaximize: boolean;
    allowClose: boolean;
    icon?: string;
}

interface WindowTitleBarProps {
    nodeId: string;
    state: TitleBarState;
    onClose: (id: string) => void;
    onMinimize: (id: string) => void;
    onMaximize: (id: string) => void;
    onAboutClick?: (id: string) => void;
    onDragStart?: (e: React.PointerEvent) => void;
}

export const WindowTitleBar: React.FC<WindowTitleBarProps> = ({
    nodeId,
    state,
    onClose,
    onMinimize,
    onMaximize,
    onAboutClick,
    onDragStart,
}) => {
    return (
        <div 
            className="win-titlebar"
            onPointerDown={onDragStart}
        >
            <div className="win-titlebar-left">
                {onAboutClick && (
                    <WindowAboutButton 
                        icon={state.icon} 
                        onClick={() => onAboutClick(nodeId)} 
                    />
                )}
                <span className="win-title-text">{state.title}</span>
            </div>

            <WindowActionControls
                isMaximized={state.isMaximized}
                allowMinimize={state.allowMinimize}
                allowMaximize={state.allowMaximize}
                allowClose={state.allowClose}
                onMinimize={() => onMinimize(nodeId)}
                onMaximize={() => onMaximize(nodeId)}
                onClose={() => onClose(nodeId)}
            />
        </div>
    );
};