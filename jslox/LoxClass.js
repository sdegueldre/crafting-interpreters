import { LoxCallable } from "./LoxCallable.js";
import { LoxInstance } from "./LoxInstance.js";

export class LoxClass extends LoxCallable {
  /**
   * 
   * @param {string} name
   * @param {LoxClass} superclass
   * @param {{[key: string]: import('./LoxFunction.js').LoxFunction}} methods
   */
  constructor(name, superclass, methods) {
    super();
    this.name = name;
    this.superclass = superclass;
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
   * @returns {import('./LoxFunction.js').LoxFunction}
   */
  findMethod(name) {
    if(Object.hasOwn(this.methods, name)) return this.methods[name];
    if (this.superclass) return this.superclass.findMethod(name);
  }
  toString() {
    return `<class ${this.name}>`
  }
}