/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file AppManifest.ts
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

import { Vector2 } from "../engine/Vectors";
import { WindowTheme } from "./WindowTheme";

export interface AppManifest{
    // --Identificador de la ventana--
    id?: string;

    // --Propiedades del Titlebar--
    icon?: string;
    title?: string;
    theme?: WindowTheme;

    // --Utilidades del Titlebar--
    flags: {
        allowMaximize: boolean;
        allowMinimize: boolean;
        allowResize: boolean;
        allowClose?: boolean;
        isAlwaysOnTop?: boolean;
    };

    // --Compositor utilizado para el contenido--
    runtime: 
        | 'native'
        | 'vanilla'
        | 'iframe'
        | 'godot'
        | 'react';

    // --Dirección del contenido--
    sourcePath: string;

    // --Posiciones y tamaño--
    size?: Vector2;
    minSize?: Vector2;
    maxSize?: Vector2;
    position?: Vector2;
}