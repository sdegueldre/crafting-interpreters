import { Environment } from './Environment.js';
import { Lox } from './Lox.js';
import { LoxCallable } from './LoxCallable.js';
import { LoxClass } from './LoxClass.js';
import { LoxFunction } from './LoxFunction.js';
import { LoxInstance } from './LoxInstance.js';
import { Return } from './Return.js';
import { Token } from './Token.js';
import { TokenType } from './TokenType.js';

export class RuntimeError extends Error {
  /**
   * @param {Token} token 
   * @param {string} message 
   */
  constructor(token, message) {
    super(message);
    this.token = token;
  }
}

function isTruthy(value) {
  if (value === null) return false;
  if (value === false) return false;
  return true;
}

function isEqual(a, b) {
  return a === b || (Number.isNaN(a) && Number.isNaN(b));
}

/**
 * @param {Token} operator 
 * @param {any} value 
 */
function checkNumberOperand(operator, value) {
  if (typeof value !== "number") throw new RuntimeError(operator, "Operand must be a number.");
}

/**
 * @param {Token} operator 
 * @param {any} left 
 * @param {any} right 
 */
function checkNumberOperands(operator, left, right) {
  if (typeof left !== "number" || typeof right !== "number")
    throw new RuntimeError(operator, "Operands must be numbers.");
}

function stringify(object) {
  if (object === null) return "nil";
  return object.toString();
}

class Clock extends LoxCallable {
  get arity() {
    return 0;
  }
  call() {
    return Date.now() / 1000;
  }
  toString() {
    return "<native function 'clock'>"
  }
}

