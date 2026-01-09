export class AstPrinter {
  /**
   * @param {import('./Expr').Expr} expr 
   * @returns 
   */
  print(expr) {
    return expr.accept(this);
  }

  /**
   * @param {string} name 
   * @param  {import('./Expr').Expr[]} exprs 
   * @returns 
   */
  parenthesize(name, ...exprs) {
    return `(${name} ${exprs.map(e => e.accept(this)).join(" ")})`
  }

  /**
   * @param {import('./Expr').Binary} expr 
   * @returns 
   */
  visitBinaryExpr(expr) {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  /**
   * @param {import('./Expr').Grouping} expr 
   * @returns 
   */
  visitGroupingExpr(expr) {
    return this.parenthesize("group", expr.expression);
  }

  /**
   * @param {import('./Expr').Literal} expr 
   * @returns 
   */
  visitLiteralExpr(expr) {
    if (expr.value == null) return "nil";
    return expr.value.toString();
  }

  /**
   * @param {import('./Expr').Unary} expr 
   * @returns 
   */
  visitUnaryExpr(expr) {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }
}
