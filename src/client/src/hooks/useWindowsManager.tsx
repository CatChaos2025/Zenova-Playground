// hooks/useWindowsManager.ts
import { useSyncExternalStore } from 'react';
import { windowManager } from '../core/models/WindowsManager';
import { Window } from '../core/models/Window'; // ✅ Importa la clase Window

export function useWindowManager() {
  const windows = useSyncExternalStore(
    (cb) => windowManager.subscribe(cb),
    () => windowManager.getWindows(), // Debe retornar Window[]
    () => windowManager.getWindows()
  );

  return {
    windows, // ✅ TypeScript sabe que es Window[]
    manager: windowManager,
  };
}