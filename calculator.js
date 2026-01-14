/**
 * This is an experiment in precedence-based parsing.
 */
const operators = {
  '+': [1, (t, a, b) => a + b],
  '-': [1, (t, a, b) => a - b],
  '*': [2, (t, a, b) => a * b],
  '/': [2, (t, a, b) => a / b],
  '^': [3, (t, a, b) => a ** b, "right"],
  'literal': [1000, (t) => +t],
};

const expressions = [
  ["4 / 2 / 2", 1], // left-associative: (4/2)/2 = 2/2 = 1 (not 4/1 = 4)
  ["2 ^ 2 ^ 3", 256], // right-associative: 2^(2^3) = 2^8 = 256 (not 4^3 = 64)
];

for (const [expression, expected] of expressions) {
  const val = evaluate(expression);
  console.assert(val === expected, "Got", val);
}

function tokenType(token) {
  return (token in operators) ? token : 'literal';
}

function evaluate(expression) {
  const tokens = expression.split(" ");
  const valueStack = [];
  const operatorStack = [];
  const applyOp = () => {
    const opToken = operatorStack.pop();
    const currentOp = operators[tokenType(opToken)][1];
    const nbArgs = currentOp.length - 1;
    const args = nbArgs ? valueStack.splice(-nbArgs) : [];
    valueStack.push(currentOp(opToken, ...args));
  }

  const evalLeft = (opPrec) => {
    if (!operatorStack.length) return 0;
    const [leftPrec, op, associativity] = operators[tokenType(operatorStack.at(-1))];
    if (associativity === "right") return leftPrec > opPrec;
    return leftPrec >= opPrec;
  };
  for (const token of tokens) {
    const [prec] = operators[tokenType(token)];

    while (evalLeft(prec)) {
      applyOp();
    }
    operatorStack.push(token)
  }
  while (operatorStack.length) {
    applyOp();
  }
  console.assert(valueStack.length === 1, "Stack should contain exactly 1 value at the end");
  return valueStack.pop();
}
