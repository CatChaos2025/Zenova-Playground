import { useState, useEffect, useRef } from "react";

export interface DebugError {
  id: number;
  type: "error" | "warning" | "promise";
  message: string;
  timestamp: number;
  source?: string;
}

export interface DebugInfo {
  uptime: number;
  renderCount: number;
  memoryUsed: number | null;
  memoryTotal: number | null;
  memoryPercent: number | null;
  errors: DebugError[];
}

let errorIdCounter = 0;

export function useDebugInfo(): DebugInfo {
  const startTime = useRef(Date.now());
  const renderCountRef = useRef(0); // ✅ Ref en lugar de state
  
  const [uptime, setUptime] = useState(0);
  const [renderCount, setRenderCount] = useState(0); // Solo para mostrar
  const [memory, setMemory] = useState<{
    used: number | null;
    total: number | null;
    percent: number | null;
  }>({
    used: null,
    total: null,
    percent: null,
  });
  const [errors, setErrors] = useState<DebugError[]>([]);

  // ✅ Contador de renders CORRECTO: solo incrementa el ref, no causa re-renders
  renderCountRef.current += 1;

  // Uptime cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime.current) / 1000));
      setRenderCount(renderCountRef.current); // ✅ Solo actualiza el estado para mostrar
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Memoria (solo Chrome/Edge)
  useEffect(() => {
    const perfMemory = (performance as any).memory;
    if (perfMemory) {
      const interval = setInterval(() => {
        const used = Math.round(perfMemory.usedJSHeapSize / 1048576);
        const total = Math.round(perfMemory.jsHeapSizeLimit / 1048576);
        setMemory({
          used,
          total,
          percent: Math.round((used / total) * 100),
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, []);

  // Captura global de errores
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const newError: DebugError = {
        id: ++errorIdCounter,
        type: "error",
        message: event.message || "Error desconocido",
        timestamp: Date.now(),
        source: event.filename ? `${event.filename}:${event.lineno}` : undefined,
      };
      setErrors((prev) => [newError, ...prev].slice(0, 20));
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const newError: DebugError = {
        id: ++errorIdCounter,
        type: "promise",
        message:
          event.reason?.message || String(event.reason) || "Promise rechazada",
        timestamp: Date.now(),
      };
      setErrors((prev) => [newError, ...prev].slice(0, 20));
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return {
    uptime,
    renderCount,
    memoryUsed: memory.used,
    memoryTotal: memory.total,
    memoryPercent: memory.percent,
    errors,
  };
}