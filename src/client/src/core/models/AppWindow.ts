import React from 'react';
import { AppManifest, ResizeDirection, SnapPosition, WindowSize, WindowPosition } from './AppManifest';

export interface WindowBounds {
  position: WindowPosition;
  size: WindowSize;
}

export class AppWindow {
  public readonly id: string;
  public readonly appId: string;
  public readonly manifest: AppManifest;
  public readonly component: React.ReactNode;

  public position: WindowPosition;
  public size: WindowSize;
  public zIndex: number;
  public workspaceId: string;

  public isMaximized = false;
  public isMinimized = false;
  public isFocused = false;
  public snapPosition: SnapPosition = null;
  public opacity = 1; // para animaciones

  private restoredBounds: WindowBounds | null = null;
  private resizingBounds: Partial<{
    anchorX: number; anchorY: number;
    anchorW: number; anchorH: number;
    direction: ResizeDirection;
  }> | null = null;

  constructor(
    id: string,
    appId: string,
    manifest: AppManifest,
    component: React.ReactNode,
    initialZIndex: number,
    initialPosition: WindowPosition = { x: 80, y: 80 },
    workspaceId: string = 'ws-1',
  ) {
    this.id = id;
    this.appId = appId;
    this.manifest = manifest;
    this.component = component;
    this.zIndex = initialZIndex;
    this.position = initialPosition;
    this.size = { ...manifest.defaultSize };
    this.workspaceId = workspaceId;
  }

  public moveTo(x: number, y: number): void {
    if (this.isMaximized) return;
    
    // Al mover, deshacemos el snap si existe
    if (this.snapPosition) {
      this.snapPosition = null;
    }
    
    this.position = {
      x: Math.max(0, x),
      y: Math.max(0, y),
    };
  }

  public resizeTo(width: number, height: number): void {
    if (!this.manifest.isResizable || this.isMaximized) return;

    let newWidth = Math.round(width);
    let newHeight = Math.round(height);

    if (this.manifest.minSize) {
      newWidth = Math.max(newWidth, this.manifest.minSize.width);
      newHeight = Math.max(newHeight, this.manifest.minSize.height);
    }
    if (this.manifest.maxSize) {
      newWidth = Math.min(newWidth, this.manifest.maxSize.width);
      newHeight = Math.min(newHeight, this.manifest.maxSize.height);
    }

    this.size = { width: newWidth, height: newHeight };
  }

  // ==================== RESIZE AVANZADO ====================
  
  /**
   * Inicia un resize desde una dirección específica.
   */
  public startResize(direction: ResizeDirection, mouseX: number, mouseY: number): void {
    if (!this.manifest.isResizable || this.isMaximized) return;
    
    this.resizingBounds = {
      anchorX: this.position.x,
      anchorY: this.position.y,
      anchorW: this.size.width,
      anchorH: this.size.height,
      direction,
    };
  }

  public updateResize(mouseX: number, mouseY: number): void {
    if (!this.resizingBounds || !this.manifest.isResizable) return;
    const { anchorX = 0, anchorY = 0, anchorW = 0, anchorH = 0, direction } = this.resizingBounds;

    const dx = mouseX - anchorX;
    const dy = mouseY - anchorY;

    let newX = anchorX;
    let newY = anchorY;
    let newW = anchorW;
    let newH = anchorH;

    // Cálculo según dirección
    if (direction?.includes('e')) newW = anchorW + (mouseX - anchorX);
    if (direction?.includes('s')) newH = anchorH + (mouseY - anchorY);
    if (direction?.includes('w')) {
      newW = anchorW - (mouseX - anchorX);
      newX = mouseX;
    }
    if (direction?.includes('n')) {
      newH = anchorH - (mouseY - anchorY);
      newY = mouseY;
    }

    // Aplicar límites manteniendo el ancla
    this.resizeTo(newW, newH);
    
    // Si se redujo el tamaño, mover la posición para el caso w/n
    if (direction?.includes('w') || direction?.includes('n')) {
      this.position = { x: newX, y: newY };
    }
  }

  public endResize(): void {
    this.resizingBounds = null;
  }

  public toggleMaximize(): void {
    if (!this.manifest.isMaximizable) return;

    if (this.isMaximized) {
      if (this.restoredBounds) {
        this.position = { ...this.restoredBounds.position };
        this.size = { ...this.restoredBounds.size };
      }
      this.isMaximized = false;
      this.snapPosition = null;
    } else {
      this.restoredBounds = {
        position: { ...this.position },
        size: { ...this.size },
      };
      this.isMaximized = true;
      this.snapPosition = null;
    }
  }

  public minimize(): void {
    if (!this.manifest.isMinimizable) return;
    this.isMinimized = true;
    this.isFocused = false;
  }

  public restore(): void {
    this.isMinimized = false;
  }

  public focus(newZIndex: number): void {
    this.zIndex = newZIndex;
    this.isFocused = true;
    this.isMinimized = false;
  }
}

export type { SnapPosition };
export type { ResizeDirection };

