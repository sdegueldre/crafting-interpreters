import { Lox } from './Lox.js';

const FunctionType = /** @type {const} */ ({
  NONE: Symbol("None"),
  FUNCTION: Symbol("Function"),
})

export class Resolver {
  scopes = [];
  currentFunction = FunctionType.NONE;
  constructor(interpreter) {
    this.interpreter = interpreter;
  }
  /**
   * 
   * @param {import('./Stmt').Block} stmt 
   * @returns 
   */
  visitBlockStmt(stmt) {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
    return null;
  }
  /**
   * 
   * @param {(import('./Stmt').Stmt | import('./Expr').Expr)[]} AstNodes 
   * @returns 
   */
  resolve(AstNodes) {
    for (const node of AstNodes) {
      node.accept(this);
    }
  }
  beginScope() {
    this.scopes.push({})
  }
  endScope() {
    this.scopes.pop()
  }
  /**
   * 
   * @param {import('./Stmt').Var} stmt 
   * @returns 
   */
  visitVarStmt(stmt) {
    this.declare(stmt.name);
    if (stmt.initializer != null) {
      this.resolve([stmt.initializer]);
    }
    this.define(stmt.name);
    return null;
  }
  /**
   * 
   * @param {import('./Token').Token} name 
   * @returns 
   */
  declare(name) {
    if (!this.scopes.length) return;
    const scope = this.scopes.at(-1);
    if (name.lexeme in scope)
      Lox.error(name, "Already a variable with this name in this scope.");
    scope[name.lexeme] = false;
  }
  /**
   * 
   * @param {import('./Token').Token} name 
   * @returns 
   */
  define(name) {
    if (!this.scopes.length) return;
    this.scopes.at(-1)[name.lexeme] = true;
  }
  /**
   * @param {import('./Expr').Variable} expr 
   */
  visitVariableExpr(expr) {
    if (this.scopes.length && this.scopes.at(-1)[expr.name.lexeme] == false) {
      Lox.error(expr.name, "Can't read local variable in its own initializer.");
    }

    this.resolveLocal(expr, expr.name);
  }
  /**
   * @param {import('./Expr').Expr} expr 
   * @param {import('./Token.js').Token} name
   */
  resolveLocal(expr, name) {
    for(let i = this.scopes.length - 1; i >= 0; i--) {
      if (Object.hasOwn(this.scopes[i], name.lexeme))
        return this.interpreter.resolve(expr, this.scopes.length - i - 1);
    }
  }
  /**
   * @param {import('./Expr').Assign} expr 
   */
  visitAssignExpr(expr) {
    this.resolve([expr.value]);
    this.resolveLocal(expr, expr.name);
  }
  /**
   * @param {import('./Stmt').Function} stmt 
   */
  visitFunctionStmt(stmt) {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }
  /**
   * @param {import('./Stmt').Function} func
   * @param {(typeof FunctionType)[keyof(typeof FunctionType)]} type
   */
  resolveFunction(func, type) {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;
    this.beginScope();
    for (const param of func.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve(func.body);
    this.endScope();
    this.currentFunction = enclosingFunction;
  }
  /**
   * @param {import('./Stmt').Expression} stmt 
   */
  visitExpressionStmt(stmt) {
    this.resolve([stmt.expression]);
  }
  /**
   * @param {import('./Stmt').If} stmt 
   */
  visitIfStmt(stmt) {
    this.resolve([stmt.condition]);
    this.resolve([stmt.thenBranch]);
    if (stmt.elseBranch != null) this.resolve([stmt.elseBranch]);
  }
  /**
   * @param {import('./Stmt').Print} stmt 
   */
  visitPrintStmt(stmt) {
    this.resolve([stmt.expression]);
  }
  /**
   * @param {import('./Stmt').Return} stmt 
   */
  visitReturnStmt(stmt) {
    if (this.currentFunction !== FunctionType.FUNCTION)
      Lox.error(stmt.keyword, "Can't return from top-level code.");
    if(!stmt.value) return;
    this.resolve([stmt.value]);
  }
  /**
   * @param {import('./Stmt').While} stmt 
   */
  visitWhileStmt(stmt) {
    this.resolve([stmt.condition]);
    this.resolve([stmt.body]);
  }
  /**
   * @param {import('./Expr').Binary} expr 
   */
  visitBinaryExpr(expr) {
    this.resolve([expr.left]);
    this.resolve([expr.right]);
  }
  /**
   * @param {import('./Expr').Unary} expr 
   */
  visitUnaryExpr(expr) {
    this.resolve([expr.right]);
  }
  /**
   * @param {import('./Expr').Call} expr 
   */
  visitCallExpr(expr) {
    this.resolve([expr.callee]);
    for(const argument of expr.args) {
      this.resolve([argument]);
    }
  }
  /**
   * @param {import('./Expr').Grouping} expr 
   */
  visitGroupingExpr(expr) {
    this.resolve([expr.expression]);
  }
  /**
   * @param {import('./Expr').Literal} expr 
   */
  visitLiteralExpr(expr) {
    return;
  }
  /**
   * @param {import('./Expr').Logical} expr 
   */
  visitLogicalExpr(expr) {
    this.resolve([expr.left]);
    this.resolve([expr.right]);
  }
}