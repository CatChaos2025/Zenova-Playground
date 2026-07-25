import { Component, type ReactNode } from "react";
import { 
    componentId, 
    WorkspaceContext, 
    type BarPosition, 
    type WorkspaceProps 
} from "./props/md-workspace";
import "./md-workspace.css";

interface WorkspaceState {
    id: number;
    menuPosition: BarPosition;
}

export class Workspace extends Component<WorkspaceProps, WorkspaceState> {
    constructor(props: WorkspaceProps) {
        super(props);

        this.state = {
            id: props.id ?? componentId(100, 4040),
            // Priorizamos dockPosition o menuPosition si vienen por props
            menuPosition: props.dockPosition ?? props.menuPosition ?? 'left'
        };
    }

    // ✅ Declaramos el método setPosition en la clase
    setPosition = (newPos: BarPosition) => {
        this.setState({ menuPosition: newPos });
        if (this.props.onPositionChange) {
            this.props.onPositionChange(newPos);
        }
        if (this.props.onDockPositionChange) {
            this.props.onDockPositionChange(newPos);
        }
    };

    render(): ReactNode {
        const {
            contextBar, 
            contextualMenu,
            menuBar, 
            dockBar,
            children, 
            background, 
            color 
        } = this.props;

        // ✅ Extraemos menuPosition desde el estado de la clase
        const { menuPosition } = this.state;

        const activeMenuBar = dockBar ?? menuBar;
        const activeContextBar = contextualMenu ?? contextBar;
        const isVertical = menuPosition === 'top' || menuPosition === 'bottom';

        return (
            <WorkspaceContext.Provider 
                value={{ 
                    position: menuPosition, 
                    dockPosition: menuPosition, 
                    setPosition: this.setPosition, 
                    setDockPosition: this.setPosition 
                }}
            >
                <section className="workspace" style={{ backgroundColor: background, color: color }}>
                    {activeContextBar && (
                        <header className="context-menu">{activeContextBar}</header>
                    )}

                    <section 
                        className={`content-workspace position-${menuPosition}`}
                        style={{ flexDirection: isVertical ? 'column' : 'row' }}
                    >
                        {activeMenuBar && (
                            <aside className="workspace-bar">{activeMenuBar}</aside>
                        )}

                        <section className="workspace-view">
                            {children}
                        </section>
                    </section>
                </section>
            </WorkspaceContext.Provider>
        );
    }
}