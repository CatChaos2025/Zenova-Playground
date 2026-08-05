/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file WindowFrame.tsx
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

import React from 'react';
import { WindowNode } from '../../core/windows/engine/WindowNode';
import { WindowTitleBar } from './WindowTitleBar';
import { WindowContent } from './WindowContent';
import '../themes/apptheme.css';

interface WindowFrameProps {
    node: WindowNode;
    isFocused: boolean;
    onFocus: (id: string) => void;
    onClose: (id: string) => void;
    onMinimize: (id: string) => void;
    onMaximize: (id: string) => void;
    onAboutClick?: (id: string) => void;
    onDragStart?: (id: string, e: React.PointerEvent) => void;
    onResizeStart?: (id: string, direction: string, e: React.PointerEvent) => void;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
    node,
    isFocused,
    onFocus,
    onClose,
    onMinimize,
    onMaximize,
    onAboutClick,
    onDragStart,
    onResizeStart,
}) => {
    const currentState = node.fsm.getState();
    if (currentState === 'MINIMIZED') return null;

    // Solo geometría pura manejada por el motor
    const geometryStyles = {
        '--win-x': `${node.position.x}px`,
        '--win-y': `${node.position.y}px`,
        '--win-w': `${node.size.x}px`,
        '--win-h': `${node.size.y}px`,
        '--win-z': node.zIndex,
    } as React.CSSProperties;

    // El motor solo pasa el nombre del tema (ej: 'default', 'cyberpunk', etc.)
    const themeName = node.theme?.colorScheme || 'default';

    return (
        <div
            onClick={() => onFocus(node.id)}
            style={geometryStyles}
            data-theme={themeName}
            className={`win-window-root win-frame ${isFocused ? 'is-focused' : ''}`}
        >
            {/* Redimensionadores */}
            {node.flags.allowResize && currentState !== 'MAXIMIZED' && (
                <>
                    <div className="win-resize-handle handle-n" onPointerDown={(e) => onResizeStart?.(node.id, 'n', e)} />
                    <div className="win-resize-handle handle-s" onPointerDown={(e) => onResizeStart?.(node.id, 's', e)} />
                    <div className="win-resize-handle handle-e" onPointerDown={(e) => onResizeStart?.(node.id, 'e', e)} />
                    <div className="win-resize-handle handle-w" onPointerDown={(e) => onResizeStart?.(node.id, 'w', e)} />
                    <div className="win-resize-handle handle-se" onPointerDown={(e) => onResizeStart?.(node.id, 'se', e)} />
                    <div className="win-resize-handle handle-sw" onPointerDown={(e) => onResizeStart?.(node.id, 'sw', e)} />
                    <div className="win-resize-handle handle-ne" onPointerDown={(e) => onResizeStart?.(node.id, 'ne', e)} />
                    <div className="win-resize-handle handle-nw" onPointerDown={(e) => onResizeStart?.(node.id, 'nw', e)} />
                </>
            )}

            <WindowTitleBar
                nodeId={node.id}
                state={{
                    title: node.title,
                    isFocused,
                    isMaximized: currentState === 'MAXIMIZED',
                    allowMinimize: node.flags.allowMinimize ?? true,
                    allowMaximize: node.flags.allowMaximize ?? true,
                    allowClose: node.flags.allowClose ?? true,
                    icon: node.manifest?.icon,
                }}
                onClose={onClose}
                onMinimize={onMinimize}
                onMaximize={onMaximize}
                onAboutClick={onAboutClick}
                onDragStart={(e) => onDragStart?.(node.id, e)}
            />

            <WindowContent 
                runtime={node.manifest?.runtime}
                sourcePath={node.manifest?.sourcePath}
            />
        </div>
    );
};