export interface Size{ width: number; height: number; }

export interface Position{ y: number; x: number; }

export interface Bounds{ position: Position; size: Size; }

export type WindowState = 'normal' | 'minimized' |  'maximized' | 'snapped';

export type SnapZone = 'left' | 'right' | 'top-left' | 'top-right' |'bottom-left' | 'bottom-right' | null;

export interface WindowConfig {
    id: string;
    appId: string;
    title: string;
    icon?: string;

    initialPosition?: Position;
    initialSize: Size;
    minSize?: Size;
    maxSize?: Size;

    resizable?: boolean;
    maximizable?: boolean;
    minimizable?: boolean;

    closable?: boolean;
    draggable?: boolean;
    snapEnabled?: boolean;

    animationDuration?: number;
}

export interface WindowStateData {
    position: Position;
    size: Size;
    state: WindowState;
    snapZone: SnapZone;
    zIndex: number;
    isFocused: boolean
}


export interface WindowInstance extends WindowConfig, WindowStateData {
    id: string;
    prevBounds?: { position: Position; size: Size }
}
