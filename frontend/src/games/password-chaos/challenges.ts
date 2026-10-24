import type { Challenge } from './types';

const hard = (bonus = 2, base = 2) => ({ tier: 'HARD' as const, base, bonus });
const expert = { tier: 'EXPERT' as const, base: 4, bonus: 4 };

export const CHALLENGES: Challenge[] = [
  {
    id: 1, title: 'Digital Equation', seconds: 30, ...hard(), length: { exact: 8 },
    rules: [
      { id: 'length', label: 'Exactly 8 characters.' },
      { id: 'upper', label: 'Exactly 2 uppercase letters.' },
      { id: 'digit-sum', label: 'Sum of all numeric digits = 15.' },
      { id: 'end', label: 'Must end with "!".' },
    ],
  },
  {
    id: 2, title: 'Prime Hunter', seconds: 35, ...hard(), length: { min: 6, max: 9 },
    rules: [
      { id: 'length', label: 'Between 6 and 9 characters.' },
      { id: 'prime-pair', label: 'Exactly 2 consecutive digits forming a two-digit prime.' },
      { id: 'letters', label: 'No repeated alphabetic character, case-insensitive.' },
      { id: 'end', label: 'Must end with "#".' },
    ],
  },
  {
    id: 3, title: 'Product 24', seconds: 35, ...hard(), length: { exact: 7 },
    rules: [
      { id: 'length', label: 'Exactly 7 characters.' },
      { id: 'digits', label: 'Exactly 3 numeric digits.' },
      { id: 'product', label: 'Product of the 3 digits = 24.' },
      { id: 'letters', label: 'Contains exactly 3 lowercase letters occurring in strictly alphabetical order.' },
      { id: 'special', label: 'Exactly one special character.' },
    ],
  },
  {
    id: 4, title: 'Palindrome Lock', seconds: 40, ...hard(), length: { exact: 7 },
    rules: [
      { id: 'length', label: 'Exactly 7 characters.' },
      { id: 'palindrome', label: 'Contains a consecutive three-letter palindrome.' },
      { id: 'digits', label: 'Exactly 2 different numeric digits.' },
      { id: 'dollar', label: 'Contains "$".' },
    ],
  },
  {
    id: 5, title: 'Binary Puzzle', seconds: 27, ...hard(), length: { exact: 8 },
    rules: [
      { id: 'length', label: 'Exactly 8 characters.' },
      { id: 'binary', label: 'Only "0" and "1" allowed.' },
      { id: 'ones', label: 'Exactly five "1" characters.' },
      { id: 'ends', label: 'Must start with "1" and end with "0".' },
    ],
  },
  {
    id: 6, title: 'Alphabet Cipher', seconds: 30, ...hard(), length: { exact: 6 },
    rules: [
      { id: 'length', label: 'Exactly 6 characters.' },
      { id: 'letters', label: 'First four characters are distinct lowercase letters in strictly increasing alphabetical order.' },
      { id: 'digits', label: 'Last two characters are numeric digits whose sum = 13.' },
    ],
  },
  {
    id: 7, title: 'Roman Code', seconds: 30, ...hard(), length: { exact: 8 },
    rules: [
      { id: 'length', label: 'Exactly 8 characters.' },
      { id: 'prefix', label: 'Starts with "XIV".' },
      { id: 'digits', label: 'Contains exactly 2 numeric digits whose product = 18.' },
      { id: 'end', label: 'Ends with "@".' },
      { id: 'rest', label: 'All other characters must be lowercase letters.' },
    ],
  },
  {
    id: 8, title: 'Odd & Even', seconds: 40, ...hard(), length: { exact: 4 },
    rules: [
      { id: 'length', label: 'Exactly 4 characters, all numeric digits.' },
      { id: 'distinct', label: 'All digits distinct.' },
      { id: 'parity', label: 'Exactly 2 even digits and 2 odd digits.' },
      { id: 'sum', label: 'Sum of digits = 18.' },
    ],
  },
  {
    id: 9, title: 'Prime Twins', seconds: 40, ...hard(), length: { exact: 5 },
    rules: [
      { id: 'format', label: 'Exact format DD@DD.' },
      { id: 'primes', label: 'Both two-digit numbers are prime.' },
      { id: 'gap', label: 'Absolute difference between them = 6.' },
    ],
  },
  {
    id: 10, title: 'Mirror Code', seconds: 35, ...hard(), length: { exact: 7 },
    rules: [
      { id: 'length', label: 'Exactly 7 characters.' },
      { id: 'palindrome', label: 'Entire password is a character-for-character palindrome.' },
      { id: 'digit', label: 'Contains at least one numeric digit.' },
      { id: 'upper', label: 'Contains at least one uppercase letter.' },
    ],
  },
  {
    id: 11, title: 'GDG Protocol', seconds: 45, ...hard(), length: { exact: 12 },
    rules: [
      { id: 'length', label: 'Exactly 12 characters.' },
      { id: 'gdg', label: 'Must contain uppercase "GDG".' },
      { id: 'specials', label: 'Must contain at least 2 distinct special characters.' },
      { id: 'sum', label: 'Sum of all numeric digits = 15.' },
    ],
  },
  {
    id: 12, title: 'N7SEC Cipher', seconds: 50, ...hard(), length: { exact: 14 },
    rules: [
      { id: 'length', label: 'Exactly 14 characters.' },
      { id: 'token', label: 'Must contain uppercase "N7SEC".' },
      { id: 'extra-digits', label: 'Exactly 3 additional numeric digits outside that required substring.' },
      { id: 'specials', label: 'Must contain at least 2 distinct special characters.' },
      { id: 'sum', label: 'Sum of ALL numeric digits = 20, including the "7" in N7SEC.' },
    ],
  },
  {
    id: 13, title: 'Equal Halves', seconds: 40, ...hard(), length: { exact: 9 },
    rules: [
      { id: 'format', label: 'Exact format LLDD-LLDD.' },
      { id: 'letters', label: 'All four letters must be distinct.' },
      { id: 'sums', label: 'Sum of the two digits before "-" equals the sum of the two digits after "-".' },
    ],
  },
  {
    id: 14, title: 'Checksum', seconds: 40, ...hard(), length: { exact: 6 },
    rules: [
      { id: 'format', label: 'Exact format DDDDD!.' },
      { id: 'check', label: 'Last digit equals the sum of the first four digits modulo 10.' },
      { id: 'variety', label: 'The five digits may not all be identical.' },
    ],
  },
  {
    id: 15, title: 'Reverse Letters', seconds: 30, ...hard(), length: { exact: 7 },
    rules: [
      { id: 'format', label: 'Exact format ABC@CBA.' },
      { id: 'distinct', label: 'A, B, and C must be three distinct uppercase letters.' },
      { id: 'vowel', label: 'The middle letter B must be a vowel (A, E, I, O, U).' },
    ],
  },
  {
    id: 16, title: 'Square Logic', seconds: 50, ...expert, length: { exact: 7 },
    rules: [
      { id: 'format', label: 'Exact format DD#DD!.' },
      { id: 'squares', label: 'Both two-digit numbers are perfect squares.' },
      { id: 'gap', label: 'Absolute difference = 20.' },
    ],
  },
  {
    id: 17, title: 'Ascending Product', seconds: 50, ...expert, length: { exact: 5 },
    rules: [
      { id: 'format', label: 'Exact format UDDD!.' },
      { id: 'order', label: 'The three digits are strictly increasing.' },
      { id: 'sum', label: 'Their sum = 15.' },
      { id: 'product', label: 'Their product is even.' },
    ],
  },
  {
    id: 18, title: 'Vowel Cipher', seconds: 55, ...expert, length: { exact: 9 },
    rules: [
      { id: 'format', label: 'Exact format LLLLLLDD#.' },
      { id: 'letters', label: 'Exactly six lowercase letters.' },
      { id: 'alternate', label: 'Letters alternate vowel, consonant, vowel, consonant, vowel, consonant.' },
      { id: 'ends', label: 'The first and last letters must differ.' },
      { id: 'digits', label: 'The two digits must be different.' },
      { id: 'sum', label: 'Sum of the digits = 11.' },
    ],
  },
  {
    id: 19, title: 'Final Equation', seconds: 60, ...expert, length: { exact: 5 },
    rules: [
      { id: 'format', label: 'Exact format DDDD!.' },
      { id: 'range', label: 'All four digits must be distinct integers from 1 through 9.' },
      { id: 'equation', label: 'a + b = c * d.' },
      { id: 'order', label: 'a > b and c < d.' },
    ],
  },
  {
    id: 20, title: 'Ultimate Password', seconds: 65, ...expert, length: { exact: 14 },
    rules: [
      { id: 'length', label: 'Exactly 14 characters.' },
      { id: 'gdg', label: 'Contains uppercase "GDG".' },
      { id: 'token', label: 'Contains uppercase "N7SEC".' },
      { id: 'specials', label: 'Exactly 2 distinct special characters.' },
      { id: 'end', label: 'Must end with "!".' },
      { id: 'sum', label: 'Sum of all numeric digits = 16, including the "7" in N7SEC.' },
    ],
  },
];

export const TOTAL_SECONDS = CHALLENGES.reduce((sum, challenge) => sum + challenge.seconds, 0);
export const MAX_SCORE = CHALLENGES.reduce((sum, challenge) => sum + challenge.base + challenge.bonus, 0);
