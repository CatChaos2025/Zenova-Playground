import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useWindowStore } from '../../core/store/useWindowStore';
import { useWindowDrag } from '../../hooks/useWindowDrag';
import { WindowHeader } from './WindowHeader';
import { ResizeHandles } from './ResizeHandles';
import { SnapPreview } from './SnapPreview';
import './Window.css';

interface WindowProps {
  windowId: string;
  children?: React.ReactNode;
  className?: string;
}

export function Window({ windowId, children, className }: WindowProps) {
  const win = useWindowStore(state => state.getWindow(windowId));
  const isTopmost = useWindowStore(state => {
    const top = state.getTopWindow();
    return top?.id === windowId;
  });
  
  const [snapPreview, setSnapPreview] = useState<'left' | 'right' | null>(null);

  const { bind: dragProps, windowRef } = useWindowDrag({
    windowId,
    enabled: win?.draggable,
    onSnapPreview: setSnapPreview,
  });

  if (!win || win.state === 'minimized') return null;

  const isMaximized = win.state === 'maximized';
  const isSnapped = win.state === 'snapped';

  return (
    <>
      {snapPreview && (
        <SnapPreview zone={snapPreview} />
      )}

      <div
        ref={windowRef}
        className={clsx(
          'window',
          isTopmost && 'window--focused',
          isMaximized && 'window--maximized',
          isSnapped && 'window--snapped',
          className
        )}
        style={{
          left: win.position.x,
          top: win.position.y,
          width: win.size.width,
          height: win.size.height,
          zIndex: win.zIndex,
        }}
        onPointerDown={() => useWindowStore.getState().focusWindow(windowId)}
      >
        <WindowHeader
          windowId={windowId}
          dragProps={dragProps}
          onSnapPreview={setSnapPreview}
        />

        <div className="window__content">
          {children}
        </div>

        {!isMaximized && !isSnapped && win.resizable && (
          <ResizeHandles windowId={windowId} />
        )}
      </div>
    </>
  );
}