import { CardMate } from "./card-mate";
import "@fontsource/roboto-mono";
export default function ArcadeView() {
  return (
    <div style={{fontFamily: '"Roboto Mono", monospace',  display: 'flex', gap: '20px', padding: '40px' }}>
      
      <CardMate 
        title="Neon Drift" 
        category="Carreras / Arcade"
        onClick={() => console.log("Abriendo Neon Drift...")}
      >
        <div style={{
            height: '150px',
            borderRadius: '16px',
            backgroundColor: '#4C1D95',
            backgroundImage: 'linear-gradient(135deg, #4C1D95 0%, #2E1065 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <span>🎮 Toca para jugar</span>
        </div>
      </CardMate>

    </div>
  );
}