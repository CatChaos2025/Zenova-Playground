import type React from "react";
import { createContext, useContext, type ReactNode } from "react";

export type BarPosition = 'left' | 'right';

export interface WorkspaceProps {
    id?: number;
    contextualMenu?: ReactNode; // Menú superior (arriba de todo)
    dockBar?: ReactNode;        // Barra lateral de iconos
    children?: ReactNode;       // Contenido central / Wallpaper 3D
    dockPosition?: BarPosition;
    onDockPositionChange?: (newPos: BarPosition) => void;
    background?: React.CSSProperties['backgroundColor'];
    color?: React.CSSProperties['color'];
}

export function componentId(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface WorkspaceContextType {
    dockPosition: BarPosition;
    setDockPosition: (pos: BarPosition) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextType>({
    dockPosition: 'left',
    setDockPosition: () => {}
});

export const useWorkspace = () => useContext(WorkspaceContext);