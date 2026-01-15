const expr = "1 ? 4 : 5";
// const expr = "- 1 + 2";

const parsers = {
  "-": {
    startExpr: unary, // unary -
    contExpr: binary, // a - b
    precedence: 2,
  },
  "+": {
    startExpr: unary, // unary +
    contExpr: binary, // a + b
    precedence: 2,
  },
  "?": {
    contExpr: ternary,
    precedence: 1,
    rightAssociative: true,
  },
  "num": {
    startExpr: number,
    // precedence: 1000,
  },
  // precedence 0 = invalid continuation of expression, terminate current expression.
  ":": { precedence: 0 },
  "eof": { precedence: 0 },
}

let curr = 0;
let prev = null;
const current = () => {
  return tokens[curr];
}
const previous = () => {
  return tokens[prev];
}
const advance = () => {
  prev = curr++;
}
const tokens = expr.split(" ").map(c => (Object.hasOwn(parsers, c) ? { type: c } : { type: "num", val: +c }));
tokens.push({ type: "eof" })
console.log(tokens);

function number() {
  return previous().val;
}

function unary() {
  const type = previous().type;
  const operand = parseExpr(200);
  switch (type) {
    case "-": return -operand;
    case "+": return +operand;
  }
}

function binary(left) {
  const type = previous().type;
  const parser = parsers[type];
  const right = parseExpr(parser.precedence + 1);
  switch (type) {
    case '+': return left + right;
    case '-': return left - right;
  }
}

function ternary(cond) {
  console.log("ternary", previous(), cond);
  // advance(); // consume ?
  const ifBranch = parseExpr(.5);
  advance(); // consume :
  const elseBranch = parseExpr(.5);
  if (cond) return ifBranch
  return elseBranch;
}

function parseCont(expr, precedence = 1) {
  while (true) {
    const parser = parsers[current().type];
    console.log("parseCont", precedence, current(), parser);
    if (!(parser.rightAssociative ? precedence < parser.precedence : precedence <= parser.precedence)) break;
    console.log("invoking");
    advance();
    expr = parser.contExpr(expr);
  }
  return expr;
}

function parseStart(/* unary assumes highest precedence */) {
  advance();
  const { startExpr } = parsers[previous().type];
  if (!startExpr) {
    console.log(previous());
    throw new Error(`Unexpected token '${previous().lexeme}'`);
    return null;
  }
  return startExpr();
}

function parseExpr(precedence = .5) {
  let expr = parseStart();
  console.log("parseStart", expr);
  return parseCont(expr, precedence);
}

function parse() {
  const res = parseExpr();
  console.log(current());
  if (current().type !== "eof") throw new Error("Expected end of expression");
  return res;
}

console.log(parse());