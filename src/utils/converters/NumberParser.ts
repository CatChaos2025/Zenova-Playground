import { ComponentNumbers } from "../measure/ComponentNumbers";

declare global{
    interface Number {
    px(): ComponentNumbers;
    percent(): ComponentNumbers;
    fr(): ComponentNumbers;
  }
}

Number.prototype.px = function(): ComponentNumbers {
  return new ComponentNumbers(this.valueOf(), 'px');
};

Number.prototype.percent = function(): ComponentNumbers {
  return new ComponentNumbers(this.valueOf(), '%');
};

Number.prototype.fr = function(): ComponentNumbers {
  return new ComponentNumbers(this.valueOf(), 'fr');
};
