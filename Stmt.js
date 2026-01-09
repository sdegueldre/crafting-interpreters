/** @typedef {import("./Expr").Expr} Expr */
/** @typedef {import("./Token").Token} Token */

export class Stmt {
  accept(visitor) {
    throw new Error("Cannot invoke accept on abstract class 'Stmt'");
  }
}

export class Block extends Stmt {
  /**
   @param {Stmt[]} statements
   */
  constructor(statements) {
    super();
    this.statements = statements;
  }

  accept(visitor) {
    return visitor.visitBlockStmt(this);
  }
}
 
export class Expression extends Stmt {
  /**
   @param {Expr} expression
   */
  constructor(expression) {
    super();
    this.expression = expression;
  }

  accept(visitor) {
    return visitor.visitExpressionStmt(this);
  }
}
 
export class Print extends Stmt {
  /**
   @param {Expr} expression
   */
  constructor(expression) {
    super();
    this.expression = expression;
  }

  accept(visitor) {
    return visitor.visitPrintStmt(this);
  }
}
 
export class Var extends Stmt {
  /**
   @param {Token} name
   @param {Expr} initializer
   */
  constructor(name, initializer) {
    super();
    this.name = name;
    this.initializer = initializer;
  }

  accept(visitor) {
    return visitor.visitVarStmt(this);
  }
}
