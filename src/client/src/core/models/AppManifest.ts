export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowBounds {
  position: WindowPosition;
  size: WindowSize;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export type SnapPosition = 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

export type WindowState = 'normal' | 'minimized' | 'maximized' | 'snapped';

export type ResizeDirection =
  | 'n' | 's' | 'e' | 'w'
  | 'ne' | 'nw' | 'se' | 'sw';

export interface AppManifest {
  title: string;
  icon: string;
  category?: string;
  
  defaultSize: WindowSize;
  minSize?: WindowSize;
  maxSize?: WindowSize;
  
  isResizable: boolean;
  isMaximizable: boolean;
  isMinimizable: boolean;
  isClosable?: boolean; 
  isAlwaysOnTop?: boolean; 
  isSingleton?: boolean; 
  
  // Aspecto
  titleBarStyle?: 'default' | 'hidden' | 'hiddenInset';
  backgroundColor?: string;
  
  isSystemApp?: boolean;
}

export type AppRegistry = Record<string, AppManifest>;

export const SYSTEM_REGISTRY: AppRegistry = {
  'demo-game': {
    title: 'Juego de Prueba',
    icon: '/icons/game.svg',
    category: 'games',
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 400, height: 300 },
    isResizable: true,
    isMaximizable: true,
    isMinimizable: true,
    isClosable: true,
  },
  'mini-calc': {
    title: 'Calculadora',
    icon: '/icons/calc.svg',
    category: 'utilities',
    defaultSize: { width: 320, height: 450 },
    minSize: { width: 280, height: 400 },
    isResizable: false,
    isMaximizable: false,
    isMinimizable: true,
    isClosable: true,
    isSingleton: true,
  },
  'terminal': {
    title: 'Terminal',
    icon: '/icons/terminal.svg',
    category: 'dev',
    defaultSize: { width: 700, height: 450 },
    minSize: { width: 320, height: 200 },
    isResizable: true,
    isMaximizable: true,
    isMinimizable: true,
    isAlwaysOnTop: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0a',
  },
};