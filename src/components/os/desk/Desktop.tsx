import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import { Window } from '../windows/Window';
import { SettingsApp } from '../../apps/SettingsApp';
import { getContrastTextColor } from '../../../core/utils/colorUtils';
import { getGameVisual } from './gameVisuals';

interface OpenWindow {
    id: string;
    title: string;
    folder?: string;
    gameIcon?: string;
    gameColor?: string;
    isCustomApp?: boolean;
    customHeader?: React.ReactNode;
}

interface GameItem {
    id: string;
    title: string;
    folder: string;
}

const CONTEXT_BAR_HEIGHT = 42;
const DOCK_HEIGHT = 58;

const WORKSPACE_TOP = CONTEXT_BAR_HEIGHT;
const WORKSPACE_BOTTOM = DOCK_HEIGHT;

const DEFAULT_PRIMARY_COLOR = '#D0BCFF';
const LOCAL_SETTINGS_KEY = 'zenova-desktop-settings';

export const Desktop: React.FC = () => {
    const [windows, setWindows] =
        useState<OpenWindow[]>([]);

    const [minimizedIds, setMinimizedIds] =
        useState<string[]>([]);

    const [activeId, setActiveId] =
        useState<string | null>(null);

    const [availableGames, setAvailableGames] =
        useState<GameItem[]>([]);

    const [bgImage, setBgImage] = useState('');
    const [primaryColor, setPrimaryColor] =
        useState(DEFAULT_PRIMARY_COLOR);

    const [currentTime, setCurrentTime] =
        useState(new Date());

    const [isLoading, setIsLoading] =
        useState(false);

    const [isLauncherOpen, setIsLauncherOpen] =
        useState(false);

    const [gameSearch, setGameSearch] =
        useState('');

    const safePrimaryColor =
        typeof primaryColor === 'string' &&
        primaryColor.trim() !== ''
            ? primaryColor
            : DEFAULT_PRIMARY_COLOR;

    const contrastTextColor = useMemo(() => {
        try {
            return getContrastTextColor(
                safePrimaryColor
            );
        } catch {
            return '#1C1B1F';
        }
    }, [safePrimaryColor]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);

            let localBg = '';
            let localColor = DEFAULT_PRIMARY_COLOR;

            try {
                const localSettings =
                    window.localStorage.getItem(
                        LOCAL_SETTINGS_KEY
                    );

                if (localSettings) {
                    const parsed =
                        JSON.parse(localSettings);

                    if (
                        typeof parsed?.background_image ===
                        'string'
                    ) {
                        localBg =
                            parsed.background_image;
                    }

                    if (
                        typeof parsed?.theme_color ===
                            'string' &&
                        parsed.theme_color.trim() !== ''
                    ) {
                        localColor =
                            parsed.theme_color;
                    }
                }
            } catch (error) {
                console.warn(
                    'No se pudo recuperar la configuración local:',
                    error
                );
            }

            setBgImage(localBg);
            setPrimaryColor(localColor);

            try {
                const [
                    gamesResponse,
                    settingsResponse
                ] = await Promise.all([
                    fetch('/api/games'),
                    fetch('/api/settings')
                ]);

                if (gamesResponse.ok) {
                    const gamesData =
                        await gamesResponse.json();

                    if (Array.isArray(gamesData)) {
                        setAvailableGames(
                            gamesData
                                .filter(
                                    (game: any) =>
                                        game &&
                                        typeof game.id ===
                                            'string' &&
                                        typeof game.title ===
                                            'string'
                                )
                                .map(
                                    (game: any) => ({
                                        id: game.id,
                                        title: game.title,
                                        folder:
                                            typeof game.folder ===
                                                'string' &&
                                            game.folder.trim() !== ''
                                                ? game.folder
                                                : game.id
                                    })
                                )
                        );
                    } else {
                        setAvailableGames([]);
                    }
                } else {
                    setAvailableGames([]);
                }

                if (settingsResponse.ok) {
                    const settingsData =
                        await settingsResponse.json();

                    if (settingsData) {
                        const serverBg =
                            typeof settingsData.background_image ===
                            'string'
                                ? settingsData.background_image
                                : localBg;

                        const serverColor =
                            typeof settingsData.theme_color ===
                                'string' &&
                            settingsData.theme_color.trim() !== ''
                                ? settingsData.theme_color
                                : localColor;

                        setBgImage(serverBg);
                        setPrimaryColor(serverColor);

                        try {
                            window.localStorage.setItem(
                                LOCAL_SETTINGS_KEY,
                                JSON.stringify({
                                    background_image:
                                        serverBg,
                                    theme_color:
                                        serverColor
                                })
                            );
                        } catch {
                            // localStorage no disponible.
                        }
                    }
                }
            } catch (error) {
                console.error(
                    'No se pudieron cargar los datos:',
                    error
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const saveSettingsToBackend = (
        bg?: string,
        color?: string
    ) => {
        const nextBg =
            typeof bg === 'string'
                ? bg
                : bgImage;

        const nextColor =
            typeof color === 'string' &&
            color.trim() !== ''
                ? color
                : safePrimaryColor;

        setBgImage(nextBg);
        setPrimaryColor(nextColor);

        try {
            window.localStorage.setItem(
                LOCAL_SETTINGS_KEY,
                JSON.stringify({
                    background_image: nextBg,
                    theme_color: nextColor
                })
            );
        } catch (error) {
            console.warn(
                'No se pudo guardar la configuración local:',
                error
            );
        }

        fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                background_image: nextBg,
                theme_color: nextColor
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(
                        `Error ${response.status}`
                    );
                }

                return response;
            })
            .catch(error => {
                console.error(
                    'No se pudieron guardar los ajustes en el servidor:',
                    error
                );
            });
    };

    const normalizedGameSearch = gameSearch.trim().toLocaleLowerCase('es');

    const filteredGames = useMemo(() => {
        if (!normalizedGameSearch) {
            return availableGames;
        }

        return availableGames.filter(game =>
            [game.title, game.id, game.folder]
                .filter(Boolean)
                .some(value =>
                    value.toLocaleLowerCase('es').includes(
                        normalizedGameSearch
                    )
                )
        );
    }, [availableGames, normalizedGameSearch]);

    const toggleLauncher = () => {
        setIsLauncherOpen(prev => {
            const next = !prev;
            if (!next) {
                setGameSearch('');
            }
            return next;
        });
    };

    useEffect(() => {
        if (!isLauncherOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsLauncherOpen(false);
                setGameSearch('');
                return;
            }

            if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
                event.preventDefault();
                const input = document.getElementById(
                    'zenova-game-launcher-search'
                ) as HTMLInputElement | null;
                input?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLauncherOpen]);

    const handleDragOver = (
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();

        const file =
            e.dataTransfer.files?.[0];

        if (!file || !file.type.startsWith('image/')) {
            return;
        }

        const reader = new FileReader();

        reader.onload = event => {
            const result =
                event.target?.result;

            if (typeof result !== 'string') {
                return;
            }

            saveSettingsToBackend(
                result,
                safePrimaryColor
            );
        };

        reader.readAsDataURL(file);
    };

    const openGame = (
        id: string,
        title: string,
        folder?: string
    ) => {
        const gameFolder =
            typeof folder === 'string' &&
            folder.trim() !== ''
                ? folder.trim()
                : id;

        const visual =
            getGameVisual(
                id,
                title,
                gameFolder
            );

        console.log(
            '[ZENOVA] Abriendo juego:',
            {
                id,
                title,
                folder: gameFolder,
                url:
                    `/games/${encodeURIComponent(
                        gameFolder
                    )}/index.html`,
                visual
            }
        );

        setWindows(prev => {
            const existing =
                prev.find(
                    win => win.id === id
                );

            if (existing) {
                return prev.map(win =>
                    win.id === id
                        ? {
                            ...win,
                            folder: gameFolder,
                            gameIcon: visual.icon,
                            gameColor: visual.color
                        }
                        : win
                );
            }

            return [
                ...prev,
                {
                    id,
                    title,
                    folder: gameFolder,
                    gameIcon: visual.icon,
                    gameColor: visual.color
                }
            ];
        });

        setMinimizedIds(prev =>
            prev.filter(
                windowId =>
                    windowId !== id
            )
        );

        setActiveId(id);
    };

    const openSettings = () => {
        const id = 'settings-app';

        setWindows(prev => {
            if (
                prev.some(
                    window =>
                        window.id === id
                )
            ) {
                return prev;
            }

            return [
                ...prev,
                {
                    id,
                    title: 'Configuración',
                    isCustomApp: true,
                    customHeader: (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                minWidth: 0
                            }}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: '18px'
                                }}
                            >
                                settings
                            </span>

                            <span
                                style={{
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Configuración
                            </span>
                        </div>
                    )
                }
            ];
        });

        setMinimizedIds(prev =>
            prev.filter(
                windowId =>
                    windowId !== id
            )
        );

        setActiveId(id);
    };

    const closeWindow = (id: string) => {
        setWindows(prev =>
            prev.filter(
                window =>
                    window.id !== id
            )
        );

        setMinimizedIds(prev =>
            prev.filter(
                windowId =>
                    windowId !== id
            )
        );

        setActiveId(prev =>
            prev === id
                ? null
                : prev
        );
    };

    const toggleMinimize = (id: string) => {
        setMinimizedIds(prev => {
            const minimized =
                prev.includes(id);

            if (minimized) {
                setActiveId(id);

                return prev.filter(
                    windowId =>
                        windowId !== id
                );
            }

            setActiveId(
                prevActive =>
                    prevActive === id
                        ? null
                        : prevActive
            );

            return [...prev, id];
        });
    };

    const timeText =
        currentTime.toLocaleTimeString(
            'es-ES',
            {
                hour: '2-digit',
                minute: '2-digit'
            }
        );

    const dateText =
        currentTime.toLocaleDateString(
            'es-ES',
            {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            }
        );

    return (
        <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                backgroundColor: '#1C1B1F',
                backgroundImage:
                    bgImage
                        ? `url("${bgImage}")`
                        : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}
        >
            {bgImage && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'rgba(0,0,0,0.12)',
                        pointerEvents: 'none',
                        zIndex: 0
                    }}
                />
            )}

            <header
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height:
                        `${CONTEXT_BAR_HEIGHT}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    boxSizing: 'border-box',
                    background:
                        'rgba(48,45,56,0.90)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter:
                        'blur(16px)',
                    borderBottom:
                        '1px solid rgba(255,255,255,0.08)',
                    boxShadow:
                        '0 4px 16px rgba(0,0,0,0.18)',
                    zIndex: 5000
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: 0
                    }}
                >
                    <div
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '9px',
                            backgroundColor:
                                safePrimaryColor,
                            color:
                                contrastTextColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{
                                fontSize: '17px'
                            }}
                        >
                            desktop_windows
                        </span>
                    </div>

                    <span
                        style={{
                            color: '#FFFFFF',
                            fontSize: '12px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        Escritorio
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color:
                                'rgba(255,255,255,0.82)',
                            fontSize: '11px'
                        }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{
                                fontSize: '15px'
                            }}
                        >
                            {isLoading
                                ? 'sync'
                                : 'cloud_done'}
                        </span>

                        <span>
                            {isLoading
                                ? 'Cargando'
                                : 'Todo listo'}
                        </span>
                    </div>

                    <div
                        style={{
                            width: '1px',
                            height: '20px',
                            background:
                                'rgba(255,255,255,0.12)'
                        }}
                    />

                    <div
                        style={{
                            textAlign: 'right',
                            lineHeight: 1
                        }}
                    >
                        <div
                            style={{
                                color: '#FFFFFF',
                                fontSize: '12px',
                                fontWeight: 650
                            }}
                        >
                            {timeText}
                        </div>

                        <div
                            style={{
                                color:
                                    'rgba(255,255,255,0.62)',
                                fontSize: '9px',
                                marginTop: '3px'
                            }}
                        >
                            {dateText}
                        </div>
                    </div>

                    <span
                        className="material-symbols-outlined"
                        style={{
                            fontSize: '16px',
                            color:
                                'rgba(255,255,255,0.75)'
                        }}
                    >
                        schedule
                    </span>
                </div>
            </header>

            <main
                style={{
                    position: 'absolute',
                    top: `${WORKSPACE_TOP}px`,
                    left: 0,
                    right: 0,
                    bottom: `${WORKSPACE_BOTTOM}px`,
                    overflow: 'hidden',
                    minHeight: 0,
                    zIndex: 100
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '18px',
                        left: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        flexWrap: 'wrap',
                        alignContent: 'flex-start',
                        gap: '12px',
                        maxHeight:
                            'calc(100% - 24px)',
                        zIndex: 10
                    }}
                >
                    <div
                        onDoubleClick={openSettings}
                        style={desktopItemStyle}
                        title="Abrir Configuración"
                    >
                        <div
                            style={{
                                ...desktopIconBoxStyle,
                                backgroundColor:
                                    safePrimaryColor
                            }}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: '25px',
                                    color:
                                        contrastTextColor
                                }}
                            >
                                settings
                            </span>
                        </div>

                        <span
                            style={
                                desktopItemLabelStyle
                            }
                        >
                            Configuración
                        </span>
                    </div>

                    {availableGames.map(game => {
                        const visual =
                            getGameVisual(
                                game.id,
                                game.title,
                                game.folder
                            );

                        return (
                            <div
                                key={game.id}
                                onDoubleClick={() =>
                                    openGame(
                                        game.id,
                                        game.title,
                                        game.folder
                                    )
                                }
                                style={{
                                    ...desktopItemStyle,
                                    transition:
                                        'transform 140ms ease, filter 140ms ease'
                                }}
                                title={`Abrir ${game.title}`}
                            >
                                <div
                                    style={{
                                        ...desktopIconBoxStyle,
                                        backgroundColor:
                                            visual.color,
                                        color:
                                            visual.iconColor,
                                        boxShadow:
                                            `0 4px 12px ${visual.color}66`
                                    }}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            fontSize: '25px',
                                            color:
                                                visual.iconColor
                                        }}
                                    >
                                        {visual.icon}
                                    </span>
                                </div>

                                <span
                                    style={
                                        desktopItemLabelStyle
                                    }
                                >
                                    {game.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {windows.map(win => {
                    const isMinimized =
                        minimizedIds.includes(
                            win.id
                        );

                    return (
                        <Window
                            key={win.id}
                            id={win.id}
                            title={win.title}
                            gameFolder={win.folder}
                            gameIcon={win.gameIcon}
                            gameColor={win.gameColor}
                            isCustomApp={
                                win.isCustomApp
                            }
                            customHeader={
                                win.customHeader
                            }
                            zIndex={
                                activeId === win.id
                                    ? 999
                                    : 100
                            }
                            primaryColor={
                                safePrimaryColor
                            }
                            isMinimized={
                                isMinimized
                            }
                            onFocus={id =>
                                setActiveId(id)
                            }
                            onMinimize={
                                toggleMinimize
                            }
                            onClose={
                                closeWindow
                            }
                        >
                            {win.id ===
                                'settings-app' && (
                                <SettingsApp
                                    bgImage={bgImage}
                                    primaryColor={
                                        safePrimaryColor
                                    }
                                    onUpdateSettings={
                                        saveSettingsToBackend
                                    }
                                />
                            )}
                        </Window>
                    );
                })}
            </main>

            {isLauncherOpen && (
                <div
                    role="dialog"
                    aria-label="Menú de juegos"
                    onClick={event => event.stopPropagation()}
                    style={{
                        position: 'fixed',
                        left: '50%',
                        bottom: `${DOCK_HEIGHT - 2}px`,
                        transform: 'translateX(-50%)',
                        width: 'min(430px, calc(100vw - 24px))',
                        maxHeight: 'min(560px, calc(100vh - 92px))',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: '22px',
                        background: 'rgba(35,32,42,0.96)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.42)',
                        zIndex: 7000,
                        color: '#FFFFFF'
                    }}
                >
                    <div style={{ padding: '16px 16px 10px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                        }}>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>Juegos</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.58)', marginTop: '3px' }}>
                                    {availableGames.length} {availableGames.length === 1 ? 'juego disponible' : 'juegos disponibles'}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsLauncherOpen(false);
                                    setGameSearch('');
                                }}
                                style={{
                                    ...windowControlBtnStyleForLauncher,
                                    color: '#FFFFFF',
                                    backgroundColor: 'rgba(255,255,255,0.08)'
                                }}
                                title="Cerrar"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>close</span>
                            </button>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '9px 12px',
                            borderRadius: '14px',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '19px', opacity: 0.72 }}>search</span>
                            <input
                                id="zenova-game-launcher-search"
                                value={gameSearch}
                                onChange={event => setGameSearch(event.target.value)}
                                placeholder="Buscar juegos..."
                                autoFocus
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    color: '#FFFFFF',
                                    fontSize: '13px'
                                }}
                            />
                            {gameSearch && (
                                <button
                                    onClick={() => setGameSearch('')}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'rgba(255,255,255,0.65)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        padding: 0
                                    }}
                                    title="Limpiar búsqueda"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>cancel</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{
                        overflowY: 'auto',
                        padding: '4px 10px 12px',
                        minHeight: 0
                    }}>
                        {filteredGames.length > 0 ? (
                            filteredGames.map(game => {
                                const visual = getGameVisual(game.id, game.title, game.folder);
                                const isOpen = windows.some(win => win.id === game.id);
                                const isMinimized = minimizedIds.includes(game.id);

                                return (
                                    <button
                                        key={game.id}
                                        onClick={() => {
                                            openGame(game.id, game.title, game.folder);
                                            setIsLauncherOpen(false);
                                            setGameSearch('');
                                        }}
                                        style={{
                                            width: '100%',
                                            border: 'none',
                                            borderRadius: '15px',
                                            background: 'transparent',
                                            color: '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '11px',
                                            padding: '9px 10px',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                        title={`Abrir ${game.title}`}
                                    >
                                        <span style={{
                                            width: '40px',
                                            height: '40px',
                                            flexShrink: 0,
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: visual.color,
                                            color: visual.iconColor
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                                                {visual.icon}
                                            </span>
                                        </span>
                                        <span style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{
                                                display: 'block',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontSize: '13px',
                                                fontWeight: 600
                                            }}>
                                                {game.title}
                                            </span>
                                            <span style={{
                                                display: 'block',
                                                marginTop: '3px',
                                                fontSize: '10px',
                                                color: 'rgba(255,255,255,0.50)'
                                            }}>
                                                {isOpen ? (isMinimized ? 'Minimizado' : 'Abierto') : 'Disponible'}
                                            </span>
                                        </span>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', opacity: 0.45 }}>
                                            {isOpen && !isMinimized ? 'open_in_new' : 'play_arrow'}
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <div style={{
                                padding: '34px 20px 40px',
                                textAlign: 'center',
                                color: 'rgba(255,255,255,0.62)'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '34px', opacity: 0.55 }}>search_off</span>
                                <div style={{ marginTop: '8px', fontSize: '13px' }}>No se encontraron juegos</div>
                                <div style={{ marginTop: '4px', fontSize: '10px', opacity: 0.7 }}>Prueba con otro nombre</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <footer
                style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform:
                        'translateX(-50%)',
                    height:
                        `${DOCK_HEIGHT - 16}px`,
                    padding: '4px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '22px',
                    background:
                        'rgba(48,45,56,0.90)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter:
                        'blur(18px)',
                    border:
                        '1px solid rgba(255,255,255,0.08)',
                    boxShadow:
                        '0 8px 28px rgba(0,0,0,0.32)',
                    zIndex: 5000
                }}
            >
                <button
                    onClick={toggleLauncher}
                    aria-expanded={isLauncherOpen}
                    style={{
                        ...dockButtonStyle,
                        backgroundColor:
                            isLauncherOpen
                                ? safePrimaryColor
                                : 'rgba(255,255,255,0.08)',
                        color:
                            isLauncherOpen
                                ? contrastTextColor
                                : '#FFFFFF'
                    }}
                    title="Menú de juegos"
                >
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '19px' }}
                    >
                        {isLauncherOpen ? 'close' : 'apps'}
                    </span>
                </button>

                {windows.map(win => {
                    const isMinimized =
                        minimizedIds.includes(
                            win.id
                        );

                    const isActive =
                        activeId === win.id &&
                        !isMinimized;

                    return (
                        <button
                            key={win.id}
                            onClick={() =>
                                toggleMinimize(
                                    win.id
                                )
                            }
                            style={{
                                ...dockButtonStyle,
                                padding: '0 12px',
                                minWidth: '72px',
                                maxWidth: '150px',
                                gap: '6px',
                                backgroundColor:
                                    isActive
                                        ? safePrimaryColor
                                        : 'rgba(255,255,255,0.08)',
                                color:
                                    isActive
                                        ? contrastTextColor
                                        : '#FFFFFF'
                            }}
                            title={win.title}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: '15px',
                                    flexShrink: 0
                                }}
                            >
                                {win.id ===
                                    'settings-app'
                                    ? 'settings'
                                    : win.gameIcon ||
                                      'sports_esports'}
                            </span>

                            <span
                                style={{
                                    overflow: 'hidden',
                                    textOverflow:
                                        'ellipsis',
                                    whiteSpace:
                                        'nowrap',
                                    fontSize: '11px'
                                }}
                            >
                                {win.title}
                            </span>

                            {isActive && (
                                <span
                                    style={{
                                        position:
                                            'absolute',
                                        bottom: '2px',
                                        left: '50%',
                                        transform:
                                            'translateX(-50%)',
                                        width: '14px',
                                        height: '2px',
                                        borderRadius:
                                            '2px',
                                        backgroundColor:
                                            contrastTextColor
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </footer>
        </div>
    );
};

const desktopItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '12px',
    width: '76px',
    height: '78px',
    textAlign: 'center',
    userSelect: 'none'
};

const desktopIconBoxStyle: React.CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow:
        '0 4px 12px rgba(0,0,0,0.25)',
    transition:
        'transform 160ms ease, filter 160ms ease, box-shadow 160ms ease'
};

const desktopItemLabelStyle: React.CSSProperties = {
    color: '#FFFFFF',
    fontSize: '10px',
    textAlign: 'center',
    marginTop: '5px',
    textShadow:
        '0 1px 4px rgba(0,0,0,0.9)',
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    lineHeight: '1.2'
};

const windowControlBtnStyleForLauncher: React.CSSProperties = {
    width: '28px',
    height: '28px',
    padding: 0,
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0
};

const dockButtonStyle: React.CSSProperties = {
    position: 'relative',
    height: '36px',
    minWidth: '36px',
    padding: '0 9px',
    border: 'none',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#FFFFFF',
    fontSize: '11px',
    flexShrink: 0,
    transition:
        'background-color 160ms ease, transform 160ms ease'
};