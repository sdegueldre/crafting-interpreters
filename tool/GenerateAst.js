import { writeFileSync } from "fs";
import { basename, join, resolve } from "path";

const args = process.argv.slice(2);
if (args.length != 1) {
  console.error("Usage: generate_ast <output directory>");
  process.exit(64);
}
const outputDir = args[0];
const EXPRESSION_TYPES = {
  Binary: [["Expr", "left"], ["Token", "operator"], ["Expr", "right"]],
  Call: [["Expr", "callee"], ["Token", "paren"], ["Expr[]", "args"]],
  Get: [["Expr", "object"], ["Token", "name"]],
  Grouping: [["Expr", "expression"]],
  Literal: [["object", "value"]],
  Unary: [["Token", "operator"], ["Expr", "right"]],
  Variable: [["Token", "name"]],
  This: [["Token", "keyword"]],
  Super: [["Token", "keyword"], ["Token", "method"]],
  Assign: [["Token", "name"], ["Expr", "value"]],
  Set: [["Expr", "object"], ["Token", "name"], ["Expr", "value"]],
  Logical: [["Expr", "left"], ["Token", "operator"], ["Expr", "right"]],
};

const STATEMENT_TYPES = {
  Block: [["Stmt[]", "statements"]],
  Class: [["Token", "name"], ["Variable", "superclass"], ["Func[]", "methods"]],
  Expression: [["Expr", "expression"]],
  Func: [["Token", "name"], ["Token[]", "params"], ["Stmt[]", "body"]],
  If: [["Expr", "condition"], ["Stmt", "thenBranch"], ["Stmt", "elseBranch"]],
  Print: [["Expr", "expression"]],
  Return: [["Token", "keyword"], ["Expr", "value"]],
  Var: [["Token", "name"], ["Expr", "initializer"]],
  While: [["Expr", "condition"], ["Stmt", "body"]],
}

/**
 * 
 * @param {*} className 
 * @param {*} fields 
 * @returns 
 */
function defineClass(baseName, className, fields) {
  return `
export class ${className} extends ${baseName} {
  /**
${fields.map(([type, name]) => `   * @param {${type}} ${name}`).join("\n")}
   */
  constructor(${fields.map(f => f[1]).join(", ")}) {
    super();
${fields.map(([type, fname]) => `    this.${fname} = ${fname};`).join("\n")}
  }

  accept(visitor) {
    return visitor.visit${className}${baseName}(this);
  }
}`;
}

const typeImports = {
  Token: `/** @typedef {import("./Token").Token} Token */`,
  Expr: `/** @typedef {import("./Expr").Expr} Expr */`,
  Variable: `/** @typedef {import("./Expr").Variable} Variable */`,
}

function defineAst(baseName, types) {
  const path = resolve(join(outputDir, baseName + ".js"));
  const imports = [];
  const seen = new Set();
  for (const [typeName] of Object.values(types).flat()) {
    console.log({ typeName })
    if (!seen.has(typeName) && typeName in typeImports && typeName !== baseName) {
      seen.add(typeName);
      imports.push(typeImports[typeName]);
    }
  }

  const file = `${imports.join("\n")}

export class ${baseName} {
  /**
   * @returns {any}
   */
  accept(visitor) {
    throw new Error("Cannot invoke accept on abstract class '${baseName}'");
  }
}
${Object.entries(types).map(([name, fields]) => defineClass(baseName, name, fields)).join("\n ")}
`;
  writeFileSync(path, file);
}

defineAst("Expr", EXPRESSION_TYPES);
defineAst("Stmt", STATEMENT_TYPES);
