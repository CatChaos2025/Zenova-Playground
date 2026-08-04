/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file Index.ts
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 **/

// ==========================================================================
// CORE & LOGIC
// ==========================================================================
export { WindowNode } from './core/windows/engine/WindowNode.js';
export { WindowStateMachine } from './core/windows/engine/WindowState.js';

// ==========================================================================
// UI COMPONENTS
// ==========================================================================
export { WindowFrame } from './components/WindowFrame.js';
export { WindowTitleBar } from './components/WindowTitleBar.js';
export { WindowContent } from './components/WindowContent.js';
export { WindowActionControls } from './components/WindowActionControls.js';
export { WindowAboutButton } from './components/WindowAboutButton.js';

// ==========================================================================
// CONTRACTS & TYPES
// ==========================================================================
export * from './core/windows/contracts/WindowTheme.js';
export * from './core/windows/contracts/AppManifest.js';
export * from './core/windows/contracts/WindowProps.js';
export * from './core/windows/contracts/TitleBarProps.js';
export * from './utils/Vectors.js'

// ==========================================================================
// STYLES
// ==========================================================================
import './themes/apptheme.css';