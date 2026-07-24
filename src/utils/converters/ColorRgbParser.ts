type NoNegativo<N extends number> = `${N}` extends `-${string}`
  ? "Los canales de color no pueden ser números negativos"
  : N;

const clamp = (val: number, min: number, max:number) => Math.max(min, Math.min(max, val))

export function rgb<
        R extends number, 
        G extends number, 
        B extends number
        >(
            r: R & NoNegativo<R>, 
            g: G & NoNegativo<G>, 
            b: B & NoNegativo<B>
        ): string{

    if (r < 0 || g < 0 || b < 0) {
        throw new RangeError("No se permiten valores negativos en rgb().");
    }

    const safeR = Math.round(clamp(r, 0, 255));
    const safeG = Math.round(clamp(g, 0, 255));
    const safeB = Math.round(clamp(b, 0, 255));
    
    return `rgb(${safeR}, ${safeG}, ${safeB})`;
}

export function rgba<        
        R extends number, 
        G extends number, 
        B extends number,
        A extends number
        >(
            r: R & NoNegativo<R>, 
            g: G & NoNegativo<G>, 
            b: B & NoNegativo<B>,
            a: A & NoNegativo<A>
        ): string{

    if (r < 0 || g < 0 || b < 0 || a < 0) {
        throw new RangeError("No se permiten valores negativos en rgba().");
    }

    const safeR = Math.round(clamp(r, 0, 255));
    const safeG = Math.round(clamp(g, 0, 255));
    const safeB = Math.round(clamp(b, 0, 255));
    const safeA = clamp(a, 0, 1);

    return `rgba(${safeR}, ${safeG}, ${safeB}, ${safeA})`;
}