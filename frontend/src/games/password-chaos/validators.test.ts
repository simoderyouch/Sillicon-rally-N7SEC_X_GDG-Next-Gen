import { describe, expect, it } from 'vitest';
import { CHALLENGES, MAX_SCORE, TOTAL_SECONDS } from './challenges';
import { isValid } from './validators';

const SOLUTIONS = [
  'AB12345!',
  'Ab13c#',
  'a2b3c4!',
  'aba1$2x',
  '11111000',
  'abcd49',
  'XIVab29@',
  '9720',
  '13@19',
  'A1b1b1A',
  'GDG87!@abcde',
  'N7SEC139!@abcd',
  'AB12-CD12',
  '12340!',
  'AEC@CEA',
  '16#36!',
  'A168!',
  'abacad29#',
  '3215!',
  'GDG2N7SEC7@ab!',
];

const REJECTED = [
  ['Ab12345!', 'A123456!', 'AB12346!', 'AB12345?'],
  ['Ab13c', 'Aa13b#', 'A1b3c#', 'Ab113#'],
  ['a2b3c4', 'c2b3a4!', 'a0b3c8!', 'ab2c4!'],
  ['aba12x!', 'aba111$', 'ab1$2xa'],
  ['11111001', '11110000', '21111000', '11111'],
  ['abdc49', 'abc449', 'abcd48', 'abcd4'],
  ['XIVab29', 'XIVAb29@', 'XIVab23@', 'XIVa2b9'],
  ['9721', '9920', '9750', '1359'],
  ['13@17', '13@19x', '14@20', '13-19'],
  ['A1b1b1a', 'A1b2b1a', 'abcdefg', 'AAAAAAA'],
  ['GDG87!abcde', 'gdg87!@abcde', 'GDG86!@abcde', 'GDG87!@abcd'],
  ['N7SEC139!@abc', 'N7SEC139abcd!!', 'N7SEC129!@abcd', 'n7sec139!@abcd'],
  ['AB12-AB12', 'AB12-CD13', 'ab12-CD12', 'AB12CD12'],
  ['00000!', '12345!', '1234!', '12340'],
  ['ABC@CBA', 'ABB@BBA', 'AEC@CEB', 'aec@cea'],
  ['16#25!', '16#36', '25#45!', '36#16'],
  ['A159!', 'A186!', 'a168!', 'A168'],
  ['abacad39#', 'abacad22#', 'bbacad29#', 'abacad2#'],
  ['3216!', '2315!', '3205!', '3215'],
  ['GDG2N7SEC7@ab', 'GDG2N7SEC7ab!', 'GDG2N7SEC8@ab!', 'gdg2N7SEC7@ab!'],
];

describe('password validators', () => {
  it('keeps the published timetable and point ceiling', () => {
    expect(CHALLENGES).toHaveLength(20);
    expect(CHALLENGES.filter(item => item.tier === 'HARD')).toHaveLength(15);
    expect(CHALLENGES.filter(item => item.tier === 'EXPERT')).toHaveLength(5);
    expect(TOTAL_SECONDS).toBe(810);
    expect(CHALLENGES.filter(item => item.tier === 'HARD').reduce((sum, item) => sum + item.seconds, 0)).toBe(555);
    expect(CHALLENGES.filter(item => item.tier === 'EXPERT').reduce((sum, item) => sum + item.seconds, 0)).toBe(255);
    expect(MAX_SCORE).toBe(100);
    expect(CHALLENGES.map(item => item.seconds)).toEqual([30, 35, 35, 40, 30, 30, 30, 40, 40, 35, 45, 50, 40, 40, 35, 45, 45, 50, 55, 60]);
  });

  it('accepts one valid password and rejects the boundary failures for every challenge', () => {
    SOLUTIONS.forEach((solution, index) => {
      expect(isValid(index + 1, solution), `solution ${index + 1}`).toBe(true);
      REJECTED[index].forEach(value => expect(isValid(index + 1, value), `${index + 1}:${value}`).toBe(false));
    });
  });

  it('allows repeated copies of the two chosen digits in Palindrome Lock', () => {
    expect(isValid(4, 'aba11$2')).toBe(true);
  });
});
