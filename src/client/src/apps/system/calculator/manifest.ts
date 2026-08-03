import { AppManifest } from "../../../core/types/app.types";

export const calculatorManifest: AppManifest = {
  id: 'calculator',
  title: 'Calculadora',
  icon: '🧮',
  description: 'Calculadora básica',
  
  defaultSize: { width: 320, height: 480 },
  minSize: { width: 280, height: 400 },
  
  capabilities: {
    resizable: false,
    maximizable: false,
    minimizable: true,
    closable: true,
    singleton: true,
  },
};