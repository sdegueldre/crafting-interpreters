export class AstPrinter {
  indent = 0;
  /**
   * @param {{accept(visitor: AstPrinter)}} ast 
   * @returns 
   */
  print(ast) {
    return ast.accept(this);
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
  /**
   * @param {import('./Expr').Variable} expr 
   * @returns 
   */
  visitVariableExpr(expr) {
    return expr.name.lexeme;
  }
  /**
   * @param {import('./Expr').Assign} expr 
   * @returns 
   */
  visitAssignExpr(expr) {
    return this.parenthesize(`${expr.name.lexeme} =`, expr.value);
  }
  /**
   * @param {import('./Stmt').Var} stmt 
   * @returns 
   */
  visitVarStmt(stmt) {
    const str = `var ${stmt.name.lexeme}`
    if (!stmt.initializer) return str;
    return `${str} = ${stmt.initializer.accept(this)}`;
  }
  /**
   * @param {import('./Stmt').While} stmt 
   * @returns 
   */
  visitWhileStmt(stmt) {
    return `while ${stmt.condition.accept(this)} ${stmt.body.accept(this)}`;
  }
  /**
   * @param {import('./Stmt').Block} stmt 
   * @returns 
   */
  visitBlockStmt(stmt) {
    this.indent++;
    const lines = stmt.statements.map(s => " ".repeat(this.indent * 2) + s.accept(this));
    this.indent--;
    return `{\n${lines.join("\n")}\n${" ".repeat(this.indent * 2)}}`;
  }
  /**
   * @param {import('./Stmt').Expression} stmt 
   * @returns 
   */
  visitExpressionStmt(stmt) {
    return stmt.expression.accept(this);
  }
  /**
   * @param {import('./Stmt').Print} stmt 
   * @returns 
   */
  visitPrintStmt(stmt) {
    return `print ${stmt.expression.accept(this)}`;
  }
}
