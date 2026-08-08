import React from 'react';

interface StartMenuItem {
    id: string;
    title: string;
    icon: string;
    description?: string;
    onClick: () => void;
}

interface StartMenuProps {
    open: boolean;
    primaryColor: string;
    items: StartMenuItem[];
    onClose: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
    open,
    primaryColor,
    items,
    onClose
}) => {
    if (!open) {
        return null;
    }

    return (
        <>
            {/* Fondo invisible para cerrar */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 3998
                }}
            />

            <div
                style={{
                    position: 'absolute',

                    left: '16px',
                    bottom: '16px',

                    width: '360px',
                    maxWidth:
                        'calc(100vw - 32px)',

                    maxHeight:
                        'calc(100vh - 90px)',

                    display: 'flex',
                    flexDirection: 'column',

                    padding: '14px',

                    backgroundColor:
                        'rgba(35, 33, 40, 0.92)',

                    backdropFilter:
                        'blur(24px) saturate(150%)',

                    WebkitBackdropFilter:
                        'blur(24px) saturate(150%)',

                    border:
                        '1px solid rgba(255,255,255,0.10)',

                    borderRadius: '26px',

                    boxShadow:
                        '0 18px 60px rgba(0,0,0,0.42)',

                    zIndex: 4000,

                    color: '#FFFFFF',

                    animation:
                        'webos-menu-in 180ms cubic-bezier(0.16,1,0.3,1)'
                }}
            >
                {/* =================================================
                    ENCABEZADO
                ================================================= */}

                <div
                    style={{
                        padding:
                            '8px 10px 14px'
                    }}
                >
                    <div
                        style={{
                            fontSize: '20px',
                            fontWeight: 650
                        }}
                    >
                        Aplicaciones
                    </div>

                    <div
                        style={{
                            fontSize: '12px',
                            opacity: 0.65,
                            marginTop: '4px'
                        }}
                    >
                        Todo lo que necesitas está aquí
                    </div>
                </div>

                {/* =================================================
                    BÚSQUEDA
                ================================================= */}

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',

                        height: '42px',

                        padding:
                            '0 12px',

                        marginBottom:
                            '10px',

                        borderRadius:
                            '16px',

                        backgroundColor:
                            'rgba(255,255,255,0.09)'
                    }}
                >
                    <span
                        className="material-symbols-outlined"
                        style={{
                            fontSize: '19px',
                            opacity: 0.70
                        }}
                    >
                        search
                    </span>

                    <input
                        placeholder="Buscar"
                        style={{
                            flex: 1,

                            marginLeft:
                                '8px',

                            border: 'none',
                            outline: 'none',

                            background:
                                'transparent',

                            color: '#FFFFFF',

                            fontSize:
                                '13px'
                        }}
                    />
                </div>

                {/* =================================================
                    APLICACIONES
                ================================================= */}

                <div
                    style={{
                        overflowY:
                            'auto',

                        display:
                            'flex',

                        flexDirection:
                            'column',

                        gap: '4px'
                    }}
                >
                    {items.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                item.onClick();
                                onClose();
                            }}
                            style={{
                                display:
                                    'flex',

                                alignItems:
                                    'center',

                                width:
                                    '100%',

                                padding:
                                    '10px',

                                border:
                                    'none',

                                borderRadius:
                                    '18px',

                                background:
                                    'transparent',

                                color:
                                    '#FFFFFF',

                                cursor:
                                    'pointer',

                                textAlign:
                                    'left',

                                transition:
                                    'background-color 140ms ease'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor =
                                    'rgba(255,255,255,0.09)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor =
                                    'transparent';
                            }}
                        >
                            <div
                                style={{
                                    width:
                                        '44px',
                                    height:
                                        '44px',

                                    borderRadius:
                                        '14px',

                                    backgroundColor:
                                        primaryColor,

                                    color:
                                        '#1D1B20',

                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    justifyContent:
                                        'center',

                                    flexShrink:
                                        0
                                }}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{
                                        fontSize:
                                            '21px'
                                    }}
                                >
                                    {item.icon}
                                </span>
                            </div>

                            <div
                                style={{
                                    minWidth:
                                        0,

                                    marginLeft:
                                        '12px'
                                }}
                            >
                                <div
                                    style={{
                                        fontSize:
                                            '13px',

                                        fontWeight:
                                            600
                                    }}
                                >
                                    {item.title}
                                </div>

                                {item.description && (
                                    <div
                                        style={{
                                            fontSize:
                                                '11px',

                                            opacity:
                                                0.60,

                                            marginTop:
                                                '3px',

                                            overflow:
                                                'hidden',

                                            textOverflow:
                                                'ellipsis',

                                            whiteSpace:
                                                'nowrap'
                                        }}
                                    >
                                        {item.description}
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* =================================================
                    PARTE INFERIOR
                ================================================= */}

                <div
                    style={{
                        marginTop:
                            '10px',

                        paddingTop:
                            '10px',

                        borderTop:
                            '1px solid rgba(255,255,255,0.08)',

                        display:
                            'flex',

                        justifyContent:
                            'space-between'
                    }}
                >
                    <button
                        style={bottomButtonStyle}
                    >
                        <span
                            className="material-symbols-outlined"
                        >
                            settings
                        </span>

                        Configuración
                    </button>

                    <button
                        style={bottomButtonStyle}
                    >
                        <span
                            className="material-symbols-outlined"
                        >
                            power_settings_new
                        </span>

                        Apagar
                    </button>
                </div>
            </div>
        </>
    );
};

const bottomButtonStyle:
    React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',

    padding:
        '8px 10px',

    border: 'none',
    borderRadius: '12px',

    background:
        'transparent',

    color:
        'rgba(255,255,255,0.75)',

    fontSize: '11px',

    cursor:
        'pointer'
};