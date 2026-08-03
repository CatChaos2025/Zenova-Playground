import { Size } from "./window.types" 

export interface AppManifest{
    id: string;
    title: string;
    icon: string;
    description?: string;

    defaultSize: Size;
    minSize?: Size;
    maxSize?: Size;

    capabilities: {
        resizable: boolean;
        maximizable: boolean;
        minimizable: boolean;
        closable: boolean;
        singleton?: boolean;
        alwaysOnTop?: boolean;
    }

    theme?: {
        headerStyle?: 'default' | 'hidden' | 'inline';
        backgroundColor?: string;
        accentColor?: string;
    };
}

export type AppComponent = React.ComponentType<any>;

export interface AppRegistration {
  manifest: AppManifest;
  component: AppComponent;
}