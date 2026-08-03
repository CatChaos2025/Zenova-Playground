import React from "react";
import ReactDOM from "react-dom/client";
import  App from "./App";
import { TestWorkspace } from "./sandbox/test-wokspace";
import './App.css';
import './themes/windows11.css';

// Imprime en consola qué valor está leyendo Vite
console.log("Modo actual:", import.meta.env.VITE_APP_MODE);

const isTestMode = import.meta.env.VITE_APP_MODE === "test";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isTestMode ? <TestWorkspace /> : <App />}
  </React.StrictMode>
);