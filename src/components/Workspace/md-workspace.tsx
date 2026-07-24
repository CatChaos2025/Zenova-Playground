import React, { Component, type ReactNode } from "react";
import { type WorkspaceProps, componentId, type BarPosition, WorkspaceContext } from "./props/md-workspace";

export class Workspace extends Component<WorkspaceProps> {
    state = {
        id: this.props.id ?? componentId(100, 4040),
        dockPosition: this.props.dockPosition ?? 'left'
    };

    componentDidUpdate(prevProps: WorkspaceProps) {
        if (prevProps.dockPosition !== this.props.dockPosition && this.props.dockPosition) {
            this.setState({ dockPosition: this.props.dockPosition });
        }
    }

    handleSetDockPosition = (newPos: BarPosition) => {
        this.setState({ dockPosition: newPos });
        if (this.props.onDockPositionChange) {
            this.props.onDockPositionChange(newPos);
        }
    };

    render(): ReactNode {
        const { background, color, contextualMenu, dockBar, children } = this.props;
        const { dockPosition } = this.state;

        const rootStyle: React.CSSProperties = {
            backgroundColor: background ?? '#1e1e1e',
            color: color ?? '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            boxSizing: 'border-box'
        };

        const frameStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            
        };

        const bodyStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: dockPosition === 'right' ? 'row-reverse' : 'row',
            flex: 1,
            overflow: 'hidden',
            position: 'relative'
        };



        return (
            <WorkspaceContext.Provider value={{ dockPosition, setDockPosition: this.handleSetDockPosition }}>
                <div style={rootStyle}>
                    <div style={frameStyle}>
                        {contextualMenu && (
                            <div style={{ flexShrink: 0, zIndex: 20 }}>
                                {contextualMenu}
                            </div>
                        )}

                        <div style={bodyStyle}>
                            {dockBar && (
                                <div>
                                    {dockBar}
                                </div>
                            )}

                            <main>
                                {children}
                            </main>
                        </div>
                    </div>
                </div>
            </WorkspaceContext.Provider>
        );
    }
}