import React,{ type ReactNode } from 'react';
import './OSLayout.css'; // Importamos el CSS clásico

export interface SidebarItem {
  id: string;
  icon: ReactNode;
  label?: string;
  isActive?: boolean;
  onClick: () => void;
}

export interface TopbarAction {
  id: string;
  icon: ReactNode;
  tooltip?: string;
  onClick: () => void;
}

export interface OSLayoutProps {
  children: ReactNode;
  appName?: string;
  appLogo?: ReactNode;
  topbarActions?: TopbarAction[];
  showBattery?: boolean;
  showWifi?: boolean;
  sidebarItems: SidebarItem[];
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
}

export const OSLayout: React.FC<OSLayoutProps> = ({
  children,
  appName = "Motion",
  appLogo,
  topbarActions,
  showBattery = true,
  showWifi = true,
  sidebarItems,
  onSettingsClick,
  onHelpClick
}) => {
  return (
    <div className="os-layout">
      
      {/* SIDEBAR */}
      <aside className="os-sidebar">
        <div className="os-logo-container">
          <div className="os-logo"></div>
        </div>
        
        <nav className="os-nav">
          {sidebarItems.map((item) => (
            <button 
              key={item.id}
              onClick={item.onClick}
              className={`os-nav-btn ${item.isActive ? 'active' : ''}`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </nav>

        <div className="os-sidebar-footer">
          {(onHelpClick || onSettingsClick) && (
             <>
               {onHelpClick && <button onClick={onHelpClick} className="os-nav-btn">?</button>}
               {onSettingsClick && <button onClick={onSettingsClick} className="os-nav-btn">⚙</button>}
             </>
          )}
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="os-main-wrapper">
        
        {/* TOP BAR */}
        <header className="os-topbar">
          <div className="os-topbar-left">
            {appLogo && <span>{appLogo}</span>}
            <span>{appName}</span>
          </div>

          <div className="os-topbar-right">
            {topbarActions && topbarActions.length > 0 && (
              <div className="os-topbar-actions">
                {topbarActions.map(action => (
                  <button 
                    key={action.id} 
                    onClick={action.onClick}
                    className="os-action-btn"
                    title={action.tooltip}
                  >
                    {action.icon}
                  </button>
                ))}
              </div>
            )}
            
            {showWifi && <span>WIFI</span>}
            {showBattery && <span>10%</span>}
          </div>
        </header>

        {/* ÁREA DE CONTENIDO */}
        <main className="os-content">
          {children}
        </main>
        
      </div>
    </div>
  );
};