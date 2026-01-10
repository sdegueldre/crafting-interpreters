import { Environment } from "./Environment.js";
import { LoxCallable } from "./LoxCallable.js";
import { Return } from "./Return.js";

export class LoxFunction extends LoxCallable {
  /**
   * @param {import("./Stmt.js").Func} declaration 
   * @param {import("./Environment.js").Environment} closure
   * @param {boolean} isInitializer
   */
  constructor(declaration, closure, isInitializer = false) {
    super();
    this.isInitializer = isInitializer;
    this.declaration = declaration;
    this.closure = closure;
  }
  get arity() {
    return this.declaration.params.length;
  }
  /**
   * @param {import('./Interpreter').Interpreter} interpreter 
   * @param {any[]} args 
   */
  call(interpreter, args) {
    const environment = new Environment(this.closure);
    for (const [i, param] of this.declaration.params.entries()) {
      environment.define(param.lexeme, args[i]);
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (e) {
      if (!(e instanceof Return)) throw e;
      if (this.isInitializer) return this.closure.getAt(0, "this");
      return e.value;
    }
    if (this.isInitializer) return this.closure.getAt(0, "this");
    return null;
  }

  bind(instance) {
    const env = new Environment(this.closure);
    env.define("this", instance);
    return new LoxFunction(this.declaration, env, this.isInitializer);
  }

  toString() {
    if (this.closure.values['this']) {
      console.log(this.closure.values['this']);
      return `<method ${this.declaration.name.lexeme} (L${this.declaration.name.line})>`;
    }
    return `<fn ${this.declaration.name.lexeme} (L${this.declaration.name.line})>`;
  }
}