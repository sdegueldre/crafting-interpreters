/**
 * @typedef {typeof import("./TokenType.js").TokenType} TokenType
 */

export class Token {
  /**
   * 
   * @param {TokenType[keyof(TokenType)]} type 
   * @param {string} lexeme 
   * @param {object} literal 
   * @param {number} line 
   */
  constructor(type, lexeme, literal, line) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString() {
    return this.type + " " + this.lexeme + " " + this.literal;
  }
}