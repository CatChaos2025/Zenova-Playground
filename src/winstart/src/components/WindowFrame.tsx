/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file WindowFrame.ts
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

import React from 'react';
import { WindowNode } from '../core/windows/models/WindowNode';
import './WindowFrame.css';

interface WindowFrameProps {
    node: WindowNode;
    isFocused: boolean;
    onFocus: (id: string) => void;
    onClose: (id: string) => void;
    onMinimize: (id: string) => void;
    onMaximize: (id: string) => void;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ 
    node, 
    isFocused, 
    onFocus, 
    onClose, 
    onMinimize, 
    onMaximize 
}) => {
    const currentState = node.fsm.getState();

    if (currentState === 'MINIMIZED') return null;

    const windowStyle = {
        '--win-x': `${node.position.x}px`,
        '--win-y': `${node.position.y}px`,
        '--win-w': `${node.size.x}px`,
        '--win-h': `${node.size.y}px`,
        '--win-z': node.zIndex,
        '--win-bg': node.theme.windowBg,
        '--win-border': isFocused ? node.theme.highlightColor : 'rgba(255, 255, 255, 0.1)',
        '--content-bg': node.theme.contentBg,
        '--highlight-color': node.theme.highlightColor,
        '--highlight-opacity': isFocused ? 1 : 0.4,
    } as React.CSSProperties;

    return (
        <div
            onClick={() => onFocus(node.id)}
            style={windowStyle}
            className="zenova-window"
        >
            {/* Barra de Título */}
            <div className="zenova-titlebar">
                <div className="zenova-title-group">
                    <span className="zenova-indicator" />
                    <span className="zenova-title-text">
                        {node.title}
                    </span>
                </div>

                <div className="zenova-controls">
                    {/* Botón Minimizar */}
                    {node.flags.allowMinimize && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMinimize(node.id); }}
                            className="zenova-btn"
                            title="Minimizar"
                        >
                            🗕
                        </button>
                    )}

                    {/* Botón Maximizar / Restaurar */}
                    {node.flags.allowMaximize && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMaximize(node.id); }}
                            className="zenova-btn"
                            title={currentState === 'MAXIMIZED' ? 'Restaurar' : 'Maximizar'}
                        >
                            {currentState === 'MAXIMIZED' ? '🗗' : '🗖'}
                        </button>
                    )}

                    {/* Botón Cerrar */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClose(node.id); }}
                        className="zenova-btn zenova-btn-close"
                        title="Cerrar"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Contenedor del Contenido / Runtime */}
            <div className="zenova-content">
                <span className="zenova-loading-text">
                    Cargando [{node.manifest?.runtime || 'native'}] → {node.manifest?.sourcePath || 'internal'}
                </span>
            </div>
        </div>
    );
};