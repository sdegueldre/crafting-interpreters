import { Environment } from './Environment.js';
import { Lox } from './Lox.js';
import { Stmt } from './Stmt.js';
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
  if (object == null) return "nil";
  return object.toString();
}

export class Interpreter {
  environment = new Environment();
  /**
   * @param {import('./Expr').Expr} expr 
   * @returns 
   */
  evaluate(expr) {
    return expr.accept(this);
  }
  /**
   * @param {import('./Stmt.js').Stmt} stmt
   * @returns 
   */
  execute(stmt) {
    stmt.accept(this);
  }
  /**
   * @param {import('./Stmt.js').Stmt[]} statements
   * @returns 
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
   * @returns 
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
   * @returns 
   */
  visitLiteralExpr(expr) {
    return expr.value;
  }
  /**
   * @param {import('./Expr').Grouping} expr 
   * @returns 
   */
  visitGroupingExpr(expr) {
    return this.evaluate(expr.expression);
  }
  /**
   * @param {import('./Expr').Unary} expr 
   * @returns 
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
   * @returns 
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
   * @returns 
   */
  visitVariableExpr(expr) {
    return this.environment.get(expr.name);
  }
  /**
   * @param {import('./Expr').Assign} expr 
   * @returns 
   */
  visitAssignExpr(expr) {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }
  /**
   * @param {import('./Stmt').Expression} stmt 
   * @returns 
   */
  visitExpressionStmt(stmt) {
    this.evaluate(stmt.expression);
  }
  /**
   * @param {import('./Stmt').Print} stmt 
   * @returns 
   */
  visitPrintStmt(stmt) {
    const value = this.evaluate(stmt.expression);
    console.log(stringify(value));
  }
  /**
   * @param {import('./Stmt').Var} stmt 
   * @returns 
   */
  visitVarStmt(stmt) {
    const value = stmt.initializer ? this.evaluate(stmt.initializer) : null;
    this.environment.define(stmt.name.lexeme, value);
  }
  /**
   * @param {import('./Stmt').Block} stmt 
   * @returns 
   */
  visitBlockStmt(stmt) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }
}