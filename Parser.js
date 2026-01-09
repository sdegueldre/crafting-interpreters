/** @typedef {import("./Expr").Expr} Expr */
/** @typedef {import('./Token').Token} Token */

import { Assign, Binary, Grouping, Literal, Logical, Unary, Variable } from "./Expr.js";
import { Lox } from "./Lox.js";
import { Block, Expression, If, Print, Stmt, Var, While } from "./Stmt.js";
import { TokenType } from "./TokenType.js";

/** @typedef {keyof(typeof TokenType)} TokenType */

class ParseError extends Error { }

export class Parser {
  current = 0;
  /**
   * 
   * @param {Token[]} tokens 
   */
  constructor(tokens) {
    this.tokens = tokens;
  }
  /**
   * 
   * @returns {Stmt[]}
   */
  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }

    return statements;
  }
  /**
   * @returns {Stmt}
   */
  declaration() {
    try {
      if (this.match(TokenType.VAR)) return this.varDeclaration();

      return this.statement();
    } catch (error) {
      if (!(error instanceof ParseError)) throw error;
      this.synchronize();
    }
  }
  /**
   * @returns {Stmt}
   */
  varDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

    let initializer = this.match(TokenType.EQUAL) ? this.expression() : null;

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new Var(name, initializer);
  }
  /**
   * @returns {Stmt}
   */
  statement() {
    if (this.match(TokenType.FOR)) return this.for();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.WHILE)) return this.while();
    if (this.match(TokenType.LEFT_BRACE)) return this.blockStatement();

    return this.expressionStatement();
  }
  /**
   * @returns {Stmt}
   */
  for() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
    let initializer;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition;
    if (this.check(TokenType.SEMICOLON)) {
      condition = new Literal(true);
    } else {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' condition");

    let increment;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for loop increment");

    let body = this.statement();
    if (increment) {
      body = new Block([body, increment]);
    }
    const whileStmt = new While(condition, body);
    if (!initializer) return whileStmt;
    return new Block([initializer, whileStmt]);
  }
  /**
   * @returns {Stmt}
   */
  printStatement() {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }
  /**
   * @returns {Stmt}
   */
  while() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after while condition.");

    const body = this.statement();
    return new While(condition, body);
  }
  /**
   * @returns {Stmt}
   */
  blockStatement() {
    const statements = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return new Block(statements);
  }
  /**
   * @returns {Stmt}
   */
  ifStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }
    return new If(condition, thenBranch, elseBranch);
  }
  /**
   * @returns {Stmt}
   */
  expressionStatement() {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Expression(expr);
  }
  /**
   * @returns {Expr}
   */
  expression() {
    return this.assignment();
  }
  /**
   * @returns {Expr}
   */
  assignment() {
    const expr = this.or();
    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();
      if (expr instanceof Variable) {
        const name = expr.name;
        return new Assign(name, value)
      }
      this.error(equals, "Invalid assignment target");
    }
    return expr;
  }
  /**
   * @returns {Expr}
   */
  or() {
    let expr = this.and();
    while (this.match(TokenType.OR)) {
      expr = new Logical(expr, this.previous(), this.and());
    }
    return expr
  }
  /**
   * @returns {Expr}
   */
  and() {
    let expr = this.equality();
    while (this.match(TokenType.AND)) {
      expr = new Logical(expr, this.previous(), this.equality());
    }
    return expr
  }
  /**
   * 
   * @returns {Expr}
   */
  equality() {
    let expr = this.comparison();
    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Binary(expr, operator, right);
    }
    return expr;
  }
  /**
   * @returns {Expr}
   */
  comparison() {
    let expr = this.term();

    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }
  /**
   * @returns {Expr}
   */
  term() {
    let expr = this.factor();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }
  /**
   * @returns {Expr}
   */
  factor() {
    let expr = this.unary();

    while (this.match(TokenType.STAR, TokenType.SLASH)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }
  /**
   * @returns {Expr}
   */
  unary() {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }

    return this.primary();
  }
  /**
   * @returns {Expr}
   */
  primary() {
    if (this.match(TokenType.FALSE)) return new Literal(false);
    if (this.match(TokenType.TRUE)) return new Literal(true);
    if (this.match(TokenType.NIL)) return new Literal(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal);
    }

    if (this.match(TokenType.IDENTIFIER)) return new Variable(this.previous());

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }
  /**
   * @param  {TokenType[]} types 
   * @returns 
   */
  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }
  /**
   * @param {TokenType} type 
   * @param {string} message 
   * @returns 
   */
  consume(type, message) {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }
  /**
   * @param {Token} token 
   * @param {String} message 
   * @returns 
   */
  error(token, message) {
    Lox.error(token, message);
    return new ParseError();
  }
  synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
  /**
   * @param {TokenType} type 
   * @returns 
   */
  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type == type;
  }
  /**
   * @returns {Token}
   */
  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  /**
   * 
   * @returns {boolean}
   */
  isAtEnd() {
    return this.peek().type == TokenType.EOF;
  }

  /**
   * 
   * @returns {Token}
   */
  peek() {
    return this.tokens[this.current];
  }

  /**
   * 
   * @returns {Token}
   */
  previous() {
    return this.tokens[this.current - 1];
  }
}