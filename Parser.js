/** @typedef {import("./Expr").Expr} Expr */
/** @typedef {import('./Token').Token} Token */

import { Assign, Binary, Call, Get, Grouping, Literal, Logical, Set, Super, This, Unary, Variable } from "./Expr.js";
import { Lox } from "./Lox.js";
import { Block, Class, Expression, Func, If, Print, Return, Stmt, Var, While } from "./Stmt.js";
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
      if (this.match(TokenType.CLASS)) return this.classDeclaration();
      if (this.match(TokenType.VAR)) return this.varDeclaration();
      if (this.match(TokenType.FUN)) return this.function("function");

      return this.statement();
    } catch (error) {
      if (!(error instanceof ParseError)) throw error;
      this.synchronize();
    }
  }
  classDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expect class name.");
    let superclass;
    if (this.match(TokenType.LESS)) {
      const identifier = this.consume(TokenType.IDENTIFIER, "Expect superclass name.");
      superclass = new Variable(identifier);
    }
    this.consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");
    const functions = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      functions.push(this.function("method"));
    }
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after body.");
    return new Class(name, superclass, functions);
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
   * @param {string} kind
   */
  function(kind) {
    const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
    this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
    const params = [];
    while (!this.check(TokenType.RIGHT_PAREN)) {
      if (params.length >= 255)
        this.error(this.peek(), "Can't have more than 255 parameters.");
      params.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."));
      if (!this.match(TokenType.COMMA)) break;
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameter list.");
    this.consume(TokenType.LEFT_BRACE, `Expect '{' after ${kind} parameters.`);

    return new Func(name, params, this.block());
  }
  /**
   * @returns {Stmt}
   */
  statement() {
    if (this.match(TokenType.FOR)) return this.for();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.WHILE)) return this.while();
    if (this.match(TokenType.LEFT_BRACE)) return new Block(this.block());

    return this.expressionStatement();
  }
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
  returnStatement() {
    const keyword = this.previous();
    let value = null;
    if (!this.check(TokenType.SEMICOLON)) value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
    return new Return(keyword, value);
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
   * @returns {Stmt[]}
   */
  block() {
    const statements = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
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
      if ((expr instanceof Variable) ) {
        return new Assign(expr.name, value);
      } else if (expr instanceof Get) {
        return new Set(expr.object, expr.name, value);
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

    return this.call();
  }
  /**
   * @returns {Expr}
   */
  call() {
    let expr = this.primary()
    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        const args = [];
        while (!this.check(TokenType.RIGHT_PAREN)) {
          if (args.length >= 255)
            this.error(this.peek(), "Can't have more than 255 arguments.");
          args.push(this.expression());
          if (!this.match(TokenType.COMMA)) break;
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.")
        expr = new Call(expr, this.previous(), args);
      } else if (this.match(TokenType.DOT)) {
          const name = this.consume(TokenType.IDENTIFIER, "Expect field name.");
          expr = new Get(expr, name);
      } else {
        break;
      }
    }
    return expr;
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

    if (this.match(TokenType.SUPER)) {
      const keyword = this.previous();
      this.consume(TokenType.DOT, "Expect '.' after 'super'.");
      const method = this.consume(TokenType.IDENTIFIER, "Expect superclass method name.");
      return new Super(keyword, method);
    }

    if (this.match(TokenType.THIS)) return new This(this.previous());
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