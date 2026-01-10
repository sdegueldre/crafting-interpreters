export class AstPrinter {
  indent = 0;
  /**
   * @param {{accept(visitor: AstPrinter)}} ast 
   */
  print(ast) {
    return ast.accept(this);
  }

  /**
   * @param {string} name 
   * @param  {import('./Expr').Expr[]} exprs 
   */
  parenthesize(name, ...exprs) {
    return `(${name} ${exprs.map(e => e.accept(this)).join(" ")})`
  }

  /**
   * @param {import('./Expr').Binary} expr 
   */
  visitBinaryExpr(expr) {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  /**
   * @param {import('./Expr').Grouping} expr 
   */
  visitGroupingExpr(expr) {
    return this.parenthesize("group", expr.expression);
  }

  /**
   * @param {import('./Expr').Literal} expr 
   */
  visitLiteralExpr(expr) {
    if (expr.value == null) return "nil";
    if (typeof expr.value === "string") return `"${expr.value.replaceAll('"', '\\"')}"`;
    return expr.value.toString();
  }

  /**
   * @param {import('./Expr').Unary} expr 
   */
  visitUnaryExpr(expr) {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }
  /**
   * @param {import('./Expr').Variable} expr 
   */
  visitVariableExpr(expr) {
    return expr.name.lexeme;
  }
  /**
   * @param {import('./Expr').This} expr 
   */
  visitThisExpr(expr) {
    return expr.keyword.lexeme;
  }
  /**
   * @param {import('./Expr').Super} expr 
   */
  visitSuperExpr(expr) {
    return `${expr.keyword.lexeme}.${expr.method.lexeme}`;
  }
  /**
   * @param {import('./Expr').Assign} expr 
   */
  visitAssignExpr(expr) {
    return this.parenthesize(`${expr.name.lexeme} =`, expr.value);
  }
  /**
   * @param {import('./Expr').Call} expr 
   */
  visitCallExpr(expr) {
    return `${expr.callee.accept(this)}(${expr.args.map(a => a.accept(this)).join(", ")})`;
  }
  /**
   * @param {import('./Expr').Get} expr 
   */
  visitGetExpr(expr) {
    return `${expr.object.accept(this)}.${expr.name.lexeme}`;
  }
  /**
   * @param {import('./Expr').Set} expr 
   */
  visitSetExpr(expr) {
    return `${expr.object.accept(this)}.${expr.name.lexeme} = ${expr.value.accept(this)}`;
  }
  /**
   * @param {import('./Stmt').Var} stmt 
   */
  visitVarStmt(stmt) {
    const str = `var ${stmt.name.lexeme}`
    if (!stmt.initializer) return str;
    return `${str} = ${stmt.initializer.accept(this)}`;
  }
  /**
   * @param {import('./Stmt').While} stmt 
   */
  visitWhileStmt(stmt) {
    return `while ${stmt.condition.accept(this)} ${stmt.body.accept(this)}`;
  }
  /**
   * @param {import('./Stmt').If} stmt 
   */
  visitIfStmt(stmt) {
    const text = `if ${stmt.condition.accept(this)} ${stmt.thenBranch.accept(this)}`;
    if (stmt.elseBranch) {
      return text + ` else ${stmt.elseBranch.accept(this)}`;
    }
    return text;
  }
  /**
   * @param {import('./Stmt').Stmt[]} statements 
   */
  block(statements) {
    this.indent++;
    const lines = statements.map(s => " ".repeat(this.indent * 2) + s.accept(this));
    this.indent--;
    return `{\n${lines.join("\n")}\n${" ".repeat(this.indent * 2)}}`;
  }
  /**
   * @param {import('./Stmt').Block} stmt 
   */
  visitBlockStmt(stmt) {
    return this.block(stmt.statements);
  }
  /**
   * @param {import('./Stmt').Expression} stmt 
   */
  visitExpressionStmt(stmt) {
    return stmt.expression.accept(this);
  }
  /**
   * @param {import('./Stmt').Print} stmt 
   */
  visitPrintStmt(stmt) {
    return `print ${stmt.expression.accept(this)}`;
  }
  /**
   * @param {import('./Stmt').Func} stmt 
   */
  visitFuncStmt(stmt) {
    return `fun ${stmt.name.lexeme} (${stmt.params.map(p => p.lexeme).join(", ")}) ${this.block(stmt.body)}`;
  }
  /**
   * @param {import('./Stmt').Return} stmt 
   */
  visitReturnStmt(stmt) {
    if (!stmt.value) return `return`;
    return `return ${stmt.value.accept(this)}`;
  }
  /**
   * @param {import('./Stmt').Class} stmt 
   */
  visitClassStmt(stmt) {
    return `class ${stmt.name.lexeme} ${this.block(stmt.methods)}`;
  }
}
