import { motion } from 'framer-motion';
import './Window.css';

interface SnapPreviewProps {
  zone: 'left' | 'right';
}

export function SnapPreview({ zone }: SnapPreviewProps) {
  const vw = window.innerWidth;
  const vh = window.innerHeight - 48;

  return (
    <motion.div
      className="window__snap-preview"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{
        left: zone === 'left' ? 0 : vw / 2,
        top: 0,
        width: vw / 2,
        height: vh,
      }}
    />
  );
}