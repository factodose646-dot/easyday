export interface CalcEvalResult {
  ok: boolean;
  value?: number;
  formatted?: string;
  errorKey?: 'divideByZero' | 'invalidExpression' | 'overflow';
}

export interface CalcHistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export function formatCalcNumber(num: number): string {
  if (!Number.isFinite(num)) return '0';
  if (Object.is(num, -0)) return '0';
  // Clean floating point artifacts like 0.1 + 0.2 = 0.30000000000000004
  const rounded = Number(num.toPrecision(12));
  if (Math.abs(rounded) >= 1e12 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-9)) {
    return rounded.toExponential(6).replace(/\.?0+e/, 'e');
  }
  return String(rounded);
}

type Token =
  | { type: 'num'; value: number; isPercent: boolean }
  | { type: 'op'; value: '+' | '-' | '*' | '/' };

function tokenize(raw: string): Token[] | null {
  const expr = raw.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  if (!expr) return null;

  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];
    const expectNumber =
      tokens.length === 0 || tokens[tokens.length - 1].type === 'op';

    if (
      expectNumber &&
      (ch === '-' || ch === '+' || (ch >= '0' && ch <= '9') || ch === '.')
    ) {
      let numStr = '';
      if (ch === '-' || ch === '+') {
        numStr += ch;
        i++;
      }
      let hasDigit = false;
      let hasDot = false;
      while (i < expr.length) {
        const c = expr[i];
        if (c >= '0' && c <= '9') {
          hasDigit = true;
          numStr += c;
          i++;
        } else if (c === '.' && !hasDot) {
          hasDot = true;
          numStr += c;
          i++;
        } else {
          break;
        }
      }
      if (!hasDigit) return null;

      let isPercent = false;
      if (i < expr.length && expr[i] === '%') {
        isPercent = true;
        i++;
      }

      const value = Number(numStr);
      if (Number.isNaN(value)) return null;
      tokens.push({ type: 'num', value, isPercent });
    } else if (
      !expectNumber &&
      (ch === '+' || ch === '-' || ch === '*' || ch === '/')
    ) {
      tokens.push({ type: 'op', value: ch });
      i++;
    } else {
      return null;
    }
  }

  if (tokens.length === 0 || tokens[tokens.length - 1].type === 'op') {
    return null;
  }

  return tokens;
}

/**
 * Evaluates arithmetic expressions with decimal & standard calculator percentage semantics.
 * Example: 200 + 10% => 220; 200 - 10% => 180; 200 * 10% => 20; 50% => 0.5
 */
export function evaluateExpression(raw: string): CalcEvalResult {
  const tokens = tokenize(raw);
  if (!tokens) {
    return { ok: false, errorKey: 'invalidExpression' };
  }

  // Handle single percentage value: e.g. "50%" -> 0.5
  if (tokens.length === 1 && tokens[0].type === 'num') {
    const val = tokens[0].isPercent ? tokens[0].value / 100 : tokens[0].value;
    if (!Number.isFinite(val)) return { ok: false, errorKey: 'overflow' };
    return { ok: true, value: val, formatted: formatCalcNumber(val) };
  }

  // Resolve percentages in left-to-right standard calculator order:
  // For A (+|-) B%, B% becomes A * (B / 100). For A (*|/) B%, B% becomes (B / 100).
  // First pass: resolve * and / precedence, resolving % relative to left operand for +/- or directly for */.
  const resolved: (number | '+' | '-' | '*' | '/')[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === 'op') {
      resolved.push(tok.value);
      continue;
    }

    if (!tok.isPercent) {
      resolved.push(tok.value);
      continue;
    }

    // Percentage token
    if (i >= 2) {
      const prevOp = resolved[resolved.length - 1];
      const prevVal = resolved[resolved.length - 2];
      if ((prevOp === '+' || prevOp === '-') && typeof prevVal === 'number') {
        // Check if prevVal isn't part of higher precedence later; for 2-term/standard use left base
        resolved.push((prevVal * tok.value) / 100);
        continue;
      }
    }
    resolved.push(tok.value / 100);
  }

  // Pass 1: * and /
  const addSubStack: (number | '+' | '-')[] = [];
  let idx = 0;
  while (idx < resolved.length) {
    const item = resolved[idx];
    if (item === '*' || item === '/') {
      const left = addSubStack.pop();
      const right = resolved[idx + 1];
      if (typeof left !== 'number' || typeof right !== 'number') {
        return { ok: false, errorKey: 'invalidExpression' };
      }
      if (item === '/' && right === 0) {
        return { ok: false, errorKey: 'divideByZero' };
      }
      const res = item === '*' ? left * right : left / right;
      if (!Number.isFinite(res)) {
        return { ok: false, errorKey: 'overflow' };
      }
      addSubStack.push(res);
      idx += 2;
    } else {
      addSubStack.push(item);
      idx += 1;
    }
  }

  // Pass 2: + and -
  let total = addSubStack[0];
  if (typeof total !== 'number') {
    return { ok: false, errorKey: 'invalidExpression' };
  }
  for (let j = 1; j < addSubStack.length; j += 2) {
    const op = addSubStack[j];
    const rhs = addSubStack[j + 1];
    if ((op !== '+' && op !== '-') || typeof rhs !== 'number') {
      return { ok: false, errorKey: 'invalidExpression' };
    }
    total = op === '+' ? total + rhs : total - rhs;
  }

  if (!Number.isFinite(total)) {
    return { ok: false, errorKey: 'overflow' };
  }

  return {
    ok: true,
    value: total,
    formatted: formatCalcNumber(total),
  };
}
