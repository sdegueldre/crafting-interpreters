import { Lox } from "./Lox.js";
import { Token } from "./Token.js";
import { TokenType } from "./TokenType.js";

const keywords = /** @type {const} */ ({
    and: TokenType.AND,
    class: TokenType.CLASS,
    else: TokenType.ELSE,
    false: TokenType.FALSE,
    for: TokenType.FOR,
    fun: TokenType.FUN,
    if: TokenType.IF,
    nil: TokenType.NIL,
    or: TokenType.OR,
    print: TokenType.PRINT,
    return: TokenType.RETURN,
    super: TokenType.SUPER,
    this: TokenType.THIS,
    true: TokenType.TRUE,
    var: TokenType.VAR,
    while: TokenType.WHILE,
});

export class Scanner {
  /** @type {Token[]} */
  tokens = [];
  start = 0;
  current = 0;
  line = 1;

  /**
   * 
   * @param {string} source 
   */
  constructor(source) {
    this.source = source;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      // We are at the beginning of the next lexeme.
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    return this.tokens;
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  scanToken() {
    const c = this.advance();
    switch (c) {
      case '(': this.addToken(TokenType.LEFT_PAREN); break;
      case ')': this.addToken(TokenType.RIGHT_PAREN); break;
      case '{': this.addToken(TokenType.LEFT_BRACE); break;
      case '}': this.addToken(TokenType.RIGHT_BRACE); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case '.': this.addToken(TokenType.DOT); break;
      case '-': this.addToken(TokenType.MINUS); break;
      case '+': this.addToken(TokenType.PLUS); break;
      case ';': this.addToken(TokenType.SEMICOLON); break;
      case '*': this.addToken(TokenType.STAR); break;
      case '!':
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case '=':
        this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case '>':
        this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;
      case '/':
        if (this.match('/')) {
          // A comment goes until the end of the line.
          while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;

      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace.
        break;

      case '\n':
        this.line++;
        break;

      case '"': this.string(); break;

      default:
        if (isDigit(c)) {
          this.number();
        } else if (isAlpha(c)) {
          this.identifier();

        } else {
          Lox.error(this.line, "Unexpected character.");
        }
        break;
    }
  }
  identifier() {
    while (isAlphaNumeric(this.peek())) this.advance();
    const text = this.source.slice(this.start, this.current);
    const type = keywords[text] ?? TokenType.IDENTIFIER;
    this.addToken(type);
  }

  number() {
    while (isDigit(this.peek())) this.advance();

    // Look for a fractional part.
    // @ts-ignore
    if (this.peek() === '.' && isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (isDigit(this.peek())) this.advance();
    }

    this.addToken(TokenType.NUMBER,
      parseFloat(this.source.slice(this.start, this.current)));
  }

  string() {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      Lox.error(this.line, "Unterminated string.");
      return;
    }

    // The closing ".
    this.advance();

    // Trim the surrounding quotes.
    const value = this.source.slice(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  /**
   * 
   * @param {string} expected 
   * @returns 
   */
  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;

    this.current++;
    return true;
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

  advance() {
    return this.source.charAt(this.current++);
  }

  /**
   * 
   * @param {keyof(typeof TokenType)} type
   * @param {object} literal
   */
  addToken(type, literal = null) {
    const text = this.source.slice(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }
}

/**
 * 
 * @param {string} c 
 */
function isDigit(c) {
  const code = c.charCodeAt(0);
  return code >= '0'.charCodeAt(0) && code <= '9'.charCodeAt(0);
}

function isAlpha(c) {
  const code = c.charCodeAt(0);
  return code >= 'a'.charCodeAt(0) && code <= 'z'.charCodeAt(0) ||
    code >= 'A'.charCodeAt(0) && code <= 'Z'.charCodeAt(0) || c === '_';
}

function isAlphaNumeric(c) {
  return isAlpha(c) || isDigit(c);
}

