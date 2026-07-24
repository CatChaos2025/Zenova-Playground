import React from 'react';
import "./assets/img/backoc.png";
import "./App.css";
import "./themes.css"

export const App: React.FC = () => {
  return (
    <div className="screen">
      {/* Barra superior de notificaciones/fecha */}
      <div className="datebar"></div>
      
      {/* Contenedor central (Menú + Contenido) */}
      <div className="contentlayout">
        <div className="menubar"></div>
        <div className="content"></div> 
      </div>
    </div>
  );
};