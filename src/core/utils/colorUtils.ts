// src/utils/colorUtils.ts

export const isDarkColor = (hex: string): boolean => {
    if (!hex) return false;
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return false;
    
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    
    // Fórmula estándar de luminancia percibida
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128; // Retorna true si el color es oscuro
};

// Retorna blanco (#FFFFFF) si es oscuro, o un tono oscuro legible si es claro
export const getContrastTextColor = (hex: string): string => {
    return isDarkColor(hex) ? '#FFFFFF' : '#381E72';
};