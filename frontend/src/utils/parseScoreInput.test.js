import { describe, expect, it } from 'vitest';
import { parseScoreInput } from './parseScoreInput';

describe('parseScoreInput', () => {
  it('parses colon and dash formats', () => {
    expect(parseScoreInput('2:1')).toEqual({
      ok: true, homeScore: 2, awayScore: 1, matchNumber: null,
    });
    expect(parseScoreInput('0-0')).toEqual({
      ok: true, homeScore: 0, awayScore: 0, matchNumber: null,
    });
  });

  it('parses match number prefix', () => {
    expect(parseScoreInput('#12 2:1')).toEqual({
      ok: true, homeScore: 2, awayScore: 1, matchNumber: 12,
    });
    expect(parseScoreInput('7 3-2')).toEqual({
      ok: true, homeScore: 3, awayScore: 2, matchNumber: 7,
    });
  });

  it('rejects invalid input', () => {
    expect(parseScoreInput('')).toEqual({ ok: false, error: 'empty' });
    expect(parseScoreInput('abc')).toEqual({ ok: false, error: 'invalidFormat' });
    expect(parseScoreInput('2:1:0')).toEqual({ ok: false, error: 'invalidFormat' });
  });

  it('rejects out of range scores', () => {
    expect(parseScoreInput('21:0').ok).toBe(false);
    expect(parseScoreInput('2:25').error).toBe('outOfRange');
  });
});