export class Interpreter {
  globals = new Environment();
  environment = this.globals;
  locals = new Map();
  constructor() {
    this.globals.define("clock", new Clock())
  }
  /**
   * @param {import('./Expr').Expr} expr 
   */
  evaluate(expr) {
    return expr.accept(this);
  }
  /**
   * @param {import('./Stmt.js').Stmt} stmt
   */
  execute(stmt) {
    stmt.accept(this);
  }
  /**
   * 
   * @param {import('./Expr').Expr} expr 
   * @param {number} depth 
   */
  resolve(expr, depth) {
    this.locals.set(expr, depth);
  }
  /**
   * @param {import('./Stmt.js').Stmt[]} statements
   * @param {Environment} environment
   */
  executeBlock(statements, environment) {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }
  /**
   * @param {import('./Stmt.js').Stmt[]} statements 
   */
  interpret(statements) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if (!(error instanceof RuntimeError)) throw error
      Lox.runtimeError(error);
    }
  }
  /**
   * @param {import('./Expr').Literal} expr 
   */
  visitLiteralExpr(expr) {
    return expr.value;
  }
  /**
   * @param {import('./Expr').Grouping} expr 
   */
  visitGroupingExpr(expr) {
    return this.evaluate(expr.expression);
  }
  /**
   * @param {import('./Expr').Unary} expr 
   */
  visitUnaryExpr(expr) {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !isTruthy(right);
      case TokenType.MINUS:
        checkNumberOperand(expr.operator, right);
        return -right;
    }

    // Unreachable.
    throw new Error(`Unimplemented unary operator: ${expr.operator.type}`);
    return null;
  }
  /**
   * @param {import('./Expr').Binary} expr 
   */
  visitBinaryExpr(expr) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.GREATER:
        checkNumberOperands(expr.operator, left, right);
        return left > right;
      case TokenType.GREATER_EQUAL:
        checkNumberOperands(expr.operator, left, right);
        return left >= right;
      case TokenType.LESS:
        checkNumberOperands(expr.operator, left, right);
        return left < right;
      case TokenType.LESS_EQUAL:
        checkNumberOperands(expr.operator, left, right);
        return left <= right;
      case TokenType.BANG_EQUAL: return !isEqual(left, right);
      case TokenType.EQUAL_EQUAL: return isEqual(left, right);
      case TokenType.MINUS:
        checkNumberOperands(expr.operator, left, right);
        return left - right;
      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }

        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }
        throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
      case TokenType.SLASH:
        checkNumberOperands(expr.operator, left, right);
        return left / right;
      case TokenType.STAR:
        checkNumberOperands(expr.operator, left, right);
        return left * right;
    }

    // Unreachable.
    throw new Error(`Unimplemented binary operator: ${expr.operator.type}`);
    return null;
  }
  /**
   * @param {import('./Expr').Variable} expr 
   */
  visitVariableExpr(expr) {
    return this.lookUpVariable(expr.name, expr);
  }
  /**
   * @param {import('./Expr').This} expr 
   */
  visitThisExpr(expr) {
    return this.lookUpVariable(expr.keyword, expr);
  }
  /**
   * @param {import('./Token').Token} name 
   * @param {import('./Expr').Expr} expr 
   * @returns {any}
   */
  lookUpVariable(name, expr) {
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return this.globals.get(name);
    }
  }
  /**
   * @param {import('./Expr').Assign} expr 
   */
  visitAssignExpr(expr) {
    const value = this.evaluate(expr.value);

    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }

    return value;
  }
  /**
   * @param {import('./Expr').Set} expr 
   */
  visitSetExpr(expr) {
    const obj = this.evaluate(expr.object);
    if (!(obj instanceof LoxInstance)) {
      throw new RuntimeError(expr.name, `Can only set properties on instances, got '${stringify(obj)}'`);
    }
    const value = this.evaluate(expr.value);
    obj.set(expr.name, value);
    return value;
  }
  /**
   * 
   * @param {import('./Expr').Logical} expr 
   */
  visitLogicalExpr(expr) {
    const left = this.evaluate(expr.left);
    if (expr.operator.type === TokenType.OR) {
      if (isTruthy(left)) return left;
    } else {
      if (!isTruthy(left)) return left;
    }
    return this.evaluate(expr.right);
  }
  /**
   * @param {import('./Expr').Call} expr 
   */
  visitCallExpr(expr) {
    const callee = this.evaluate(expr.callee);
    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(expr.paren, `'${stringify(callee)}' is not callable.`);
    }
    const args = expr.args.map(arg => this.evaluate(arg));
    if (args.length != callee.arity) {
      throw new RuntimeError(expr.paren, `Expected ${callee.arity} arguments but got ${args.length}.`);
    }
    return callee.call(this, args);
  }
  /**
   * @param {import('./Expr').Get} expr 
   */
  visitGetExpr(expr) {
    const obj = this.evaluate(expr.object);
    if (!(obj instanceof LoxInstance)) {
      throw new RuntimeError(expr.name, `Property access is only valid on instances, got '${stringify(obj)}'.`);
    }
    return obj.get(expr.name);
  }
  /**
   * @param {import('./Expr').Super} expr 
   */
  visitSuperExpr(expr) {
    const distance = this.locals.get(expr);
    const superclass = this.environment.getAt(distance, "super");
    const method = superclass.findMethod(expr.method.lexeme);
    if (!method) {
      throw new RuntimeError(expr.method, `Superclass doesn't implement method '${expr.method.lexeme}'.`);
    }
    return method.bind(this.environment.getAt(distance - 1, "this"));
  }
  /**
   * @param {import('./Stmt').Expression} stmt 
   */
  visitExpressionStmt(stmt) {
    this.evaluate(stmt.expression);
  }
  /**
   * @param {import('./Stmt').Print} stmt 
   */
  visitPrintStmt(stmt) {
    const value = this.evaluate(stmt.expression);
    console.log(stringify(value));
  }
  /**
   * @param {import('./Stmt').Var} stmt 
   */
  visitVarStmt(stmt) {
    const value = stmt.initializer ? this.evaluate(stmt.initializer) : null;
    this.environment.define(stmt.name.lexeme, value);
  }
  /**
   * @param {import('./Stmt').Block} stmt 
   */
  visitBlockStmt(stmt) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }
  /**
   * @param {import('./Stmt').If} stmt 
   */
  visitIfStmt(stmt) {
    if (isTruthy(this.evaluate(stmt.condition))) this.execute(stmt.thenBranch);
    else if (stmt.elseBranch) this.execute(stmt.elseBranch);
  }
  /**
   * @param {import('./Stmt').While} stmt 
   */
  visitWhileStmt(stmt) {
    while (isTruthy(this.evaluate(stmt.condition))) this.execute(stmt.body);
  }
  /**
   * @param {import('./Stmt').Func} stmt 
   */
  visitFuncStmt(stmt) {
    this.environment.define(stmt.name.lexeme, new LoxFunction(stmt, this.environment));
  }
  /**
   * @param {import('./Stmt').Return} stmt 
   */
  visitReturnStmt(stmt) {
    throw new Return(stmt.value && this.evaluate(stmt.value))
  }
  /**
   * @param {import('./Stmt').Class} stmt 
   */
  visitClassStmt(stmt) {
    this.environment.define(stmt.name.lexeme, null);
    let superclass;
    if (stmt.superclass) {
      superclass = this.evaluate(stmt.superclass);
      if (!(superclass instanceof LoxClass)) {
        throw new RuntimeError(stmt.superclass.name, `Superclass must be a class, got '${stringify(superclass)}'`);
      }
      this.environment = new Environment(this.environment);
      this.environment.define("super", superclass);
    }

    const methods = {};
    for (const method of stmt.methods) {
      methods[method.name.lexeme] = new LoxFunction(method, this.environment, method.name.lexeme === "init");
    }
    if (stmt.superclass) this.environment = this.environment.enclosing;
    this.environment.assign(stmt.name, new LoxClass(stmt.name.lexeme, superclass, methods));
  }
}