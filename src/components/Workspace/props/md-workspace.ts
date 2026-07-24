import type React from "react";
import { createContext, useContext, type ReactNode } from "react";

export type BarPosition = 'left' | 'right' | 'top' | 'bottom';

export interface WorkspaceProps {
    id?: number;
    menuBar?: ReactNode;
    contextBar?: ReactNode;
    children?: ReactNode;
    menuPosition?: BarPosition;
    onPositionChange?: (newPos: BarPosition) => void;
    background?: React.CSSProperties['backgroundColor'];
    color?: React.CSSProperties['color'];
}

export function componentId(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface WorkspaceContextType {
    position: BarPosition;
    setPosition: (pos: BarPosition) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextType>({
    position: 'left',
    setPosition: () => {}
});

export const useWorkspace = () => useContext(WorkspaceContext);