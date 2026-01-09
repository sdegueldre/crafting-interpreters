import { Environment } from "./Environment.js";
import { LoxCallable } from "./LoxCallable.js";
import { Return } from "./Return.js";

export class LoxFunction extends LoxCallable {
  /**
   * @param {import("./Stmt.js").Function} declaration 
   */
  constructor(declaration, closure) {
    super();
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
      return e.value;
    }
    return null;
  }

  toString() {
    return `<fn ${this.declaration.name.lexeme} (L${this.declaration.name.line})>`;
  }
}