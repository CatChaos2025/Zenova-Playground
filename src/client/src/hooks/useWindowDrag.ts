import { useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { useWindowStore } from '../core/store/useWindowStore';

interface UseWindowDragOptions {
  windowId: string;
  enabled?: boolean;
  onSnapPreview?: (zone: 'left' | 'right' | null) => void;
}

export function useWindowDrag({ windowId, enabled = true, onSnapPreview }: UseWindowDragOptions) {
  const win = useWindowStore(state => state.getWindow(windowId));
  const commitPosition = useWindowStore(state => state.commitPosition);
  const snapWindow = useWindowStore(state => state.snapWindow);
  const focusWindow = useWindowStore(state => state.focusWindow);
  
  const windowRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const bind = useDrag(
    ({ active, offset: [ox, oy] }) => {
      if (!win) return;

      if (active) {
        // ✅ Calcular nueva posición basada en posición inicial + offset
        const newX = startPos.current.x + ox;
        const newY = startPos.current.y + oy;
        
        // ✅ Actualizar SOLO el DOM (sin re-render)
        if (windowRef.current) {
          windowRef.current.style.left = `${newX}px`;
          windowRef.current.style.top = `${newY}px`;
        }

        // Snap preview
        if (win.snapEnabled) {
          const vw = window.innerWidth;
          if (ox < -vw + 50) onSnapPreview?.('left');
          else if (ox > vw - 50) onSnapPreview?.('right');
          else onSnapPreview?.(null);
        }

        focusWindow(windowId);
      } else {
        // Drag ended - commit final position
        const finalX = startPos.current.x + ox;
        const finalY = startPos.current.y + oy;
        
        const vw = window.innerWidth;
        if (ox < -vw + 50 && win.snapEnabled) {
          snapWindow(windowId, 'left');
          onSnapPreview?.(null);
        } else if (ox > vw - 50 && win.snapEnabled) {
          snapWindow(windowId, 'right');
          onSnapPreview?.(null);
        } else {
          commitPosition(windowId, { x: finalX, y: finalY });
        }
      }
    },
    {
      filterTaps: true,
      pointer: { touch: false, capture: true },
      preventDefault: true,
      enabled: enabled && win?.state === 'normal' && !win?.snapZone && win?.draggable,
      // ✅ CLAVE: from retorna la posición actual del store como punto de partida
      from: () => {
        if (win) {
          startPos.current = { x: win.position.x, y: win.position.y };
        }
        return [0, 0]; // ✅ Offset empieza desde 0
      },
      threshold: 0,
      delay: 0,
    }
  );

  return { bind: bind(), windowRef };
}