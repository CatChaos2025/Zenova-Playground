// Contratos de respuesta estándar para la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// También puedes agregar los tipos comunes de tu app aquí:
export interface User {
  id: string;
  username: string;
  role: string;
}