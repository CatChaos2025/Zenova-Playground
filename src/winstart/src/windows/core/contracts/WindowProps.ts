/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file WindowProps.ts
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

import { Vector2 } from "../engine/Vectors";
import { AppManifest } from "./AppManifest";
import { WindowTheme } from "./WindowTheme";

export interface WindowConfig {
    id?: string;
    title?: string;
    manifest?: AppManifest;
    position?: Vector2;
    size?: Vector2;
    theme?: WindowTheme;
}