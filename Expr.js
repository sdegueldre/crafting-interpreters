/** @typedef {import("./Token").Token} Token */

export class Expr {
  accept(visitor) {
    throw new Error("Cannot invoke accept on abstract class 'Expr'");
  }
}

export class Binary extends Expr {
  /**
   @param {Expr} left
   @param {Token} operator
   @param {Expr} right
   */
  constructor(left, operator, right) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept(visitor) {
    return visitor.visitBinaryExpr(this);
  }
}
 
export class Grouping extends Expr {
  /**
   @param {Expr} expression
   */
  constructor(expression) {
    super();
    this.expression = expression;
  }

  accept(visitor) {
    return visitor.visitGroupingExpr(this);
  }
}
 
export class Literal extends Expr {
  /**
   @param {object} value
   */
  constructor(value) {
    super();
    this.value = value;
  }

  accept(visitor) {
    return visitor.visitLiteralExpr(this);
  }
}
 
export class Unary extends Expr {
  /**
   @param {Token} operator
   @param {Expr} right
   */
  constructor(operator, right) {
    super();
    this.operator = operator;
    this.right = right;
  }

  accept(visitor) {
    return visitor.visitUnaryExpr(this);
  }
}
 
export class Variable extends Expr {
  /**
   @param {Token} name
   */
  constructor(name) {
    super();
    this.name = name;
  }

  accept(visitor) {
    return visitor.visitVariableExpr(this);
  }
}
 
export class Assign extends Expr {
  /**
   @param {Token} name
   @param {Expr} value
   */
  constructor(name, value) {
    super();
    this.name = name;
    this.value = value;
  }

  accept(visitor) {
    return visitor.visitAssignExpr(this);
  }
}
