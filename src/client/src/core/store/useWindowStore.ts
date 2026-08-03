import { create } from 'zustand';
import { WindowConfig, WindowStateData, Position, Size, SnapZone } from "../types/window.types";

interface WindowInstance extends WindowConfig, WindowStateData {
  id: string;
  prevBounds?: { position: Position; size: Size };
}

interface WindowStore {
  windows: Map<string, WindowInstance>;
  zIndexCounter: number;
  _cachedWindows: WindowInstance[];
  _cacheValid: boolean;

  openWindow: (config: WindowConfig) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  
  // Updates visuales (NO disparan re-renders)
  updateWindowPosition: (id: string, position: Position) => void;
  updateWindowSize: (id: string, size: Size) => void;
  
  // Commits finales (SÍ disparan re-renders)
  commitPosition: (id: string, position: Position) => void;
  commitSize: (id: string, size: Size) => void;
  snapWindow: (id: string, zone: SnapZone) => void;

  getWindow: (id: string) => WindowInstance | undefined;
  getWindows: () => WindowInstance[];
  getTopWindow: () => WindowInstance | undefined;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: new Map(),
  zIndexCounter: 100,
  _cachedWindows: [],
  _cacheValid: false,

  openWindow: (config) => {
    const finalId = config.id || `${config.appId}-${Date.now()}`;
    
    if (config.id) {
      const existing = get().windows.get(config.id);
      if (existing) {
        get().focusWindow(config.id);
        return config.id;
      }
    }

    set(state => {
      const newZIndex = state.zIndexCounter + 1;
      const window: WindowInstance = {
        ...config,
        id: finalId,
        position: config.initialPosition || { 
          x: 100 + (state.windows.size * 30), 
          y: 100 + (state.windows.size * 30) 
        },
        size: config.initialSize || { width: 600, height: 400 },
        state: 'normal',
        snapZone: null,
        zIndex: newZIndex,
        isFocused: true,
        resizable: config.resizable ?? true,
        maximizable: config.maximizable ?? true,
        minimizable: config.minimizable ?? true,
        closable: config.closable ?? true,
        draggable: config.draggable ?? true,
        snapEnabled: config.snapEnabled ?? true,
        animationDuration: config.animationDuration ?? 250,
      };
      
      return {
        windows: new Map(state.windows).set(finalId, window),
        zIndexCounter: newZIndex,
        _cacheValid: false,
      };
    });
    
    return finalId;
  },

  closeWindow: (id) => set(state => {
    const windows = new Map(state.windows);
    windows.delete(id);
    return { windows, _cacheValid: false };
  }),

  focusWindow: (id) => set(state => {
    const win = state.windows.get(id);
    if (!win) return state;

    const newZIndex = state.zIndexCounter + 1;
    const windows = new Map(state.windows);
    
    windows.set(id, { ...win, zIndex: newZIndex, isFocused: true, state: win.state === 'minimized' ? 'normal' : win.state });
    windows.forEach((w, key) => {
      if (key !== id) windows.set(key, { ...w, isFocused: false });
    });

    return { windows, zIndexCounter: newZIndex, _cacheValid: false };
  }),

  minimizeWindow: (id) => set(state => {
    const win = state.windows.get(id);
    if (!win || !win.minimizable) return state;
    
    const windows = new Map(state.windows);
    windows.set(id, { ...win, state: 'minimized', isFocused: false });
    return { windows, _cacheValid: false };
  }),

  maximizeWindow: (id) => set(state => {
    const win = state.windows.get(id);
    if (!win || !win.maximizable) return state;

    const windows = new Map(state.windows);
    
    if (win.state === 'maximized') {
      const restored = win.prevBounds || { position: win.position, size: win.size };
      windows.set(id, { 
        ...win, 
        state: 'normal', 
        position: restored.position, 
        size: restored.size,
        prevBounds: undefined 
      });
    } else {
      windows.set(id, { 
        ...win, 
        state: 'maximized',
        prevBounds: { position: win.position, size: win.size },
        position: { x: 0, y: 0 },
        size: { width: window.innerWidth, height: window.innerHeight - 48 }
      });
    }
    
    return { windows, _cacheValid: false };
  }),

