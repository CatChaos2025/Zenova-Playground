export class ComponentLayer {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  public toString(): string {
    return `${this.value}`;
  }
}