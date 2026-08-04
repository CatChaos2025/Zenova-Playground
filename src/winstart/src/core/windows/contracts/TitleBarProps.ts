import { WindowNode } from "../engine/WindowNode";

export interface TitleBarActions{
    onClose: (id: string) => void;
    onMinimize: (id: string) => void;
    onMaximize: (id: string) => void;
    onAboutClick?: (id: string) => void;
}

export interface TitleBarState {
    title: string;
    isFocused: boolean;
    isMaximized: boolean;
    allowMinimize: boolean;
    allowMaximize: boolean;
    allowClose: boolean;
    icon?: string;
}

export interface WindowTitleBarProps extends TitleBarActions {
    nodeId: string;
    state: TitleBarState;
    theme: {
        titlebarBg?: string;
        highlightColor?: string;
        fontFamily?: string;
    };
}