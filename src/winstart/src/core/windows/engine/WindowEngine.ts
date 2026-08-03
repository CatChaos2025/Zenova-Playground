/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file WindowEngine.ts
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

import { WindowNode } from "../models/WindowNode";
import { Vector2 } from "../../utilities/Vectors";
import { WindowConfig } from "../services/WindowProps";

export class WindowEngine {
    private windows: Map<string, WindowNode> = new Map();
    private topZIndex: number = 10;
    private listeners: Set<() => void> = new Set();

    readonly zIndexMin: number = 10;
    readonly zIndexMax: number = 100;

    public spawn(options: WindowConfig): WindowNode {
        const node = new WindowNode(options);
        return node;
    }

    public destroy(id: string): void {
        if (this.windows.delete(id)) {
            this.notify();
        }
    }

    public focus(id: string): void {
        const node = this.windows.get(id);
        if (node) {
            this.bringToFront(node);
            this.notify();
        }
    }

    private bringToFront(node: WindowNode): void {
        this.topZIndex++;

        if (this.topZIndex >= this.zIndexMax) {
            this.normalizeZIndexes();
        }

        node.focus(this.topZIndex);
    }

    private normalizeZIndexes(): void {
        const sortedWindows = Array.from(this.windows.values()).sort((a, b) => a.zIndex - b.zIndex);

        let currentZ = this.zIndexMin;
        for (const win of sortedWindows) {
            win.zIndex = currentZ++;
        }
        this.topZIndex = currentZ;
    }

    public move(id: string, x: number, y:number): void {
        const node = this.windows.get(id);
        if (node) {
            node.moveTo(new Vector2(x, y));
            this.notify();
        }
    }

    public maximize(id: string): void {
        const node = this.windows.get(id);
        if (node) {
            node.toggleState();
            this.notify();
        }
    }

    public getWindows(): WindowNode[] { return Array.from(this.windows.values()); }

    public subscribe(listener: () => void): () => void{
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void { this.listeners.forEach(l => l()); }
}