  restoreWindow: (id) => set(state => {
    const win = state.windows.get(id);
    if (!win) return state;
    
    const windows = new Map(state.windows);
    windows.set(id, { ...win, state: 'normal' });
    return { windows, _cacheValid: false };
  }),

  // ✅ NO invalida cache - solo actualiza el Map internamente
  updateWindowPosition: (id, position) => {
    const state = get();
    const win = state.windows.get(id);
    if (!win) return;
    
    // Mutación directa del Map (sin set() para evitar re-render)
    state.windows.set(id, { ...win, position });
  },

  updateWindowSize: (id, size) => {
    const state = get();
    const win = state.windows.get(id);
    if (!win) return;
    
    let finalSize = { ...size };
    if (win.minSize) {
      finalSize.width = Math.max(finalSize.width, win.minSize.width);
      finalSize.height = Math.max(finalSize.height, win.minSize.height);
    }
    if (win.maxSize) {
      finalSize.width = Math.min(finalSize.width, win.maxSize.width);
      finalSize.height = Math.min(finalSize.height, win.maxSize.height);
    }
    
    state.windows.set(id, { ...win, size: finalSize });
  },

  // ✅ SÍ invalida cache - cambios estructurales
  commitPosition: (id, position) => set(state => {
    const win = state.windows.get(id);
    if (!win) return state;
    
    const windows = new Map(state.windows);
    windows.set(id, { ...win, position });
    return { windows, _cacheValid: false };
  }),

  commitSize: (id, size) => set(state => {
    const win = state.windows.get(id);
    if (!win) return state;
    
    const windows = new Map(state.windows);
    windows.set(id, { ...win, size });
    return { windows, _cacheValid: false };
  }),

  snapWindow: (id, zone) => set(state => {
    const win = state.windows.get(id);
    if (!win || !win.snapEnabled) return state;

    const vw = window.innerWidth;
    const vh = window.innerHeight - 48;
    const halfW = vw / 2;
    const halfH = vh / 2;

    let position: Position;
    let size: Size;

    switch (zone) {
      case 'left': position = { x: 0, y: 0 }; size = { width: halfW, height: vh }; break;
      case 'right': position = { x: halfW, y: 0 }; size = { width: halfW, height: vh }; break;
      case 'top-left': position = { x: 0, y: 0 }; size = { width: halfW, height: halfH }; break;
      case 'top-right': position = { x: halfW, y: 0 }; size = { width: halfW, height: halfH }; break;
      case 'bottom-left': position = { x: 0, y: halfH }; size = { width: halfW, height: halfH }; break;
      case 'bottom-right': position = { x: halfW, y: halfH }; size = { width: halfW, height: halfH }; break;
      default: return state;
    }

    const windows = new Map(state.windows);
    windows.set(id, { ...win, position, size, snapZone: zone, state: zone ? 'snapped' : 'normal' });
    
    return { windows, _cacheValid: false };
  }),

  getWindow: (id) => get().windows.get(id),

  getWindows: () => {
    const state = get();
    if (state._cacheValid) {
      return state._cachedWindows;
    }
    
    const result = Array.from(state.windows.values())
      .filter(w => w.state !== 'minimized')
      .sort((a, b) => a.zIndex - b.zIndex);
    
    state._cachedWindows = result;
    state._cacheValid = true;
    
    return result;
  },

  getTopWindow: () => {
    const windows = Array.from(get().windows.values());
    return windows.reduce((top, w) => w.zIndex > (top?.zIndex || 0) ? w : top, undefined as WindowInstance | undefined);
  },
}));