import { getContrastTextColor } from '../../../core/utils/colorUtils';

export interface GameVisual {
    icon: string;
    color: string;
    iconColor: string;
}

/**
 * Icono universal para juegos que no tienen una regla específica.
 *
 * IMPORTANTE:
 * Nunca usamos el nombre del juego como contenido del Material Symbol.
 * Si no encontramos un icono conocido, usamos este genérico.
 */
export const DEFAULT_GAME_ICON = 'sports_esports';

/**
 * Paleta deliberadamente variada.
 *
 * El color se calcula de forma determinista usando el id/folder del juego,
 * así que el mismo juego conserva su color entre renders y sesiones.
 */
const GAME_PALETTE = [
    '#6750A4', // púrpura
    '#3F51B5', // índigo
    '#006C4C', // verde
    '#B3261E', // rojo
    '#7D5260', // rosa oscuro
    '#7A4E00', // ámbar
    '#005F73', // azul petróleo
    '#6A1B9A', // violeta
    '#2E7D32', // verde bosque
    '#1565C0', // azul
    '#9C2C77', // magenta
    '#4E5D6C', // pizarra
    '#00838F', // cyan oscuro
    '#AD1457', // rosa
    '#4527A0', // púrpura azul
    '#558B2F', // verde lima oscuro
    '#EF6C00', // naranja
    '#00897B', // turquesa
    '#C62828', // rojo intenso
    '#283593'  // azul índigo profundo
] as const;

const ICON_RULES: Array<{
    terms: string[];
    icon: string;
}> = [
    { terms: ['ajedrez', 'chess'], icon: 'chess' },
    { terms: ['sudoku'], icon: 'grid_3x3' },
    { terms: ['tetris'], icon: 'grid_on' },
    { terms: ['snake', 'serpiente'], icon: 'games' },
    {
        terms: ['tennis', 'tenis', 'pong'],
        icon: 'sports_tennis'
    },
    {
        terms: ['futbol', 'fútbol', 'football', 'soccer'],
        icon: 'sports_soccer'
    },
    { terms: ['sumo'], icon: 'sports_mma' },
    {
        terms: ['space', 'espacio', 'defender'],
        icon: 'rocket_launch'
    },
    {
        terms: ['solitario', 'klondike', 'cards', 'card'],
        icon: 'playing_cards'
    },
    {
        terms: [
            'simón',
            'simon',
            'mastermind',
            'memoria',
            'memory'
        ],
        icon: 'psychology'
    },
    {
        terms: [
            'atletismo',
            'runner',
            'running',
            'salto',
            'jump'
        ],
        icon: 'directions_run'
    },
    {
        terms: ['cuchillo', 'fruit', 'frutal'],
        icon: 'bolt'
    },
    {
        terms: ['surfer', 'surf', 'rider'],
        icon: 'surfing'
    },
    {
        terms: ['torre', 'tower'],
        icon: 'castle'
    },
    {
        terms: ['neon', 'neón', 'breaker'],
        icon: 'bolt'
    },
    {
        terms: ['pentago'],
        icon: 'change_history'
    },
    {
        terms: ['stack'],
        icon: 'layers'
    },
    {
        terms: ['saltar', 'salta'],
        icon: 'sports_handball'
    },
    {
        terms: ['arena'],
        icon: 'stadium'
    }
];

const normalize = (value: string): string =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const hashString = (value: string): number => {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
        hash =
            (hash << 5) -
            hash +
            value.charCodeAt(index);

        hash |= 0;
    }

    return Math.abs(hash);
};

const getGameColor = (
    id: string,
    title: string,
    folder: string
): string => {
    /**
     * Preferimos folder porque representa la identidad técnica del juego.
     * Si dos juegos tienen carpetas diferentes, normalmente tendrán colores
     * diferentes aunque sus títulos sean parecidos.
     */
    const identity = normalize(
        folder || id || title || 'game'
    );

    return GAME_PALETTE[
        hashString(identity) % GAME_PALETTE.length
    ];
};

export const getGameVisual = (
    id: string,
    title: string,
    folder: string
): GameVisual => {
    const source = normalize(
        `${id} ${title} ${folder}`
    );

    const matchedRule = ICON_RULES.find(rule =>
        rule.terms.some(term =>
            source.includes(normalize(term))
        )
    );

    const color = getGameColor(
        id,
        title,
        folder
    );

    /**
     * Regla crítica:
     * si no existe un icono específico, NO usamos id, title ni folder
     * como texto dentro del Material Symbols.
     *
     * En su lugar mostramos siempre el icono genérico de juegos.
     */
    const icon =
        matchedRule?.icon ||
        DEFAULT_GAME_ICON;

    let iconColor = '#FFFFFF';

    try {
        iconColor =
            getContrastTextColor(color);
    } catch {
        iconColor = '#FFFFFF';
    }

    return {
        icon,
        color,
        iconColor
    };
};