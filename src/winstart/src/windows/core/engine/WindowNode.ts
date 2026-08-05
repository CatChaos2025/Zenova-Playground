/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file WindowNode.ts
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 **/

import { Vector2 } from "./Vectors";
import { AppManifest } from "../contracts/AppManifest";
import { WindowConfig } from "../contracts/WindowProps";
import { WindowTheme } from "../contracts/WindowTheme";
import { WindowStateMachine } from "./WindowState";
const webWindow: Window & typeof globalThis = window;

export class WindowNode {
    /**
     * @param id - Este es el identificador de la ventana, su valor no puede sobrepasar el del fondo
     * @param title - Este es el titulo de la ventana
     * @param position - Representa el valor de posición que tendrá la ventana en el espacio del escritorio (Vector2)
     * @param size - Representa el valor de la altura y el ancho que tendrá la ventana (Vector2)
     */

    public id: string;
    public title: string;
    public manifest?: AppManifest;
    public position: Vector2;
    public size: Vector2;
    public minSize: Vector2;
    public maxSize: Vector2;
    public flags: AppManifest['flags'];
    public theme: WindowTheme;

    public zIndex: number;
    public fsm: WindowStateMachine;

    private cachedBounds: { position: Vector2; size: Vector2 } | null = null;

    constructor(options: WindowConfig) {
        const manifest = options.manifest;

        this.id = options.id || Math.random().toString(36).substring(2, 9);
        this.title = options.title || manifest?.title || 'New Start Compose';
        this.manifest = manifest;

        this.position = options.position || new Vector2(100, 100);
        this.size = options.size || manifest?.size || new Vector2(800, 600);
        this.minSize = manifest?.minSize || new Vector2(640, 480);
        this.maxSize = manifest?.maxSize || new Vector2(Infinity, Infinity);

        this.flags = manifest?.flags || {
            allowMaximize: true,
            allowMinimize: true,
            allowResize: true,
            isAlwaysOnTop: false,
        };

        const customTheme = options.theme;
        const manifestTheme = manifest?.theme;

        // Integración completa del sistema de temas, incluyendo colorScheme
        this.theme = {
            colorScheme: customTheme?.colorScheme || manifestTheme?.colorScheme || 'system',
            windowBg: customTheme?.windowBg || manifestTheme?.windowBg,
            titlebarBg: customTheme?.titlebarBg || manifestTheme?.titlebarBg,
            highlightColor: customTheme?.highlightColor || manifestTheme?.highlightColor || '#3b82f6',
            contentBg: customTheme?.contentBg || manifestTheme?.contentBg,
            fontFamily: customTheme?.fontFamily || manifestTheme?.fontFamily,
        };

        this.zIndex = 1;
        this.fsm = new WindowStateMachine();
    }

    /** Actualiza parcial o totalmente el tema de la ventana en tiempo de ejecución */
    public setTheme(newTheme: Partial<WindowTheme>): void {
        this.theme = {
            ...this.theme,
            ...newTheme,
        };
    }

    public moveTo(pos: Vector2): void {
        if (this.fsm.getState() === 'MAXIMIZED') return;
        this.position = pos;
    }

    public resizeTo(size: Vector2): void {
        if (this.fsm.getState() === 'MAXIMIZED') return;
        this.size = new Vector2(Math.max(200, size.x), Math.max(150, size.y));
    }

    public focus(topZIndex: number): void {
        this.zIndex = topZIndex;

        if (this.fsm.getState() === 'MINIMIZED') {
            this.fsm.transition('NORMAL');
        }
    }

    public toggleState() {
        const currentState = this.fsm.getState();

        if (currentState === 'MAXIMIZED') {
            // RESTAURAR: Volver al estado normal y recuperar las coordenadas guardadas
            this.fsm.transition('NORMAL');
            if (this.cachedBounds) {
                this.position = this.cachedBounds.position.clone();
                this.size = this.cachedBounds.size.clone();
            }
        } else {
            // MAXIMIZAR: Guardar posición/tamaño actual y expandir a pantalla completa
            this.cachedBounds = {
                position: this.position.clone(),
                size: this.size.clone()
            };
            this.fsm.transition('MAXIMIZED');
            // Aquí ajustas la posición a 0,0 y el tamaño al viewport o contenedor padre
            this.position = new Vector2(0, 0);
            this.size = new Vector2(window.innerWidth, window.innerHeight);
        }
    }
}