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
 * */

import { Vector2 } from "../../utilities/Vectors";
import { AppManifest } from "../services/AppManifest";
import { WindowConfig } from "../services/WindowProps";
import { WindowStateEnum, WindowStateMachine } from "./WindowState";
const webWindow: Window & typeof globalThis = window;


export class WindowNode {
    

    /**
     * @param id - Este es el identificador de la ventana, su valor no puede sobrepasar el del fondo
     * 
     * 
     * @param title - Este es el titulo de la ventana
     * 
     * 
     * @param position - Representa el valor de posición que tendrá la ventana en el espacio del escritorio, de valor vectorial bidimensional (Vector2)
     * 
     * 
     * @param size - Representa el valor de la altura y  el ancho que tendrá la ventana en el espacio del escritorio, de valor vectorial bidimensional (Vector2)
     */

    public id: string;
    public title: string;
    public manifest?: AppManifest;
    public position: Vector2;
    public size: Vector2;
    public minSize: Vector2;
    public maxSize: Vector2;
    public flags: AppManifest['flags'];
    public theme: {
        windowBg: string;
        highlightColor: string;
        contentBg: string;
    }

    public zIndex: number;
    public fsm: WindowStateMachine;

    private cachedBounds: { position: Vector2; size: Vector2 } | null = null;

    constructor(options: WindowConfig){
        const manifest = options.manifest;

        this.id = options.id || Math.random().toString(36).substring(2,9);
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

        this.theme = {
            windowBg: customTheme?.windowBg || manifestTheme?.windowBg || '#171717',       // Gris oscuro por defecto
            highlightColor: customTheme?.highlightColor || manifestTheme?.highlightColor || '#3b82f6', // Azul acento por defecto
            contentBg: customTheme?.contentBg || manifestTheme?.contentBg || '#0a0a0a',     // Negro profundo antes de cargar
        }

        this.zIndex = 1;
        this.fsm = new WindowStateMachine();
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

    public toggleState(): void {
        const state = this.fsm.getState();

        if (state === 'MAXIMIZED') {
            if (this.cachedBounds && this.fsm.transition('NORMAL')) {
                this.position = this.cachedBounds.position;
                this.size = this.cachedBounds.size;
                this.cachedBounds = null;
            }
        } else {
            if (this.fsm.transition('MAXIMIZED')) {
                this.cachedBounds = {
                    position: this.position.clone(),
                    size: this.size.clone()
                };

                this.position = new Vector2(0,0);
                this.size = new Vector2(webWindow.innerWidth, webWindow.innerHeight);
            }
        }
    }
}