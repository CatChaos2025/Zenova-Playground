import React, {
    useEffect,
    useState
} from 'react';

interface SettingsAppProps {
    bgImage: string;
    primaryColor: string;
    onUpdateSettings: (
        bg: string,
        color: string
    ) => void;
    isMinimized?: boolean;
}

// ============================================================
// COLOR
// ============================================================

const isDarkColor = (
    hex: string
): boolean => {
    if (!hex) {
        return false;
    }

    let cleanHex =
        hex.replace(
            '#',
            ''
        ).trim();

    if (
        cleanHex.length ===
        3
    ) {
        cleanHex =
            cleanHex
                .split('')
                .map(
                    char =>
                        char + char
                )
                .join('');
    }

    if (
        cleanHex.length !==
        6
    ) {
        return false;
    }

    const num =
        parseInt(
            cleanHex,
            16
        );

    if (
        Number.isNaN(num)
    ) {
        return false;
    }

    const r =
        (num >> 16) & 255;

    const g =
        (num >> 8) & 255;

    const b =
        num & 255;

    const brightness =
        (r * 299 +
            g * 587 +
            b * 114) /
        1000;

    return brightness < 128;
};

const getReadableTextColor = (
    color: string
): string => {
    return isDarkColor(
        color
    )
        ? '#FFFFFF'
        : '#381E72';
};

// ============================================================
// COMPONENTE
// ============================================================

export const SettingsApp: React.FC<
    SettingsAppProps
