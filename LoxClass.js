import { LoxCallable } from "./LoxCallable.js";
import { LoxFunction } from "./LoxFunction.js";
import { LoxInstance } from "./LoxInstance.js";

export class LoxClass extends LoxCallable {
  /**
   * 
   * @param {string} name 
   * @param {{[key: string]: LoxFunction}} methods
   */
  constructor(name, methods) {
    super();
    this.name = name;
    this.methods = methods;
  }
  get arity() {
    return this.findMethod("init")?.arity ?? 0;
  }
  /**
   * 
   * @param {import('./Interpreter').Interpreter} interpreter 
   * @param {any[]} args 
   * @returns 
   */
  call(interpreter, args) {
    const instance = new LoxInstance(this, args);
    const initializer = this.findMethod("init");
    if (initializer) {
      initializer.bind(instance).call(interpreter, args);
    }
    return instance;
  }
  /**
   * @param {string} name 
   */
  findMethod(name) {
    if(Object.hasOwn(this.methods, name)) return this.methods[name];
  }
  toString() {
    return `<class ${this.name}>`
  }
}