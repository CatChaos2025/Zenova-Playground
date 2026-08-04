/* prettier-ignore */
/**
 * <<--------------------------------------------------------------------------------->>
 * @package Zenova-Playground (Client)
 * @file App.tsx
 * <<--------------------------------------------------------------------------------->>
 */

import React, { useState, useRef } from 'react';
import { 
    WindowNode, 
    WindowFrame, 
    Vector2 
} from '../../winstart/src/index';

export const App: React.FC = () => {
    // Estado inicial con una ventana de prueba de WinStart
    const [windows, setWindows] = useState<WindowNode[]>([
        new WindowNode({
            id: 'test-win-1',
            title: 'Ventana de Prueba WinStart',
            position: new Vector2(120, 80),
            size: new Vector2(650, 450),
            theme: { colorScheme: 'system' },
            manifest: {
                runtime: 'react',
                sourcePath: 'apps/test',
                flags: {
                    allowClose: true,
                    allowMaximize: true,
                    allowMinimize: true,
                    allowResize: true,
                }
            }
        })
    ]);

    const [topZIndex, setTopZIndex] = useState(10);
    
    // Referencia para rastrear interacciones activas (Arrastre y Redimensionamiento) con umbral
    const activeInteraction = useRef<{
        type: 'drag' | 'resize';
        id: string;
        startX: number;
        startY: number;
        initialPos: Vector2;
        initialSize: Vector2;
        direction?: string;
        isDragging: boolean;
    } | null>(null);

    // --- Manejadores de Foco y Ciclo de Vida ---

    const handleFocus = (id: string) => {
        const nextZ = topZIndex + 1;
        setTopZIndex(nextZ);
        setWindows(prev => prev.map(win => {
            if (win.id === id) win.focus(nextZ);
            return Object.assign(Object.create(Object.getPrototypeOf(win)), win);
        }));
    };

    const handleClose = (id: string) => {
        setWindows(prev => prev.filter(win => win.id !== id));
    };

    const handleMinimize = (id: string) => {
        setWindows(prev => prev.map(win => {
            if (win.id === id) win.fsm.transition('MINIMIZED');
            return Object.assign(Object.create(Object.getPrototypeOf(win)), win);
        }));
    };

    const handleMaximize = (id: string) => {
      setWindows(prev => prev.map(win => {
          if (win.id === id) {
              win.toggleState();
          }
          
          // Creamos una copia real asegurando que se actualice la referencia y el estado interno
          const clonedWindow = Object.assign(
              new WindowNode({
                  id: win.id,
                  title: win.title,
                  position: win.position.clone(),
                  size: win.size.clone(),
                  theme: win.theme,
                  manifest: win.manifest
              }), 
              win
          );
          
          // Aseguramos que el clon mantenga el FSM actualizado si es necesario
          return clonedWindow;
      }));
    };

    // --- Lógica de Arrastre (Drag) con Umbral ---

    const handleDragStart = (id: string, e: React.PointerEvent) => {
        handleFocus(id);
        const win = windows.find(w => w.id === id);
        if (!win || win.fsm.getState() === 'MAXIMIZED') return;

        activeInteraction.current = {
            type: 'drag',
            id,
            startX: e.clientX,
            startY: e.clientY,
            initialPos: win.position.clone(),
            initialSize: win.size.clone(),
            isDragging: false // Inicia en falso para respetar clics y doble clics
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    // --- Lógica de Redimensionamiento (Resize) ---

    const handleResizeStart = (id: string, direction: string, e: React.PointerEvent) => {
        e.stopPropagation();
        handleFocus(id);
        const win = windows.find(w => w.id === id);
        if (!win || win.fsm.getState() === 'MAXIMIZED') return;

        activeInteraction.current = {
            type: 'resize',
            id,
            startX: e.clientX,
            startY: e.clientY,
            initialPos: win.position.clone(),
            initialSize: win.size.clone(),
            direction,
            isDragging: true
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    // --- Eventos globales del puntero (Mouse y Touch) ---
    const onPointerMove = (e: PointerEvent) => {
        const interaction = activeInteraction.current;
        if (!interaction) return; // Validación segura por si se soltó el puntero

        const { type, id, startX, startY, initialPos, initialSize, direction } = interaction;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Si es arrastre, evaluamos el umbral antes de disparar re-renders
        if (type === 'drag') {
            if (!interaction.isDragging) {
                if (Math.hypot(dx, dy) > 5) {
                    interaction.isDragging = true;
                } else {
                    return; // Si no supera los 5px, ignoramos el movimiento y evitamos re-renderizar
                }
            }
        }

        setWindows(prev => prev.map(win => {
            if (win.id !== id) return win;

            if (type === 'drag') {
                win.moveTo(new Vector2(initialPos.x + dx, initialPos.y + dy));
            } else if (type === 'resize' && direction) {
                let newX = initialPos.x;
                let newY = initialPos.y;
                let newW = initialSize.x;
                let newH = initialSize.y;

                if (direction.includes('e')) newW = Math.max(win.minSize.x, initialSize.x + dx);
                if (direction.includes('s')) newH = Math.max(win.minSize.y, initialSize.y + dy);
                if (direction.includes('w')) {
                    const potentialW = initialSize.x - dx;
                    if (potentialW >= win.minSize.x) {
                        newW = potentialW;
                        newX = initialPos.x + dx;
                    }
                }
                if (direction.includes('n')) {
                    const potentialH = initialSize.y - dy;
                    if (potentialH >= win.minSize.y) {
                        newH = potentialH;
                        newY = initialPos.y + dy;
                    }
                }

                win.moveTo(new Vector2(newX, newY));
                win.resizeTo(new Vector2(newW, newH));
            }

            return Object.assign(Object.create(Object.getPrototypeOf(win)), win);
        }));
    };

    const onPointerUp = () => {
        activeInteraction.current = null;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
    };

    // Función para instanciar dinámicamente nuevas ventanas de prueba
    const openNewWindow = () => {
        const id = `win-${Date.now()}`;
        const newWin = new WindowNode({
            id,
            title: `Aplicación #${windows.length + 1}`,
            position: new Vector2(160 + (windows.length * 25), 100 + (windows.length * 25)),
            size: new Vector2(520, 360),
            theme: { colorScheme: windows.length % 2 === 0 ? 'dark' : 'light' },
            manifest: {
                runtime: 'react',
                sourcePath: `apps/app-${windows.length + 1}`,
                flags: { allowClose: true, allowMaximize: true, allowMinimize: true, allowResize: true }
            }
        });
        setWindows(prev => [...prev, newWin]);
        handleFocus(id);
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#0b0f19' }}>
            {/* Barra superior de control del cliente */}
            <header style={{ 
                padding: '0.75rem 1.25rem', 
                background: 'rgba(15, 23, 42, 0.75)', 
                backdropFilter: 'blur(12px)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                zIndex: 99999,
                position: 'relative',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#f8fafc' }}>WinStart OS Client</span>
                <button 
                    onClick={openNewWindow}
                    style={{ padding: '0.4rem 0.9rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                >
                    + Abrir Ventana
                </button>
            </header>

            {/* Escritorio renderizador de ventanas */}
            {windows.map(node => (
                <WindowFrame
                    key={node.id}
                    node={node}
                    isFocused={node.zIndex === topZIndex}
                    onFocus={handleFocus}
                    onClose={handleClose}
                    onMinimize={handleMinimize}
                    onMaximize={handleMaximize}
                    onAboutClick={(id) => alert(`Ventana Activa ID: ${id}`)}
                    onDragStart={handleDragStart}
                    onResizeStart={handleResizeStart}
                />
            ))}
        </div>
    );
};

export default App;