> = ({
    bgImage,
    primaryColor,
    onUpdateSettings,
}) => {
    const [
        currentTab,
        setCurrentTab
    ] = useState<
        'general' |
        'appearance' |
        'about'
    >('appearance');

    const [
        tempColor,
        setTempColor
    ] = useState(
        primaryColor
    );

    const [
        tempBg,
        setTempBg
    ] = useState(
        bgImage
    );

    const [
        isUploading,
        setIsUploading
    ] = useState(false);

    // ========================================================
    // SINCRONIZAR
    // ========================================================

    useEffect(() => {
        setTempColor(
            primaryColor
        );
    }, [
        primaryColor
    ]);

    useEffect(() => {
        setTempBg(
            bgImage
        );
    }, [
        bgImage
    ]);

    // ========================================================
    // COLOR
    // ========================================================

    const colorPresets = [
        '#D0BCFF',
        '#FFB4AB',
        '#90CAF9',
        '#A5D6A7',
        '#FFE082',
        '#F48FB1',
        '#CE93D8',
        '#1C1B1F',
        '#212121'
    ];

    const dynamicTextColor =
        getReadableTextColor(
            tempColor
        );

    const handleColorChange = (
        color: string
    ) => {
        setTempColor(
            color
        );

        onUpdateSettings(
            tempBg,
            color
        );
    };

    // ========================================================
    // PROCESAR IMAGEN
    // ========================================================

    const processImage = (
        file: File
    ) => {
        if (
            !file.type.startsWith(
                'image/'
            )
        ) {
            return;
        }

        const MAX_SIZE =
            8 * 1024 * 1024;

        if (
            file.size >
            MAX_SIZE
        ) {
            alert(
                'La imagen debe pesar menos de 8 MB.'
            );

            return;
        }

        setIsUploading(
            true
        );

        const reader =
            new FileReader();

        reader.onload =
            event => {
                const result =
                    event.target
                        ?.result;

                if (
                    typeof result !==
                    'string'
                ) {
                    setIsUploading(
                        false
                    );

                    return;
                }

                // Preview inmediato
                setTempBg(
                    result
                );

                // Enviar al Desktop
                // y posteriormente al servidor.
                onUpdateSettings(
                    result,
                    tempColor
                );

                setIsUploading(
                    false
                );
            };

        reader.onerror =
            () => {
                console.error(
                    'No se pudo leer la imagen.'
                );

                setIsUploading(
                    false
                );
            };

        reader.readAsDataURL(
            file
        );
    };

    // ========================================================
    // INPUT
    // ========================================================

    const handleBgChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            e.target.files?.[0];

        if (file) {
            processImage(
                file
            );
        }

        e.target.value =
            '';
    };

    // ========================================================
    // QUITAR FONDO
    // ========================================================

    const handleRemoveBg =
        () => {
            setTempBg('');

            onUpdateSettings(
                '',
                tempColor
            );
        };

    // ========================================================
    // DRAG & DROP
    // ========================================================

    const handleDragOver = (
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        e.stopPropagation();

        const file =
            e.dataTransfer
                .files?.[0];

        if (file) {
            processImage(
                file
            );
        }
    };

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div
            style={{
                display:
                    'flex',
                height:
                    '100%',
                width:
                    '100%',
                backgroundColor:
                    '#FDF8F8',
                color:
                    '#1D1B20',
                fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                overflow:
                    'hidden'
            }}
        >
            {/* =================================================
                SIDEBAR
            ================================================= */}

            <div
                style={{
                    width:
                        '220px',
                    minWidth:
                        '220px',
                    backgroundColor:
                        '#F3EDF7',
                    padding:
                        '16px',
                    display:
                        'flex',
                    flexDirection:
                        'column',
                    gap:
                        '8px',
                    borderRight:
                        '1px solid #E7E0EC',
                    boxSizing:
                        'border-box'
                }}
            >
                <div
                    style={{
                        fontSize:
                            '12px',
                        fontWeight:
                            700,
                        color:
                            tempColor,
                        marginBottom:
                            '8px',
                        paddingLeft:
                            '12px',
                        letterSpacing:
                            '0.5px'
                    }}
                >
                    SISTEMA
                </div>

                <button
                    className='btnSettings'
                    onClick={() =>
                        setCurrentTab(
                            'general'
                        )
                    }
                    style={sidebarItemStyle(
                        currentTab ===
                            'general',
                        tempColor,
                        dynamicTextColor
                    )}
                >
                    <span
                        className="material-symbols-outlined"
                        style={{
                            fontSize:
                                '18px'
                        }}
                    >
                        tune
                    </span>

                    General
                </button>

                <button
                    className='btnSettings'
                    onClick={() =>
                        setCurrentTab(
                            'appearance'
                        )
                    }
                    style={sidebarItemStyle(
                        currentTab ===
                            'appearance',
                        tempColor,
                        dynamicTextColor
                    )}
                >
                    <span
                        className="material-symbols-outlined"
                        style={{
                            fontSize:
                                '18px'
                        }}
                    >
                        palette
                    </span>

                    Apariencia
                </button>

                <button
                    className='btnSettings'
                    onClick={() =>
                        setCurrentTab(
                            'about'
                        )
                    }
                    style={sidebarItemStyle(
                        currentTab ===
                            'about',
                        tempColor,
                        dynamicTextColor
                    )}
                >
                    <span
                        className="material-symbols-outlined"
                        style={{
                            fontSize:
                                '18px'
                        }}
                    >
                        info
                    </span>

                    Acerca de
                </button>
            </div>

            {/* =================================================
                CONTENIDO
            ================================================= */}

            <div
                style={{
                    flex:
                        1,
                    minWidth:
                        0,
                    padding:
                        '24px',
                    overflowY:
                        'auto',
                    boxSizing:
                        'border-box'
                }}
            >
                {/* =================================================
                    GENERAL
                ================================================= */}

                {currentTab ===
                    'general' && (
                    <div>
                        <h2
                            style={{
                                fontSize:
                                    '22px',
                                fontWeight:
                                    600,
                                margin:
                                    '0 0 16px',
                                color:
                                    '#1D1B20'
                            }}
                        >
                            Configuración General
                        </h2>

                        <div
                            style={
                                cardStyle
                            }
                        >
                            <div
                                style={{
                                    fontWeight:
                                        500
                                }}
                            >
                                Rendimiento de aplicaciones
                            </div>

                            <div
                                style={{
                                    fontSize:
                                        '14px',
                                    color:
                                        '#49454F',
                                    marginTop:
                                        '4px',
                                    lineHeight:
                                        1.5
                                }}
                            >
                                Optimizar recursos
                                al minimizar
                                ventanas e
                                iframes en
                                segundo plano.
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                    APARIENCIA
                ================================================= */}

                {currentTab ===
                    'appearance' && (
                    <div>
                        <h2
                            style={{
                                fontSize:
                                    '22px',
                                fontWeight:
                                    600,
                                margin:
                                    '0 0 16px',
                                color:
                                    '#1D1B20'
                            }}
                        >
                            Apariencia y Tema
                        </h2>

                        {/* COLOR */}

                        <div
                            style={
                                cardStyle
                            }
                        >
                            <div
                                style={{
                                    fontWeight:
                                        500,
                                    marginBottom:
                                        '8px'
                                }}
                            >
                                Color del Sistema y Ventanas
                            </div>

                            <div
                                style={{
                                    fontSize:
                                        '13px',
                                    color:
                                        '#49454F',
                                    marginBottom:
                                        '14px',
                                    lineHeight:
                                        1.5
                                }}
                            >
                                Este color solamente
                                afecta a esta
                                instalación. Los
                                demás usuarios
                                pueden tener su
                                propio color.
                            </div>

                            <div
                                style={{
                                    display:
                                        'flex',
                                    gap:
                                        '10px',
                                    alignItems:
                                        'center',
                                    flexWrap:
                                        'wrap'
                                }}
                            >
                                {colorPresets.map(
                                    color => (
                                        <button
                                            key={
                                                color
                                            }
                                            onClick={() =>
                                                handleColorChange(
                                                    color
                                                )
                                            }
                                            style={{
                                                width:
                                                    '34px',
                                                height:
                                                    '34px',
                                                padding:
                                                    0,
                                                borderRadius:
                                                    '50%',
                                                backgroundColor:
                                                    color,
                                                border:
                                                    tempColor.toUpperCase() ===
                                                    color.toUpperCase()
                                                        ? '3px solid #1D1B20'
                                                        : '2px solid transparent',
                                                boxShadow:
                                                    '0 1px 4px rgba(0,0,0,0.15)',
                                                cursor:
                                                    'pointer'
                                            }}
                                            title={
                                                color
                                            }
                                        />
                                    )
                                )}

                                <div
                                    style={{
                                        display:
                                            'flex',
                                        alignItems:
                                            'center',
                                        gap:
                                            '7px',
                                        marginLeft:
                                            '8px'
                                    }}
                                >
                                    <input
                                        type="color"
                                        value={
                                            tempColor
                                        }
                                        onChange={e =>
                                            handleColorChange(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        style={{
                                            width:
                                                '34px',
                                            height:
                                                '34px',
                                            padding:
                                                0,
                                            border:
                                                'none',
                                            cursor:
                                                'pointer'
                                        }}
                                        title="Color personalizado"
                                    />

                                    <span
                                        style={{
                                            fontSize:
                                                '13px',
                                            color:
                                                '#49454F'
                                        }}
                                    >
                                        Personalizado
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FONDO */}

                        <div
                            style={
                                cardStyle
                            }
                        >
                            <div
                                style={{
                                    fontWeight:
                                        500,
                                    marginBottom:
                                        '8px'
                                }}
                            >
                                Fondo de Escritorio
                            </div>

                            <div
                                style={{
                                    fontSize:
                                        '13px',
                                    color:
                                        '#49454F',
                                    marginBottom:
                                        '14px',
                                    lineHeight:
                                        1.5
                                }}
                            >
                                Este fondo solamente
                                se guardará para
                                esta PC/navegador.
                            </div>

                            {/* PREVIEW */}

                            <div
                                onDragOver={
                                    handleDragOver
                                }
                                onDrop={
                                    handleDrop
                                }
                                style={{
                                    width:
                                        '100%',
                                    height:
                                        '150px',
                                    borderRadius:
                                        '14px',
                                    marginBottom:
                                        '14px',
                                    overflow:
                                        'hidden',
                                    position:
                                        'relative',
                                    backgroundColor:
                                        '#E7E0EC',
                                    backgroundImage:
                                        tempBg
                                            ? `url("${tempBg}")`
                                            : 'none',
                                    backgroundSize:
                                        'cover',
                                    backgroundPosition:
                                        'center',
                                    backgroundRepeat:
                                        'no-repeat',
                                    border:
                                        '1px solid #E0D7E8',
                                    display:
                                        'flex',
                                    alignItems:
                                        'center',
                                    justifyContent:
                                        'center'
                                }}
                            >
                                {!tempBg && (
                                    <div
                                        style={{
                                            display:
                                                'flex',
                                            flexDirection:
                                                'column',
                                            alignItems:
                                                'center',
                                            gap:
                                                '6px',
                                            color:
                                                '#6F6675',
                                            fontSize:
                                                '13px'
                                        }}
                                    >
                                        <span
                                            className="material-symbols-outlined"
                                            style={{
                                                fontSize:
                                                    '30px'
                                            }}
                                        >
                                            wallpaper
                                        </span>

                                        Arrastra una
                                        imagen aquí
                                    </div>
                                )}

                                {isUploading && (
                                    <div
                                        style={{
                                            position:
                                                'absolute',
                                            inset:
                                                0,
                                            backgroundColor:
                                                'rgba(0,0,0,0.45)',
                                            color:
                                                '#FFFFFF',
                                            display:
                                                'flex',
                                            alignItems:
                                                'center',
                                            justifyContent:
                                                'center',
                                            fontSize:
                                                '13px',
                                            fontWeight:
                                                600
                                        }}
                                    >
                                        Guardando fondo...
                                    </div>
                                )}
                            </div>

                            {/* BOTONES */}

                            <div
                                style={{
                                    display:
                                        'flex',
                                    gap:
                                        '10px',
                                    alignItems:
                                        'center',
                                    flexWrap:
                                        'wrap'
                                }}
                            >
                                <label
                                    style={{
                                        padding:
                                            '9px 16px',
                                        backgroundColor:
                                            tempColor,
                                        color:
                                            dynamicTextColor,
                                        borderRadius:
                                            '18px',
                                        cursor:
                                            'pointer',
                                        fontWeight:
                                            600,
                                        fontSize:
                                            '13px',
                                        display:
                                            'inline-flex',
                                        alignItems:
                                            'center',
                                        gap:
                                            '7px',
                                        boxShadow:
                                            '0 2px 7px rgba(0,0,0,0.12)'
                                    }}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            fontSize:
                                                '17px'
                                        }}
                                    >
                                        upload
                                    </span>

                                    Subir Imagen

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                        onChange={
                                            handleBgChange
                                        }
                                        disabled={
                                            isUploading
                                        }
                                        style={{
                                            display:
                                                'none'
                                        }}
                                    />
                                </label>

                                {tempBg && (
                                    <button
                                        onClick={
                                            handleRemoveBg
                                        }
                                        disabled={
                                            isUploading
                                        }
                                        style={{
                                            padding:
                                                '9px 16px',
                                            backgroundColor:
                                                'rgba(255,0,0,0.1)',
                                            color:
                                                '#BA1A1A',
                                            borderRadius:
                                                '18px',
                                            border:
                                                'none',
                                            cursor:
                                                'pointer',
                                            fontWeight:
                                                600,
                                            fontSize:
                                                '13px'
                                        }}
                                    >
                                        Quitar fondo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                    ABOUT
                ================================================= */}

                {currentTab ===
                    'about' && (
                    <div>
                        <h2
                            style={{
                                fontSize:
                                    '22px',
                                fontWeight:
                                    600,
                                margin:
                                    '0 0 16px',
                                color:
                                    '#1D1B20'
                            }}
                        >
                            Acerca del Sistema
                        </h2>

                        <div
                            style={
                                cardStyle
                            }
                        >
                            <div
                                style={{
                                    fontWeight:
                                        500
                                }}
                            >
                                Versión de la plataforma
                            </div>

                            <div
                                style={{
                                    fontSize:
                                        '14px',
                                    color:
                                        '#49454F',
                                    marginTop:
                                        '4px'
                                }}
                            >
                                Build 2026.08 -
                                Motor integrado
                                nativo.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================
// ESTILOS
// ============================================================

const sidebarItemStyle = (
    isActive: boolean,
    activeColor: string,
    textColor: string
): React.CSSProperties => ({
    display:
        'flex',
    alignItems:
        'center',
    gap:
        '12px',
    padding:
        '10px 16px',
    borderRadius:
        '20px',
    border:
        'none',
    backgroundColor:
        isActive
            ? activeColor
            : 'transparent',
    color:
        isActive
            ? textColor
            : '#49454F',
    fontWeight:
        isActive
            ? 600
            : 400,
    fontSize:
        '14px',
    cursor:
        'pointer',
    textAlign:
        'left',
    width:
        '100%',
    transition:
        'background-color 150ms ease, color 150ms ease',
    boxSizing:
        'border-box'
});

const cardStyle: React.CSSProperties = {
    backgroundColor:
        '#FFFFFF',
    padding:
        '16px 20px',
    borderRadius:
        '16px',
    border:
        '1px solid #E7E0EC',
    boxShadow:
        '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom:
        '12px',
    boxSizing:
        'border-box'
};