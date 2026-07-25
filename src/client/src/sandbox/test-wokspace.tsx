import { TestBanner } from "./components/test-banner";
import { Workspace } from "../components/Workspace/md-workspace";
import { useWorkspace, type BarPosition } from "../components/Workspace/props/md-workspace";

// Este componente DEBE estar dentro de <Workspace> para que useWorkspace() funcione
function PanelControl() {
  const { position, setPosition } = useWorkspace();
  const posiciones: BarPosition[] = ["left", "top", "right", "bottom"];

  return (
    <div style={{ 
      padding: "16px", 
      background: "rgba(34, 34, 34, 0.9)", 
      borderRadius: "12px", 
      color: "#fff", 
      marginTop: "16px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      maxWidth: "400px"
    }}>
      <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: 600 }}>
        Panel de Pruebas (Context API)
      </h3>
      <p style={{ margin: "0 0 12px 0", fontSize: "13px", opacity: 0.8 }}>
        Posición de la barra: <strong>{position}</strong>
      </p>
      
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {posiciones.map((pos) => (
          <button
            key={pos}
            onClick={() => setPosition(pos)}
            style={{
              padding: "8px 14px",
              background: position === pos ? "#fdd835" : "rgba(255, 255, 255, 0.1)",
              color: position === pos ? "#000" : "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "12px",
              transition: "all 0.2s ease",
              outline: position === pos ? "2px solid #fdd835" : "none"
            }}
          >
            {pos.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TestWorkspace() {
  return (
    <div style={{ 
      width: "100%", 
      height: "100dvh", 
      margin: 0,
      padding: 0,
      display: "flex", 
      flexDirection: "column",
      overflow: "hidden",
      boxSizing: "border-box"
    }}>
      <TestBanner />

      {/* 
        Contenedor intermedio que ocupa todo el espacio restante (flex: 1).
        Aquí aplicamos los estilos de layout en lugar de pasarlos a Workspace.
      */}
      <div style={{ flex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <Workspace
          background="#1e1e1e"
          color="#ffffff"
          contextBar={
            <div style={{ 
              padding: "10px 16px", 
              fontWeight: "600", 
              fontSize: "13px", 
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              letterSpacing: "0.5px"
            }}>
              Arch Linux Style - Context Menu
            </div>
          }
          menuBar={
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <button style={{ padding: "8px", borderRadius: "6px", border: "none", background: "#333", color: "#fff", cursor: "pointer", fontWeight: 500 }}>[1]</button>
              <button style={{ padding: "8px", borderRadius: "6px", border: "none", background: "#333", color: "#fff", cursor: "pointer", fontWeight: 500 }}>[2]</button>
              <button style={{ padding: "8px", borderRadius: "6px", border: "none", background: "#333", color: "#fff", cursor: "pointer", fontWeight: 500 }}>[3]</button>
            </div>
          }
        >
          <div style={{ padding: "24px", height: "100%", boxSizing: "border-box", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "600" }}>
              Área de Trabajo Principal
            </h2>
            <p style={{ margin: "0 0 16px 0", opacity: 0.7, fontSize: "14px" }}>
              El Workspace ahora ocupa el 100% de la pantalla sin márgenes externos.
            </p>
            <PanelControl />
          </div>
        </Workspace>
      </div>
    </div>
  );
}