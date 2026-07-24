import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CardMateProps{
    id?: number;
    icon?: string;
    title: string;
    category?: string;
    children: ReactNode;
    onClick?: () => void;
}

export function CardMate({id, icon ,title, category, children, onClick}: CardMateProps){
    return(
        <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        backgroundColor: '#1E1033', // Morado oscuro de fondo
        borderRadius: '28px',       // Esquinas muy redondeadas (Material You)
        padding: '24px',
        color: '#EAE0F9',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '320px'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#FFFFFF', fontWeight: 600 }}>
          {title}
        </h3>
        
        {/* Renderizado condicional: Usamos && para renderizar la categoría solo si la variable existe y es verdadera */}
        {category && (
          <span style={{ 
            fontSize: '0.85rem', 
            color: '#A78BFA', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            fontWeight: 500
          }}>
            {category}
          </span>
        )}
      </div>
      
      {/* Contenedor dinámico para el contenido interno (imágenes, botones, etc.) */}
      <div style={{ marginTop: 'auto' }}>
        {children}
      </div>
    </motion.div>
  );
}