import { useDrag } from '@use-gesture/react'; 
import { useWindowStore } from '../core/store/useWindowStore';
import { Position, Size } from '../core/types/window.types';

interface UseWindowResizeOptions {
  windowId: string;
  direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  enabled?: boolean;
}

export function useWindowResize({ 
  windowId, 
  direction, 
  enabled = true 
}: UseWindowResizeOptions) {
  const window = useWindowStore(state => state.getWindow(windowId));
  const updateSize = useWindowStore(state => state.updateWindowSize);
  const updatePosition = useWindowStore(state => state.updateWindowPosition);
  const commitSize = useWindowStore(state => state.commitSize);
  const commitPosition = useWindowStore(state => state.commitPosition);

  const bind = useDrag(
    ({ 
      offset: [dx, dy], 
      memo = {
        startX: window?.position.x || 0,
        startY: window?.position.y || 0,
        startW: window?.size.width || 0,
        startH: window?.size.height || 0,
      }
    }) => {
      if (!window) return memo;

      let newWidth = memo.startW;
      let newHeight = memo.startH;
      let newX = memo.startX;
      let newY = memo.startY;

      if (direction.includes('e')) newWidth = memo.startW + dx; 
      if (direction.includes('s')) newHeight = memo.startH + dy; 
      if (direction.includes('w')) {                              
        newWidth = memo.startW - dx;
        newX = memo.startX + dx;
      }
      if (direction.includes('n')) {                      
        newHeight = memo.startH - dy;
        newY = memo.startY + dy;
      }

      if (window.minSize) {
        newWidth = Math.max(newWidth, window.minSize.width);
        newHeight = Math.max(newHeight, window.minSize.height);
      }
      if (window.maxSize) {
        newWidth = Math.min(newWidth, window.maxSize.width);
        newHeight = Math.min(newHeight, window.maxSize.height);
      }

      // Actualización visual (sin commit, para fluidez)
      updateSize(windowId, { width: newWidth, height: newHeight });
      if (direction.includes('w') || direction.includes('n')) {
        updatePosition(windowId, { x: newX, y: newY });
      }

      return memo;
    },
    {
      pointer: { touch: false }, 
      preventDefault: true,          
      enabled: enabled && 
               window?.resizable && 
               window?.state === 'normal' && 
               !window?.snapZone,
      from: () => [0, 0],
      threshold: 3,
    }
  );

  return bind();
}