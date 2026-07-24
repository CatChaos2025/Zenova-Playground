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
            menuPosition: props.menuPosition ?? 'left'
        };
    }

    setPosition = (newPos: BarPosition) => {
        this.setState({ menuPosition: newPos });
        if (this.props.onPositionChange) {
            this.props.onPositionChange(newPos);
        }
    }

    render(): ReactNode {
        const {
            contextBar, 
            menuBar, 
            children, 
            background, 
            color 
        } = this.props;

        const { menuPosition } = this.state;

        const isVertical = menuPosition === 'top' || menuPosition === 'bottom';

        return (
            <WorkspaceContext.Provider value={{ position: menuPosition, setPosition: this.setPosition }}>
                <section className="workspace" style={{ backgroundColor: background, color: color }}>
                    {contextBar && (
                        <header className="context-menu">{contextBar}</header>
                    )}

                    <section 
                        className={`content-workspace position-${menuPosition}`}
                        style={{ flexDirection: isVertical ? 'column' : 'row' }}
                    >
                        {menuBar && (
                            <aside className="workspace-bar">{menuBar}</aside>
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