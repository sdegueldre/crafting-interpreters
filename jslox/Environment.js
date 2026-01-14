import { RuntimeError } from './Interpreter.js';

export class Environment {
  values = {};
  /**
   * @param {Environment} enclosing 
   */
  constructor(enclosing = null) {
    this.enclosing = enclosing;
  }
  /**
   * @param {string} name 
   * @param {any} value 
   */
  define(name, value) {
    this.values[name] = value;
  }
  /**
   * @param {import('./Token').Token} name 
   */
  get(name) {
    if (Object.hasOwn(this.values, name.lexeme))
      return this.values[name.lexeme];
    if (this.enclosing)
      return this.enclosing.get(name);
    debugger;
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
  /**
   * @param {number} distance 
   * @param {string} name 
   */
  getAt(distance, name) {
    let env = this;
    for (let i = 0; i < distance; i++) env = env.enclosing;
    return env.values[name];
  }
  /**
   * @param {import('./Token').Token} name 
   * @param {any} value 
   * @returns 
   */
  assign(name, value) {
    if (Object.hasOwn(this.values, name.lexeme))
      return this.values[name.lexeme] = value;
    if (this.enclosing)
      return this.enclosing.assign(name, value);
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
  /**
   * @param {number} distance 
   * @param {import('./Token').Token} name 
   * @param {any} value 
   * @returns 
   */
  assignAt(distance, name, value) {
    let env = this;
    for (let i = 0; i < distance; i++) env = env.enclosing;
    env.values[name.lexeme] = value;
  }
}