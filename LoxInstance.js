import { Environment } from './Environment.js';
import { RuntimeError } from './Interpreter.js';
import { LoxFunction } from './LoxFunction.js';

export class LoxInstance {
  fields = {};
  /**
   * @param {import('./LoxClass').LoxClass} klass 
   */
  constructor(klass, constructorArgs) {
    this.class = klass;
  }
  /**
   * @param {import('./Token').Token} propName 
   */
  get(propName) {
    if (Object.hasOwn(this.fields, propName.lexeme)) {
      return this.fields[propName.lexeme];
    }
    const method = this.class.findMethod(propName.lexeme);
    if (method) return method.bind(this);
    throw new RuntimeError(propName, `Undefined property '${propName.lexeme}'.`);
  }
  /**
   * @param {import('./Token').Token} propName 
   */
  set(propName, value) {
    return this.fields[propName.lexeme] = value;
  }
  toString() {
    return `<${this.class.name} instance>`;
  }
}