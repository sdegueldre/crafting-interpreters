/** @typedef {import("./Token").Token} Token */
/** @typedef {import("./Expr").Expr} Expr */

export class Stmt {
  /**
   * @returns {any}
   */
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
 
export class Class extends Stmt {
  /**
   @param {Token} name
   @param {Func[]} methods
   */
  constructor(name, methods) {
    super();
    this.name = name;
    this.methods = methods;
  }

  accept(visitor) {
    return visitor.visitClassStmt(this);
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
 
export class Func extends Stmt {
  /**
   @param {Token} name
   @param {Token[]} params
   @param {Stmt[]} body
   */
  constructor(name, params, body) {
    super();
    this.name = name;
    this.params = params;
    this.body = body;
  }

  accept(visitor) {
    return visitor.visitFuncStmt(this);
  }
}
 
export class If extends Stmt {
  /**
   @param {Expr} condition
   @param {Stmt} thenBranch
   @param {Stmt} elseBranch
   */
  constructor(condition, thenBranch, elseBranch) {
    super();
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  accept(visitor) {
    return visitor.visitIfStmt(this);
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
 
export class Return extends Stmt {
  /**
   @param {Token} keyword
   @param {Expr} value
   */
  constructor(keyword, value) {
    super();
    this.keyword = keyword;
    this.value = value;
  }

  accept(visitor) {
    return visitor.visitReturnStmt(this);
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
 
export class While extends Stmt {
  /**
   @param {Expr} condition
   @param {Stmt} body
   */
  constructor(condition, body) {
    super();
    this.condition = condition;
    this.body = body;
  }

  accept(visitor) {
    return visitor.visitWhileStmt(this);
  }
}
