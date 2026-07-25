import type React from "react";
import { createContext, useContext, type ReactNode } from "react";

export type BarPosition = 'left' | 'right' | 'top' | 'bottom';

export interface WorkspaceProps {
    id?: number;

    // Barras y contenido
    menuBar?: ReactNode;
    dockBar?: ReactNode;
    contextBar?: ReactNode;
    contextualMenu?: ReactNode;
    children?: ReactNode;

    // Posición y callbacks
    menuPosition?: BarPosition;
    dockPosition?: BarPosition;
    onPositionChange?: (newPos: BarPosition) => void;
    onDockPositionChange?: (newPos: BarPosition) => void;

    // Estilos
    background?: React.CSSProperties['backgroundColor'];
    color?: React.CSSProperties['color'];
}

export function componentId(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Interfaz del Contexto
export interface WorkspaceContextType {
    position: BarPosition;
    dockPosition: BarPosition;
    setPosition: (pos: BarPosition) => void;
    setDockPosition: (pos: BarPosition) => void;
}

// Contexto inicializado
export const WorkspaceContext = createContext<WorkspaceContextType>({
    position: 'left',
    dockPosition: 'left',
    setPosition: () => {},
    setDockPosition: () => {}
});

export const useWorkspace = () => useContext(WorkspaceContext);