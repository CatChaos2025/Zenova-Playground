type Unit = 'px' | '%' | 'fr' | 'em' | 'rem' | 'vh' | 'vw';

export class ComponentNumbers {
  private value: number;
  private unit: Unit;

  constructor(value: number, unit: Unit) {
    this.value = value;
    this.unit = unit;
  }

  public toString(): string {
    return `${this.value}${this.unit}`;
  }
}
