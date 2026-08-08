import React, {
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';

import { getContrastTextColor } from '../../../core/utils/colorUtils';

interface WindowProps {
    id: string;
    title: string;
    gameFolder?: string;
    isCustomApp?: boolean;
    customHeader?: React.ReactNode;
    zIndex: number;
    primaryColor: string;
    isMinimized: boolean;
    onFocus: (id: string) => void;
    onMinimize: (id: string) => void;
    onClose: (id: string) => void;
    children?: React.ReactNode;
}

interface WindowSize {
    width: number;
    height: number;
}

interface WindowPosition {
    x: number;
    y: number;
}

const MAXIMIZE_MARGIN = 16;

const DEFAULT_POSITION: WindowPosition = {
    x: 120,
    y: 90
};

const DEFAULT_SIZE: WindowSize = {
    width: 780,
    height: 500
};

const MIN_WIDTH = 320;
const MIN_HEIGHT = 220;

const TITLE_HEIGHT = 46;

const WINDOW_EASE =
    'cubic-bezier(0.16, 1, 0.3, 1)';

export const Window: React.FC<WindowProps> = ({
    id,
    title,
    gameFolder,
    isCustomApp = false,
    customHeader,
    zIndex,
    primaryColor,
    isMinimized,
    onFocus,
    onMinimize,
    onClose,
    children
}) => {
    // =========================================================
    // ESTADO
    // =========================================================

    const [position, setPosition] =
        useState<WindowPosition>(
            DEFAULT_POSITION
        );

    const [size, setSize] =
        useState<WindowSize>(
            DEFAULT_SIZE
        );

    const [isMaximized, setIsMaximized] =
        useState(false);

    const [normalState, setNormalState] =
        useState({
            ...DEFAULT_POSITION,
            ...DEFAULT_SIZE
        });

    const [isDragging, setIsDragging] =
        useState(false);

    const [isResizing, setIsResizing] =
        useState(false);

    const [isOpening, setIsOpening] =
        useState(true);

    const [isClosing, setIsClosing] =
        useState(false);

    // =========================================================
    // REFS
    // =========================================================

    const windowRef =
        useRef<HTMLDivElement>(null);

    const contentRef =
        useRef<HTMLDivElement>(null);

    const iframeRef =
        useRef<HTMLIFrameElement>(null);

    const animationFrameRef =
        useRef<number | null>(null);

    const pointerRef = useRef({
        x: 0,
        y: 0
    });

    const dragStartRef = useRef({
        x: 0,
        y: 0
    });

    const resizeStartRef = useRef({
        x: 0,
        y: 0,
        width: DEFAULT_SIZE.width,
        height: DEFAULT_SIZE.height
    });

    const positionRef =
        useRef(position);

    const sizeRef =
        useRef(size);

    const timeSpentRef =
        useRef(0);

    // =========================================================
    // SINCRONIZAR REFS
    // =========================================================

    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    useEffect(() => {
        sizeRef.current = size;
    }, [size]);

    // =========================================================
    // COLOR DEL TITLEBAR
    // =========================================================

    const contrastTextColor =
        getContrastTextColor(
            primaryColor
        );

    const controlButtonBackground =
        contrastTextColor === '#FFFFFF'
            ? 'rgba(255,255,255,0.16)'
            : 'rgba(0,0,0,0.08)';

    // =========================================================
    // PROTOCOLO DE RESIZE PARA JUEGOS
    // =========================================================
    //
    // El Window informa al juego del tamaño real de su viewport.
    //
    // Esto permite posteriormente crear un SDK como:
    //
    // window.WebOS.onResize(...)
    //
    // o:
    //
    // manifest.features = ["resize"]
    //
    // =========================================================

    const sendGameResize = useCallback(() => {
        const iframe =
            iframeRef.current;

        const content =
            contentRef.current;

        if (!iframe || !content) {
            return;
        }

        const rect =
            content.getBoundingClientRect();

        const width =
            Math.max(
                1,
                Math.round(rect.width)
            );

        const height =
            Math.max(
                1,
                Math.round(rect.height)
            );

        const message = {
            type: 'webos:resize',
            version: 1,
            windowId: id,
            width,
            height,
            devicePixelRatio:
                window.devicePixelRatio || 1
        };

        try {
            iframe.contentWindow?.postMessage(
                message,
                '*'
            );
        } catch {
            // El juego puede haberse cerrado
            // mientras se enviaba el mensaje.
        }
    }, [id]);

    // =========================================================
    // OBSERVAR CAMBIOS REALES DEL CONTENIDO
    // =========================================================

    useEffect(() => {
        const content =
            contentRef.current;

        if (!content) {
            return;
        }

        if (
            typeof ResizeObserver ===
            'undefined'
        ) {
            return;
        }

        let frame: number | null = null;

        const observer =
            new ResizeObserver(() => {
                if (frame !== null) {
                    return;
                }

                frame =
                    requestAnimationFrame(() => {
                        frame = null;
                        sendGameResize();
                    });
            });

        observer.observe(content);

        return () => {
            observer.disconnect();

            if (frame !== null) {
                cancelAnimationFrame(frame);
            }
        };
    }, [
        sendGameResize
    ]);

    // =========================================================
    // RESIZE DEL VIEWPORT DEL NAVEGADOR
    // =========================================================

    useEffect(() => {
        const handleViewportResize =
            () => {
                requestAnimationFrame(() => {
                    sendGameResize();
                });
            };

        window.addEventListener(
            'resize',
            handleViewportResize
        );

        return () => {
            window.removeEventListener(
                'resize',
                handleViewportResize
            );
        };
    }, [
        sendGameResize
    ]);

    // =========================================================
    // APERTURA
    // =========================================================

    useEffect(() => {
        const frame =
            requestAnimationFrame(() => {
                setIsOpening(false);
            });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, []);

    // =========================================================
    // TIEMPO DE JUEGO
    // =========================================================

    useEffect(() => {
        if (
            !gameFolder ||
            isCustomApp ||
            isMinimized
        ) {
            return;
        }

        const interval =
            window.setInterval(() => {
                timeSpentRef.current += 1;
            }, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, [
        gameFolder,
        isCustomApp,
        isMinimized
    ]);

    // =========================================================
    // GUARDAR TIEMPO
    // =========================================================

    useEffect(() => {
        return () => {
            const seconds =
                timeSpentRef.current;

            if (
                seconds <= 0 ||
                !gameFolder ||
                isCustomApp
            ) {
                return;
            }

            fetch('/api/save-time', {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/json'
                },
                body: JSON.stringify({
                    gameFolder,
                    timeSeconds: seconds
                }),
                keepalive: true
            }).catch(() => {
                // No interrumpir el cierre.
            });
        };
    }, [
        gameFolder,
        isCustomApp
    ]);

    // =========================================================
    // CALCULAR LÍMITES DE POSICIÓN
    // =========================================================

    const getPositionLimits =
        useCallback(() => {
            const width =
                sizeRef.current.width;

            const height =
                sizeRef.current.height;

            const maxX =
                Math.max(
                    0,
                    window.innerWidth -
                        width
                );

            const maxY =
                Math.max(
                    0,
                    window.innerHeight -
                        height
                );

            return {
                maxX,
                maxY
            };
        }, []);

    // =========================================================
    // DRAG
    // =========================================================

    const updateDragPosition =
        useCallback(() => {
            animationFrameRef.current =
                null;

            if (
                !isDragging ||
                isMaximized
            ) {
                return;
            }

            const nextX =
                pointerRef.current.x -
                dragStartRef.current.x;

            const nextY =
                pointerRef.current.y -
                dragStartRef.current.y;

            const {
                maxX,
                maxY
            } = getPositionLimits();

            setPosition({
                x: Math.min(
                    Math.max(
                        0,
                        nextX
                    ),
                    maxX
                ),
                y: Math.min(
                    Math.max(
                        0,
                        nextY
                    ),
                    maxY
                )
            });
        }, [
            isDragging,
            isMaximized,
            getPositionLimits
        ]);

    // =========================================================
    // POINTER DOWN - DRAG
    // =========================================================

    const handlePointerDownHeader =
        (
            e: React.PointerEvent
        ) => {
            if (
                isMaximized ||
                isClosing
            ) {
                return;
            }

            e.preventDefault();

            pointerRef.current = {
                x: e.clientX,
                y: e.clientY
            };

            dragStartRef.current = {
                x:
                    e.clientX -
                    positionRef.current.x,

                y:
                    e.clientY -
                    positionRef.current.y
            };

            setIsDragging(true);

            onFocus(id);

            try {
                windowRef.current?.setPointerCapture(
                    e.pointerId
                );
            } catch {
                // Ignorar.
            }
        };

    // =========================================================
    // POINTER DOWN - RESIZE
    // =========================================================

    const handlePointerDownResize =
        (
            e: React.PointerEvent
        ) => {
            e.preventDefault();
            e.stopPropagation();

            if (
                isMaximized ||
                isClosing
            ) {
                return;
            }

            resizeStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                width:
                    sizeRef.current.width,
                height:
                    sizeRef.current.height
            };

            setIsResizing(true);

            onFocus(id);

            try {
                windowRef.current?.setPointerCapture(
                    e.pointerId
                );
            } catch {
                // Ignorar.
            }
        };

    // =========================================================
    // POINTER MOVE
    // =========================================================

    const handlePointerMove =
        (
            e: React.PointerEvent
        ) => {
            if (
                !isDragging &&
                !isResizing
            ) {
                return;
            }

            pointerRef.current = {
                x: e.clientX,
                y: e.clientY
            };

            // -------------------------------------------------
            // DRAG
            // -------------------------------------------------

            if (isDragging) {
                if (
                    animationFrameRef.current ===
                    null
                ) {
                    animationFrameRef.current =
                        requestAnimationFrame(
                            updateDragPosition
                        );
                }

                return;
            }

            // -------------------------------------------------
            // RESIZE
            // -------------------------------------------------

            if (isResizing) {
                const start =
                    resizeStartRef.current;

                const deltaX =
                    e.clientX -
                    start.x;

                const deltaY =
                    e.clientY -
                    start.y;

                const maxWidth =
                    Math.max(
                        MIN_WIDTH,
                        window.innerWidth -
                            positionRef.current.x
                    );

                const maxHeight =
                    Math.max(
                        MIN_HEIGHT,
                        window.innerHeight -
                            positionRef.current.y
                    );

                const nextWidth =
                    Math.min(
                        Math.max(
                            MIN_WIDTH,
                            start.width +
                                deltaX
                        ),
                        maxWidth
                    );

                const nextHeight =
                    Math.min(
                        Math.max(
                            MIN_HEIGHT,
                            start.height +
                                deltaY
                        ),
                        maxHeight
                    );

                setSize({
                    width: nextWidth,
                    height: nextHeight
                });

                return;
            }
        };

    // =========================================================
    // POINTER UP
    // =========================================================

    const handlePointerUp =
        (
            e: React.PointerEvent
        ) => {
            if (
                !isDragging &&
                !isResizing
            ) {
                return;
            }

            setIsDragging(false);
            setIsResizing(false);

            if (
                animationFrameRef.current !==
                null
            ) {
                cancelAnimationFrame(
                    animationFrameRef.current
                );

                animationFrameRef.current =
                    null;
            }

            try {
                if (
                    windowRef.current?.hasPointerCapture(
                        e.pointerId
                    )
                ) {
                    windowRef.current.releasePointerCapture(
                        e.pointerId
                    );
                }
            } catch {
                // Ignorar.
            }

            requestAnimationFrame(() => {
                sendGameResize();
            });
        };

    // =========================================================
    // MAXIMIZAR / RESTAURAR
    // =========================================================

    const toggleMaximize =
        () => {
            onFocus(id);

            if (isMaximized) {
                setPosition({
                    x: normalState.x,
                    y: normalState.y
                });

                setSize({
                    width:
                        normalState.width,
                    height:
                        normalState.height
                });

                setIsMaximized(false);

                requestAnimationFrame(() => {
                    sendGameResize();
                });

                return;
            }

            setNormalState({
                x: positionRef.current.x,
                y: positionRef.current.y,
                width: sizeRef.current.width,
                height: sizeRef.current.height
            });

            const maxWidth =
                Math.max(
                    MIN_WIDTH,
                    window.innerWidth -
                        MAXIMIZE_MARGIN * 2
                );

            const maxHeight =
                Math.max(
                    MIN_HEIGHT,
                    window.innerHeight -
                        MAXIMIZE_MARGIN * 2
                );

            setPosition({
                x: MAXIMIZE_MARGIN,
                y: MAXIMIZE_MARGIN
            });

            setSize({
                width: maxWidth,
                height: maxHeight
            });

            setIsMaximized(true);

            requestAnimationFrame(() => {
                sendGameResize();
            });
        };

    // =========================================================
    // AJUSTAR VENTANA MAXIMIZADA
    // =========================================================

    useEffect(() => {
        if (!isMaximized) {
            return;
        }

        const handleResize =
            () => {
                const width =
                    Math.max(
                        MIN_WIDTH,
                        window.innerWidth -
                            MAXIMIZE_MARGIN *
                                2
                    );

                const height =
                    Math.max(
                        MIN_HEIGHT,
                        window.innerHeight -
                            MAXIMIZE_MARGIN *
                                2
                    );

                setPosition({
                    x: MAXIMIZE_MARGIN,
                    y: MAXIMIZE_MARGIN
                });

                setSize({
                    width,
                    height
                });

                requestAnimationFrame(() => {
                    sendGameResize();
                });
            };

        window.addEventListener(
            'resize',
            handleResize
        );

        return () => {
            window.removeEventListener(
                'resize',
                handleResize
            );
        };
    }, [
        isMaximized,
        sendGameResize
    ]);

    // =========================================================
    // CERRAR
    // =========================================================

    const handleCloseClick =
        () => {
            if (isClosing) {
                return;
            }

            setIsClosing(true);

            window.setTimeout(() => {
                onClose(id);
            }, 220);
        };

    // =========================================================
    // ESCAPE
    // =========================================================

    useEffect(() => {
        if (!isCustomApp) {
            return;
        }

        const handleKeyDown =
            (
                event: KeyboardEvent
            ) => {
                if (
                    event.key ===
                        'Escape' &&
                    !isClosing
                ) {
                    handleCloseClick();
                }
            };

        window.addEventListener(
            'keydown',
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown
            );
        };
    }, [
        isCustomApp,
        isClosing
    ]);

    // =========================================================
    // TRANSFORMACIONES
    // =========================================================

    const getTransform =
        () => {
            if (isClosing) {
                return 'translate3d(0, 22px, 0) scale(0.94)';
            }

            if (isMinimized) {
                return 'translate3d(0, 90px, 0) scale(0.88)';
            }

            if (isOpening) {
                return 'translate3d(0, 12px, 0) scale(0.96)';
            }

            return 'translate3d(0, 0, 0) scale(1)';
        };

    const getOpacity =
        () => {
            if (
                isClosing ||
                isMinimized
            ) {
                return 0;
            }

            return 1;
        };

    // =========================================================
    // CONTENIDO
    // =========================================================

    const renderChildren =
        () => {
            if (isCustomApp) {
                return React.Children.map(
                    children,
                    child => {
                        if (
                            React.isValidElement(
                                child
                            )
                        ) {
                            return React.cloneElement(
                                child,
                                {
                                    isMinimized
                                } as any
                            );
                        }

                        return child;
                    }
                );
            }

            if (!gameFolder) {
                return (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems:
                                'center',
                            justifyContent:
                                'center',
                            background:
                                '#111',
                            color:
                                '#fff',
                            fontSize:
                                '14px'
                        }}
                    >
                        No se encontró el
                        juego.
                    </div>
                );
            }

            return (
                <iframe
                    ref={iframeRef}
                    src={gameFolder}
                    title={title}
                    loading="eager"
                    allow="autoplay; fullscreen; gamepad"
                    allowFullScreen
                    onLoad={() => {
                        requestAnimationFrame(
                            () => {
                                sendGameResize();
                            }
                        );
                    }}
                    style={{
                        position:
                            'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        minWidth: 0,
                        minHeight: 0,
                        display: 'block',
                        border: 'none',
                        background:
                            '#000'
                    }}
                />
            );
        };

    // =========================================================
    // BOTONES
    // =========================================================

    const windowControlBtnStyle:
        React.CSSProperties = {
        width: '28px',
        height: '28px',
        padding: 0,
        borderRadius: '50%',
        border: 'none',
        backgroundColor:
            controlButtonBackground,
        color:
            contrastTextColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition:
            'transform 140ms ease, background-color 140ms ease',
        flexShrink: 0
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div
            ref={windowRef}
            onPointerMove={
                handlePointerMove
            }
            onPointerUp={
                handlePointerUp
            }
            onPointerCancel={
                handlePointerUp
            }
            onClick={() =>
                onFocus(id)
            }
            style={{
                position: 'absolute',

                left:
                    `${position.x}px`,

                top:
                    `${position.y}px`,

                width:
                    `${size.width}px`,

                height:
                    `${size.height}px`,

                display: 'flex',
                flexDirection:
                    'column',

                overflow: 'hidden',

                backgroundColor:
                    '#fff',

                borderRadius:
                    isMaximized
                        ? '12px'
                        : '18px',

                border:
                    isCustomApp
                        ? `2px solid ${primaryColor}`
                        : `1px solid rgba(0,0,0,0.14)`,

                boxShadow:
                    isDragging
                        ? '0 28px 70px rgba(0,0,0,0.38)'
                        : '0 18px 50px rgba(0,0,0,0.28), 0 4px 14px rgba(0,0,0,0.14)',

                zIndex,

                transform:
                    getTransform(),

                opacity:
                    getOpacity(),

                pointerEvents:
                    isClosing ||
                    isMinimized
                        ? 'none'
                        : 'auto',

                transition:
                    isDragging ||
                    isResizing
                        ? 'box-shadow 160ms ease'
                        : [
                              `transform 220ms ${WINDOW_EASE}`,
                              `opacity 180ms ease`,
                              `width 180ms ${WINDOW_EASE}`,
                              `height 180ms ${WINDOW_EASE}`,
                              `left 180ms ${WINDOW_EASE}`,
                              `top 180ms ${WINDOW_EASE}`,
                              'border-radius 220ms ease',
                              'box-shadow 180ms ease'
                          ].join(','),

                touchAction:
                    'none',

                willChange:
                    isDragging ||
                    isResizing ||
                    isOpening ||
                    isClosing
                        ? 'transform, opacity, width, height'
                        : 'auto'
            }}
        >
            {/* =================================================
                TITLEBAR
            ================================================= */}

            {customHeader ? (
                <div
                    onPointerDown={
                        handlePointerDownHeader
                    }
                    style={{
                        height:
                            '52px',
                        minHeight:
                            '52px',
                        backgroundColor:
                            primaryColor,
                        color:
                            contrastTextColor,
                        display: 'flex',
                        alignItems:
                            'center',
                        justifyContent:
                            'space-between',
                        padding:
                            '0 12px 0 16px',
                        cursor:
                            isMaximized
                                ? 'default'
                                : isDragging
                                    ? 'grabbing'
                                    : 'grab',
                        userSelect:
                            'none',
                        zIndex: 10,
                        boxShadow:
                            '0 1px 0 rgba(0,0,0,0.12)',
                        position:
                            'relative',
                        flexShrink: 0
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            alignItems:
                                'center',
                            overflow:
                                'hidden'
                        }}
                    >
                        {customHeader}
                    </div>

                    <div
                        style={{
                            display:
                                'flex',
                            gap: '6px',
                            marginLeft:
                                '12px',
                            flexShrink:
                                0
                        }}
                        onPointerDown={e =>
                            e.stopPropagation()
                        }
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >
                        <button
                            onClick={() =>
                                onMinimize(id)
                            }
                            style={
                                windowControlBtnStyle
                            }
                            title="Minimizar"
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize:
                                        '15px'
                                }}
                            >
                                remove
                            </span>
                        </button>

                        <button
                            onClick={
                                toggleMaximize
                            }
                            style={
                                windowControlBtnStyle
                            }
                            title={
                                isMaximized
                                    ? 'Restaurar'
                                    : 'Maximizar'
                            }
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize:
                                        '15px'
                                }}
                            >
                                {isMaximized
                                    ? 'filter_none'
                                    : 'crop_square'}
                            </span>
                        </button>

                        <button
                            onClick={
                                handleCloseClick
                            }
                            style={
                                windowControlBtnStyle
                            }
                            title="Cerrar"
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize:
                                        '15px'
                                }}
                            >
                                close
                            </span>
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onPointerDown={
                        handlePointerDownHeader
                    }
                    style={{
                        height:
                            `${TITLE_HEIGHT}px`,
                        minHeight:
                            `${TITLE_HEIGHT}px`,
                        backgroundColor:
                            primaryColor,
                        color:
                            '#FFFFFF',
                        display: 'flex',
                        alignItems:
                            'center',
                        justifyContent:
                            'space-between',
                        padding:
                            '0 10px 0 14px',
                        cursor:
                            isMaximized
                                ? 'default'
                                : isDragging
                                    ? 'grabbing'
                                    : 'grab',
                        userSelect:
                            'none',
                        borderBottom:
                            '1px solid rgba(0,0,0,0.12)',
                        boxShadow:
                            '0 2px 8px rgba(0,0,0,0.12)',
                        zIndex: 10,
                        position:
                            'relative',
                        transition:
                            'background-color 180ms ease, box-shadow 180ms ease',
                        flexShrink: 0
                    }}
                >
                    {/* Caption */}
                    <div
                        style={{
                            display:
                                'flex',
                            alignItems:
                                'center',
                            gap: '9px',
                            minWidth: 0,
                            flex: 1
                        }}
                    >
                        <div
                            style={{
                                width:
                                    '28px',
                                height:
                                    '28px',
                                borderRadius:
                                    '9px',
                                backgroundColor:
                                    'rgba(255,255,255,0.18)',
                                display:
                                    'flex',
                                alignItems:
                                    'center',
                                justifyContent:
                                    'center',
                                flexShrink:
                                    0,
                                boxShadow:
                                    '0 2px 7px rgba(0,0,0,0.16)'
                            }}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize:
                                        '17px',
                                    color:
                                        '#FFFFFF'
                                }}
                            >
                                sports_esports
                            </span>
                        </div>

                        <span
                            style={{
                                color:
                                    '#FFFFFF',
                                fontWeight:
                                    650,
                                fontSize:
                                    '13px',
                                letterSpacing:
                                    '0.1px',
                                whiteSpace:
                                    'nowrap',
                                overflow:
                                    'hidden',
                                textOverflow:
                                    'ellipsis',
                                textShadow:
                                    '0 1px 3px rgba(0,0,0,0.35)',
                                paddingRight:
                                    '8px'
                            }}
                        >
                            {title}
                        </span>
                    </div>

                    {/* Controles */}
                    <div
                        style={{
                            display:
                                'flex',
                            gap: '6px',
                            flexShrink:
                                0
                        }}
                        onPointerDown={e =>
                            e.stopPropagation()
                        }
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >
                        <button
                            onClick={() =>
                                onMinimize(id)
                            }
                            style={{
                                ...windowControlBtnStyle,
                                backgroundColor:
                                    'rgba(255,255,255,0.16)',
                                color:
                                    '#FFFFFF'
                            }}
                            title="Minimizar"
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize:
                                        '15px'
                                }}
                            >
                                remove
                            </span>
                        </button>

                        <button
                            onClick={
                                toggleMaximize
                            }
                            style={{
                                ...windowControlBtnStyle,
                                backgroundColor:
                                    'rgba(255,255,255,0.16)',
                                color:
                                    '#FFFFFF'
                            }}
                            title={
                                isMaximized
                                    ? 'Restaurar'
                                    : 'Maximizar'
                            }
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize:
                                        '15px'
                                }}
                            >
                                {isMaximized
                                    ? 'filter_none'
                                    : 'crop_square'}
                            </span>
                        </button>

                        <button
                            onClick={
                                handleCloseClick
                            }
                            style={{
                                ...windowControlBtnStyle,
                                backgroundColor:
                                    'rgba(255,255,255,0.16)',
                                color:
                                    '#FFFFFF'
                            }}
                            title="Cerrar"
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize:
                                        '15px'
                                }}
                            >
                                close
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* =================================================
                CONTENIDO
            ================================================= */}

            <div
                ref={contentRef}
                style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    minHeight: 0,
                    position:
                        'relative',
                    overflow:
                        'hidden',
                    backgroundColor:
                        '#000'
                }}
            >
                {renderChildren()}
            </div>

            {/* =================================================
                RESIZE HANDLE
            ================================================= */}

            {!isMaximized && (
                <div
                    onPointerDown={
                        handlePointerDownResize
                    }
                    style={{
                        position:
                            'absolute',
                        right: 0,
                        bottom: 0,
                        width:
                            '22px',
                        height:
                            '22px',
                        cursor:
                            'nwse-resize',
                        display:
                            'flex',
                        alignItems:
                            'flex-end',
                        justifyContent:
                            'flex-end',
                        padding:
                            '4px',
                        zIndex: 20
                    }}
                    title="Redimensionar"
                >
                    <div
                        style={{
                            width:
                                '9px',
                            height:
                                '9px',
                            borderRight:
                                `2px solid ${primaryColor}`,
                            borderBottom:
                                `2px solid ${primaryColor}`,
                            opacity:
                                0.8
                        }}
                    />
                </div>
            )}
        </div>
    );
};