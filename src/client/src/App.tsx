import { useEffect, useState } from 'react';
// 1. Importamos el tipo compartido
import type { User } from '@zenova/shared';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 2. Consumimos el endpoint de Fastify
    fetch('http://localhost:3000/api/users/123')
      .then((res) => {
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        return res.json();
      })
      .then((resData) => {
        // La respuesta del servidor trae { success: true, data: mockUser }
        setUser(resData.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <h1>🚀 Zenova Playground</h1>
      <hr style={{ margin: '1.5rem 0', opacity: 0.2 }} />

      <h2>Estado de la conexión Monorrepo:</h2>

      {loading && <p>Cargando datos desde Fastify...</p>}
      {error && <p style={{ color: 'crimson' }}>❌ Error: {error}</p>}

      {user && (
        <div style={{ background: '#1e1e2e', color: '#cdd6f4', padding: '1rem', borderRadius: '8px', display: 'inline-block' }}>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Usuario:</strong> {user.username}</p>
          <p><strong>Rol:</strong> {user.role}</p>
        </div>
      )}
    </div>
  );
}

export default App;