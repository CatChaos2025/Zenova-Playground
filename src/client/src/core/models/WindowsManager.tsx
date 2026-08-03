import { Window } from './Window';
import { AppManifest } from '../types/app.types';
import { eventService } from '../services/EventService';

export class WindowManager {
  private windows = new Map<string, Window>();
  private zIndexCounter = 100;
  private activeWorkspaceId = 'default';
  
  // 🔥 CACHÉ DEL SNAPSHOT — clave para evitar el loop infinito
  private cachedWindows: Window[] = [];
  private cacheValid = false;

  constructor() {
    this.loadFromStorage();
  }

  // Crear ventana
  createWindow(appId: string, manifest: AppManifest): Window {
    if (manifest.capabilities.singleton) {
      const existing = Array.from(this.windows.values()).find(w => w.appId === appId);
      if (existing) {
        this.focusWindow(existing.id);
        return existing;
      }
    }

    this.zIndexCounter++;
    const offset = (this.windows.size % 8) * 30;
    
    const window = new Window(
      `${appId}-${Date.now()}`,
      appId,
      manifest,
      this.zIndexCounter,
      this.activeWorkspaceId,
      { x: 150 + offset, y: 100 + offset }
    );

    this.windows.set(window.id, window);
    this.emitChange();
    return window;
  }

  closeWindow(id: string): void {
    this.windows.delete(id);
    this.emitChange();
  }

  focusWindow(id: string): void {
    const win = this.windows.get(id);
    if (!win) return;

    this.zIndexCounter++;
    win.bringToFront(this.zIndexCounter);
    this.emitChange();
  }

  toggleMaximize(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      win.toggleMaximize();
      this.emitChange();
    }
  }

  toggleMinimize(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      win.state === 'minimized' ? win.restore() : win.minimize();
      this.emitChange();
    }
  }

  moveWindow(id: string, x: number, y: number): void {
    const win = this.windows.get(id);
    if (win) {
      win.moveTo(x, y);
      // 🚨 NO emitimos change aquí para evitar re-renders durante el drag
      // El UI actualiza el DOM directamente con CSS variables
    }
  }

  resizeWindow(id: string, width: number, height: number): void {
    const win = this.windows.get(id);
    if (win) {
      win.resizeTo(width, height);
      // 🚨 Igual que moveWindow: no emitimos durante el resize
    }
  }

  // 🔥 Este SÍ debe emitir porque es un cambio estructural
  commitMove(id: string, x: number, y: number): void {
    const win = this.windows.get(id);
    if (win) {
      win.moveTo(x, y);
      this.emitChange();
    }
  }

  commitResize(id: string, width: number, height: number): void {
    const win = this.windows.get(id);
    if (win) {
      win.resizeTo(width, height);
      this.emitChange();
    }
  }

  snapWindow(id: string, zone: 'left' | 'right'): void {
    const win = this.windows.get(id);
    if (!win) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight - 48;

    win.snapTo(zone);
    
    if (zone === 'left') {
      win.position = { x: 0, y: 0 };
      win.size = { width: vw / 2, height: vh };
    } else if (zone === 'right') {
      win.position = { x: vw / 2, y: 0 };
      win.size = { width: vw / 2, height: vh };
    }

    this.emitChange();
  }

  // 🔥 GETTER CACHEADO — la clave de la solución
  getWindows(): Window[] {
    if (!this.cacheValid) {
      this.cachedWindows = Array.from(this.windows.values())
        .filter(w => w.workspaceId === this.activeWorkspaceId)
        .sort((a, b) => a.zIndex - b.zIndex);
      this.cacheValid = true;
    }
    return this.cachedWindows;
  }

  getWindow(id: string): Window | undefined {
    return this.windows.get(id);
  }

  // Event system
  subscribe(callback: () => void): () => void {
    return eventService.on('windowManager:change', callback);
  }

  private emitChange(): void {
    // 🔥 Invalidar caché cuando cambia algo
    this.cacheValid = false;
    this.saveToStorage();
    eventService.emit('windowManager:change');
  }

  private saveToStorage(): void {
    try {
      const data = {
        windows: Array.from(this.windows.entries()).map(([id, w]) => ({
          id,
          appId: w.appId,
          position: w.position,
          size: w.size,
          state: w.state,
          snapZone: w.snapZone,
          workspaceId: w.workspaceId,
        })),
        activeWorkspaceId: this.activeWorkspaceId,
      };
      localStorage.setItem('windowManager', JSON.stringify(data));
    } catch (e) {}
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('windowManager');
      if (saved) {
        console.log('Estado previo encontrado:', JSON.parse(saved));
      }
    } catch (e) {}
  }
}

export const windowManager = new WindowManager();