import { CHALLENGES } from './challenges';

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'a', 'e', 'i', 'o', 'u']);

export function isUpper(char: string) { return char >= 'A' && char <= 'Z'; }
export function isLower(char: string) { return char >= 'a' && char <= 'z'; }
export function isLetter(char: string) { return isUpper(char) || isLower(char); }
export function isDigit(char: string) { return char >= '0' && char <= '9'; }

/** Printable ASCII that is neither a letter nor a digit. Space and other Unicode are not special. */
export function isSpecial(char: string) {
  const code = char.charCodeAt(0);
  return code >= 33 && code <= 126 && !isLetter(char) && !isDigit(char);
}

export function digitsOf(value: string) { return [...value].filter(isDigit); }
export function sumDigits(chars: string[]) { return chars.reduce((sum, char) => sum + Number(char), 0); }
export function productDigits(chars: string[]) { return chars.reduce((product, char) => product * Number(char), 1); }

export function isPrime(value: number) {
  if (!Number.isInteger(value) || value < 2) return false;
  for (let factor = 2; factor * factor <= value; factor += 1) if (value % factor === 0) return false;
  return true;
}

export function isPerfectSquare(value: number) {
  if (!Number.isInteger(value) || value < 0) return false;
  const root = Math.round(Math.sqrt(value));
  return root * root === value;
}

function outsideToken(value: string, token: string) {
  const at = value.indexOf(token);
  if (at < 0) return null;
  return value.slice(0, at) + value.slice(at + token.length);
}

