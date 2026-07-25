import { useState } from 'react';
import { Workspace } from './components/Workspace/md-workspace';
import {type BarPosition } from './components/Workspace/props/md-workspace';
import "./App.css"

export function App() {
  const [dockPos, setDockPos] = useState<BarPosition>('left');

  return (
    <Workspace 
      background="#141218"
      color="#e6e1e5"
      dockPosition={dockPos}
      onDockPositionChange={(newPos) => setDockPos(newPos)}
    ></Workspace>
  );
}

export default App;