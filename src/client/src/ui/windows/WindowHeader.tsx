import React from 'react';
import { clsx } from 'clsx';
import { useWindowStore } from '../../core/store/useWindowStore';
import './Window.css';

interface WindowHeaderProps {
  windowId: string;
  dragProps: any;
  onSnapPreview?: (zone: 'left' | 'right' | null) => void;
}

export function WindowHeader({ windowId, dragProps, onSnapPreview }: WindowHeaderProps) {
  const win = useWindowStore(state => state.getWindow(windowId));
  const minimizeWindow = useWindowStore(state => state.minimizeWindow);
  const maximizeWindow = useWindowStore(state => state.maximizeWindow);
  const closeWindow = useWindowStore(state => state.closeWindow);

  if (!win) return null;

  return (
    <div
      className={clsx(
        'window__header',
        dragProps.enabled && 'window__header--draggable'
      )}
      {...dragProps}
    >
      <div className="window__header-info">
        {win.icon && (
          <span className="window__header-icon" aria-hidden="true">
            {win.icon}
          </span>
        )}
        <span className="window__header-title" title={win.title}>
          {win.title}
        </span>
      </div>

      <div className="window__controls" onPointerDown={e => e.stopPropagation()}>
        {win.minimizable && (
          <button
            className="window__btn window__btn--minimize"
            onClick={() => minimizeWindow(windowId)}
            title="Minimizar"
            aria-label="Minimizar"
            type="button"
          >
            <svg viewBox="0 0 10 10">
              <path d="M0 5h10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </button>
        )}
        
        {win.maximizable && (
          <button
            className="window__btn window__btn--maximize"
            onClick={() => maximizeWindow(windowId)}
            title={win.state === 'maximized' ? 'Restaurar' : 'Maximizar'}
            aria-label={win.state === 'maximized' ? 'Restaurar' : 'Maximizar'}
            type="button"
          >
            {win.state === 'maximized' ? (
              <svg viewBox="0 0 10 10">
                <rect x="2" y="0" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <rect x="0" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
              </svg>
            ) : (
              <svg viewBox="0 0 10 10">
                <rect x="0" y="0" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            )}
          </button>
        )}
        
        {win.closable && (
          <button
            className="window__btn window__btn--close"
            onClick={() => closeWindow(windowId)}
            title="Cerrar"
            aria-label="Cerrar"
            type="button"
          >
            <svg viewBox="0 0 10 10">
              <path d="M0 0l10 10M10 0l-10 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}