function passes(id: number, value: string): Record<string, boolean> {
  const chars = [...value];
  const digits = digitsOf(value);
  const uppers = chars.filter(isUpper);
  const lowers = chars.filter(isLower);
  const specials = chars.filter(isSpecial);
  if (id === 1) return {
    length: value.length === 8,
    upper: uppers.length === 2,
    'digit-sum': sumDigits(digits) === 15,
    end: value.endsWith('!'),
  };
  if (id === 2) {
    const runs = value.match(/\d+/g) ?? [];
    const pair = runs.length === 1 && runs[0].length === 2 ? Number(runs[0]) : NaN;
    const seen = new Set<string>();
    const repeated = chars.filter(isLetter).some(char => {
      const key = char.toLowerCase();
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
    return {
      length: value.length >= 6 && value.length <= 9,
      'prime-pair': isPrime(pair),
      letters: !repeated,
      end: value.endsWith('#'),
    };
  }
  if (id === 3) {
    const ordered = lowers.every((char, index) => index === 0 || lowers[index - 1] < char);
    return {
      length: value.length === 7,
      digits: digits.length === 3,
      product: digits.length === 3 && productDigits(digits) === 24,
      letters: lowers.length === 3 && ordered,
      special: specials.length === 1,
    };
  }
  if (id === 4) {
    const palindrome = chars.some((char, index) => index + 2 < chars.length && [char, chars[index + 1], chars[index + 2]].every(isLetter) && char === chars[index + 2]);
    return {
      length: value.length === 7,
      palindrome,
      digits: new Set(digits).size === 2,
      dollar: value.includes('$'),
    };
  }
  if (id === 5) return {
    length: value.length === 8,
    binary: chars.every(char => char === '0' || char === '1'),
    ones: chars.filter(char => char === '1').length === 5,
    ends: value.startsWith('1') && value.endsWith('0'),
  };
  if (id === 6) {
    const head = chars.slice(0, 4);
    const tail = chars.slice(4);
    return {
      length: value.length === 6,
      letters: head.length === 4 && head.every(isLower) && new Set(head).size === 4 && head.every((char, index) => index === 0 || head[index - 1] < char),
      digits: tail.length === 2 && tail.every(isDigit) && sumDigits(tail) === 13,
    };
  }
  if (id === 7) {
    const middle = chars.slice(3, -1);
    return {
      length: value.length === 8,
      prefix: value.startsWith('XIV'),
      digits: digits.length === 2 && productDigits(digits) === 18,
      end: value.endsWith('@'),
      rest: value.startsWith('XIV') && value.endsWith('@') && middle.every(char => isDigit(char) || isLower(char)),
    };
  }
  if (id === 8) {
    const even = digits.filter(char => Number(char) % 2 === 0).length;
    return {
      length: value.length === 4 && chars.every(isDigit),
      distinct: new Set(digits).size === 4 && digits.length === 4,
      parity: digits.length === 4 && even === 2,
      sum: digits.length === 4 && sumDigits(digits) === 18,
    };
  }
  if (id === 9) {
    const match = /^(\d\d)@(\d\d)$/.exec(value);
    const left = match ? Number(match[1]) : NaN;
    const right = match ? Number(match[2]) : NaN;
    return {
      format: match !== null,
      primes: isPrime(left) && isPrime(right),
      gap: Math.abs(left - right) === 6,
    };
  }
  if (id === 10) return {
    length: value.length === 7,
    palindrome: value.length > 0 && value === [...value].reverse().join(''),
    digit: digits.length > 0,
    upper: uppers.length > 0,
  };
  if (id === 11) return {
    length: value.length === 12,
    gdg: value.includes('GDG'),
    specials: new Set(specials).size >= 2,
    sum: sumDigits(digits) === 15,
  };
  if (id === 12) {
    const rest = outsideToken(value, 'N7SEC');
    const extra = rest === null ? [] : digitsOf(rest);
    return {
      length: value.length === 14,
      token: rest !== null,
      'extra-digits': extra.length === 3,
      specials: new Set(specials).size >= 2,
      sum: sumDigits(digits) === 20,
    };
  }
  if (id === 13) {
    const match = /^([A-Z]{2})(\d\d)-([A-Z]{2})(\d\d)$/.exec(value);
    const letters = match ? [...match[1], ...match[3]] : [];
    return {
      format: match !== null,
      letters: new Set(letters).size === 4,
      sums: match !== null && sumDigits([...match[2]]) === sumDigits([...match[4]]),
    };
  }
  if (id === 14) {
    const match = /^(\d)(\d)(\d)(\d)(\d)!$/.exec(value);
    const five = match ? [match[1], match[2], match[3], match[4], match[5]] : [];
    const checksum = five.length === 5 ? sumDigits(five.slice(0, 4)) % 10 : NaN;
    return {
      format: match !== null,
      check: five[4] === String(checksum),
      variety: new Set(five).size > 1,
    };
  }
  if (id === 15) {
    const match = /^([A-Z])([A-Z])([A-Z])@\3\2\1$/.exec(value);
    const letters = match ? [match[1], match[2], match[3]] : [];
    return {
      format: match !== null,
      distinct: new Set(letters).size === 3,
      vowel: VOWELS.has(letters[1] ?? ''),
    };
  }
  if (id === 16) {
    const match = /^(\d\d)#(\d\d)!$/.exec(value);
    const left = match ? Number(match[1]) : NaN;
    const right = match ? Number(match[2]) : NaN;
    return {
      format: match !== null,
      squares: isPerfectSquare(left) && isPerfectSquare(right),
      gap: Math.abs(left - right) === 20,
    };
  }
  if (id === 17) {
    const match = /^([A-Z])(\d)(\d)(\d)!$/.exec(value);
    const three = match ? [match[2], match[3], match[4]] : [];
    const increasing = three.length === 3 && three[0] < three[1] && three[1] < three[2];
    return {
      format: match !== null,
      order: increasing,
      sum: three.length === 3 && sumDigits(three) === 15,
      product: three.length === 3 && productDigits(three) % 2 === 0,
    };
  }
  if (id === 18) {
    const match = /^([a-z]{6})(\d)(\d)#$/.exec(value);
    const letters = match ? [...match[1]] : [];
    const alternate = letters.every((char, index) => (index % 2 === 0) === VOWELS.has(char));
    return {
      format: match !== null,
      letters: letters.length === 6,
      alternate,
      ends: letters.length === 6 && letters[0] !== letters[5],
      digits: match !== null && match[2] !== match[3],
      sum: match !== null && Number(match[2]) + Number(match[3]) === 11,
    };
  }
  if (id === 19) {
    const match = /^([1-9])([1-9])([1-9])([1-9])!$/.exec(value);
    const [a, b, c, d] = match ? [match[1], match[2], match[3], match[4]].map(Number) : [];
    return {
      format: match !== null,
      range: match !== null && new Set([a, b, c, d]).size === 4,
      equation: a !== undefined && a + b === c * d,
      order: a !== undefined && a > b && c < d,
    };
  }
  const rest = outsideToken(value, 'N7SEC');
  return {
    length: value.length === 14,
    gdg: value.includes('GDG'),
    token: rest !== null,
    specials: new Set(specials).size === 2,
    end: value.endsWith('!'),
    sum: sumDigits(digits) === 16,
  };
}

export function evaluate(id: number, value: string) {
  const challenge = CHALLENGES.find(item => item.id === id);
  if (!challenge) return [];
  const result = passes(id, value);
  return challenge.rules.map(rule => ({ ...rule, pass: result[rule.id] === true }));
}

export function isValid(id: number, value: string) {
  const result = evaluate(id, value);
  return result.length > 0 && result.every(rule => rule.pass);
}
