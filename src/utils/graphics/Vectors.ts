import type { PixelType } from "../../core/ui/types/PixelType";
import { ComponentNumbers } from "../measure/ComponentNumbers";

/** @internal */
function resolveUnit(val: PixelType): string {
    if (val instanceof ComponentNumbers) {
        return val.toString();
    }

    return `${val}px`;
}

export class Vec2 {
    public x: PixelType;
    public y: PixelType;

    constructor(x: PixelType, y: PixelType) {
        this.x = x;
        this.y = y;
    }

    public toString(): string {
        return `${resolveUnit(this.x)}px ${resolveUnit(this.y)}px`;
    }
}

export class Vec3 {
    public x: PixelType;
    public y: PixelType;
    public z: PixelType;

    constructor(x: PixelType, y: PixelType, z: PixelType) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public toString(): string {
        return `${resolveUnit(this.x)} ${resolveUnit(this.y)} ${resolveUnit(this.z)}`;
    }
    
    public toTranslate3d(): string {
        return `translate3d(${resolveUnit(this.x)}, ${resolveUnit(this.y)}, ${resolveUnit(this.z)})`;
    }
}

export class Vec4 {
    public t: PixelType;
    public r: PixelType;
    public b: PixelType;
    public l: PixelType;

    constructor(
        t: PixelType, 
        r?: PixelType, 
        b?: PixelType, 
        l?: PixelType
    ) {
        this.t = t;
        this.r = r ?? t;
        this.b = b ?? t;
        this.l = l ?? r ?? t;
    }

    public toString(): string {
        return `${resolveUnit(this.t)} ${resolveUnit(this.r)} ${resolveUnit(this.b)} ${resolveUnit(this.l)}`;
    }
}

export const vec2 = (x: PixelType, y?: PixelType): Vec2 => new Vec2(x, y ?? x);
export const vec3 = (x: PixelType, y: PixelType, z: PixelType): Vec3 => new Vec3(x, y, z);
export const vec4 = (t: PixelType, r?: PixelType, b?: PixelType, l?: PixelType): Vec4 => new Vec4(t, r, b, l);