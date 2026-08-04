/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file Vectors.ts
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

export class Vector2 {
    constructor(public x: number, public y: number) {}

    public add(v: Vector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    public subtract(v: Vector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y)
    }

    public clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }
    
    public clamp(min: Vector2, max: Vector2): Vector2 {
        return new Vector2(
            Math.max(min.x, Math.min(this.x, max.x)),
            Math.max(min.y, Math.min(this.y, max.y))
        );
    }
}

export class Vector3 {
    constructor(public x: number, public y: number, public z: number) {}

    public add(v: Vector3): Vector3 {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    public subtract(v: Vector3): Vector3 {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z)
    }

    public clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }
    
    public clamp(min: Vector3, max: Vector3): Vector3 {
        return new Vector3(
            Math.max(min.x, Math.min(this.x, max.x)),
            Math.max(min.y, Math.min(this.y, max.y)),
            Math.max(min.z, Math.min(this.z, max.z))
        );
    }
}