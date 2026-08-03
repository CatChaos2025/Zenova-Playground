import { Size, Position, Bounds, WindowState, ResizeDirection, SnapZone } from '../types/window.types';
import { AppManifest } from '../types/app.types';

export class Window {
  public readonly id: string;
  public readonly appId: string;
  public readonly manifest: AppManifest;
  
  public position: Position;
  public size: Size;
  public zIndex: number;
  public state: WindowState = 'normal';
  public snapZone: SnapZone = null;
  public workspaceId: string;
  
  private previousBounds: Bounds | null = null;

  constructor(
    id: string,
    appId: string,
    manifest: AppManifest,
    initialZIndex: number,
    workspaceId: string,
    initialPosition?: Position
  ) {
    this.id = id;
    this.appId = appId;
    this.manifest = manifest;
    this.zIndex = initialZIndex;
    this.workspaceId = workspaceId;
    this.position = initialPosition || { x: 100, y: 100 };
    this.size = { ...manifest.defaultSize };
  }

  // Movimiento
  moveTo(x: number, y: number): void {
    if (this.state === 'maximized') return;
    if (this.snapZone) this.snapZone = null;
    this.position = { x: Math.max(0, x), y: Math.max(0, y) };
  }

  // Redimensionado
  resizeTo(width: number, height: number): void {
    if (!this.manifest.capabilities.resizable || this.state === 'maximized') return;

    let w = Math.round(width);
    let h = Math.round(height);

    if (this.manifest.minSize) {
      w = Math.max(w, this.manifest.minSize.width);
      h = Math.max(h, this.manifest.minSize.height);
    }
    if (this.manifest.maxSize) {
      w = Math.min(w, this.manifest.maxSize.width);
      h = Math.min(h, this.manifest.maxSize.height);
    }

    this.size = { width: w, height: h };
  }

  // Maximizar/Restaurar
  toggleMaximize(): void {
    if (!this.manifest.capabilities.maximizable) return;

    if (this.state === 'maximized') {
      if (this.previousBounds) {
        this.position = { ...this.previousBounds.position };
        this.size = { ...this.previousBounds.size };
      }
      this.state = 'normal';
      this.snapZone = null;
    } else {
      this.previousBounds = {
        position: { ...this.position },
        size: { ...this.size },
      };
      this.state = 'maximized';
      this.snapZone = null;
    }
  }

  // Minimizar/Restaurar
  minimize(): void {
    if (!this.manifest.capabilities.minimizable) return;
    this.state = 'minimized';
  }

  restore(): void {
    if (this.state === 'minimized') {
      this.state = 'normal';
    }
  }

  // Snap
  snapTo(zone: SnapZone): void {
    this.snapZone = zone;
    this.state = zone ? 'snapped' : 'normal';
  }

  // Z-index
  bringToFront(newZIndex: number): void {
    this.zIndex = newZIndex;
    if (this.state === 'minimized') {
      this.state = 'normal';
    }
  }
}