import React from 'react';
import { useWindowManager } from '../../hooks/useWindowsManager';
import { windowManager } from '../../core/models/WindowsManager';

export function Taskbar() {
  const { windows } = useWindowManager();

  return (
    <div className="taskbar">
      {/* Botón de inicio */}
      <button className="taskbar-item" title="Inicio">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z"/>
        </svg>
      </button>

      {/* Separador */}
      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

      {/* Ventanas abiertas */}
      {windows.map(win => (
        <button
          key={win.id}
          className={`taskbar-item ${win.state !== 'minimized' ? 'is-active' : ''}`}
          onClick={() => {
            if (win.state === 'minimized') {
              win.restore();
              windowManager.focusWindow(win.id);
            } else {
              windowManager.toggleMinimize(win.id);
            }
          }}
          title={win.manifest.title}
        >
          <span>{win.manifest.icon}</span>
          <span>{win.manifest.title}</span>
        </button>
      ))}
    </div>
  );
}