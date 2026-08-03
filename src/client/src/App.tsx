import React from 'react';
import { useWindowStore } from './core/store/useWindowStore';
import { Window } from './ui/windows/Window';
import { Taskbar } from './ui/taskbar/Taskbar';
import './themes/windows11.css';

// Ejemplo 1: Calculadora (cualquier componente)
function CalculatorApp() {
  const [display, setDisplay] = React.useState('0');
  
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ 
        background: 'rgba(0,0,0,0.3)', 
        padding: '20px', 
        textAlign: 'right',
        fontSize: '24px',
        marginBottom: '16px',
        borderRadius: '4px'
      }}>
        {display}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
          <button
            key={btn}
            onClick={() => setDisplay(prev => prev === '0' ? btn : prev + btn)}
            style={{
              padding: '16px',
              background: btn === '=' ? '#0078d4' : '#3b3b3b',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}

// Ejemplo 2: Terminal (otro componente cualquiera)
function TerminalApp() {
  return (
    <div style={{ 
      padding: '16px', 
      fontFamily: 'monospace',
      color: '#4ade80',
      background: '#0a0a0a',
      minHeight: '200px'
    }}>
      <p>➜ ~ npm start</p>
      <p>✓ Ready in 240 ms</p>
      <p> ~ <span style={{ animation: 'blink 1s infinite' }}>█</span></p>
    </div>
  );
}

// Ejemplo 3: Notas (texto simple)
function NotesApp() {
  const [text, setText] = React.useState('');
  
  return (
    <textarea
      value={text}
      onChange={e => setText(e.target.value)}
      placeholder="Escribe tus notas aquí..."
      style={{
        width: '100%',
        height: '100%',
        padding: '16px',
        border: 'none',
        background: 'transparent',
        color: 'inherit',
        resize: 'none',
        fontFamily: 'inherit',
        fontSize: '14px',
      }}
    />
  );
}

export default function App() {
  const windows = useWindowStore(state => state.getWindows());
  const openWindow = useWindowStore(state => state.openWindow);

  return (
    <div className="desktop">
      <div className="desktop-background" />
      
      {/* Desktop Icons */}
      <div className="desktop-icons">
        <button 
          className="desktop-icon"
          onClick={() => openWindow({
            id: 'calc-1',
            appId: 'calculator',
            title: 'Calculadora',
            icon: '🧮',
            initialSize: { width: 320, height: 480 },
            resizable: false,
            maximizable: false,
          })}
        >
          <span className="desktop-icon__graphic"></span>
          <span className="desktop-icon__label">Calculadora</span>
        </button>

        <button 
          className="desktop-icon"
          onClick={() => openWindow({
            id: 'term-1',
            appId: 'terminal',
            title: 'Terminal',
            icon: '⬛',
            initialSize: { width: 600, height: 400 },
          })}
        >
          <span className="desktop-icon__graphic">⬛</span>
          <span className="desktop-icon__label">Terminal</span>
        </button>

        <button 
          className="desktop-icon"
          onClick={() => openWindow({
            id: 'notes-1',
            appId: 'notes',
            title: 'Notas',
            icon: '',
            initialSize: { width: 400, height: 300 },
          })}
        >
          <span className="desktop-icon__graphic"></span>
          <span className="desktop-icon__label">Notas</span>
        </button>
      </div>

      {/* Windows - AGNOSTIC RENDERING */}
      {windows.map(win => (
        <Window key={win.id} windowId={win.id}>
          {/* Aquí renderizas CUALQUIER cosa - la ventana es agnóstica */}
          {win.appId === 'calculator' && <CalculatorApp />}
          {win.appId === 'terminal' && <TerminalApp />}
          {win.appId === 'notes' && <NotesApp />}
        </Window>
      ))}

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}