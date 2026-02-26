import { describe, it, expect } from 'vitest';
import { EVENT_CODES, decodeEventCode } from './event-codes';

describe('event-codes', () => {
  it('has 492 entries', () => {
    expect(Object.keys(EVENT_CODES).length).toBe(492);
  });

  it('decodes IAF correctly', () => {
    expect(decodeEventCode('IAF')).toBe('RECEIPT LETTER EMAILED');
  });

  it('decodes DA correctly', () => {
    expect(decodeEventCode('DA')).toBe('APPROVED/NOTICE ORDERED');
  });

  it('decodes EA correctly', () => {
    expect(decodeEventCode('EA')).toBe('DENIAL NOTICE ORDERED');
  });

  it('returns code itself for unknown codes', () => {
    expect(decodeEventCode('ZZZZZ')).toBe('ZZZZZ');
  });
});
