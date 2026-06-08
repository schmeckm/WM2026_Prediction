import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './useAsyncData';

describe('getErrorMessage', () => {
  it('extracts API error message', () => {
    const err = { response: { data: { error: 'Server error' } } };
    expect(getErrorMessage(err, 'fallback')).toBe('Server error');
  });

  it('falls back when no response', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
    expect(getErrorMessage({}, 'fallback')).toBe('fallback');
  });
});
