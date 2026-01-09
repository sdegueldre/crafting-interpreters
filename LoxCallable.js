export class LoxCallable {
  get arity() {
    throw new Error("Unimplemented");
    return 0;
  }
  /**
   * @param {import('./Interpreter').Interpreter} interpreter 
   * @param {any[]} args 
   */
  call(interpreter, args) {
    throw new Error("Unimplemented");
  }
}