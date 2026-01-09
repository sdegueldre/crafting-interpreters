import { readFileSync } from "fs";
import { resolve } from "path";
import { createInterface } from "readline/promises";
import { Scanner } from "./Scanner.js";
import { Token } from "./Token.js";
import { TokenType } from "./TokenType.js";
import { Parser } from "./Parser.js";
import { AstPrinter } from "./AstPrinter.js";
import { Interpreter } from "./Interpreter.js";

export class Lox {
  static hadError = false;
  static hadRuntimeError = false;
  static interpreter = new Interpreter();
  static main(args) {
    if (args.length > 1) {
      console.log("Usage: jlox [script]");
      process.exit(64);
    } else if (args.length == 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }

  static async runFile(path) {
    this.run(await readFileSync(resolve(path), "utf-8"));
    if (this.hadError) process.exit(65);
    if (this.hadRuntimeError) process.exit(70);
  }

  static async runPrompt() {
    debugger;
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    for (; ;) {
      const line = await rl.question("> ");
      if (!line) break;
      this.run(line);
      this.hadError = false;
    }
    rl.close();
  }

  static run(source) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    // Stop if there was a syntax error.
    if (this.hadError) return;

    this.interpreter.interpret(statements);
  }

  static error(...args) {
    if (args[0] instanceof Token) {
      const [token, message] = args;
      if (token.type == TokenType.EOF) {
        this.report(token.line, " at end", message);
      } else {
        this.report(token.line, " at '" + token.lexeme + "'", message);
      }
      return;
    }
    const [line, message] = args;
    this.report(line, "", message);
  }
  /**
   * 
   * @param {import('./Interpreter.js').RuntimeError} error 
   */
  static runtimeError(error) {
    console.error(error.message + "\n[line " + error.token.line + "]");
    this.hadRuntimeError = true;
  }

  static report(line, where, message) {
    console.error("[line " + line + "] Error" + where + ": " + message);
    this.hadError = true;
  }
}
