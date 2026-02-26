import { describe, it, expect } from 'vitest';
import { sha256, cn } from './utils';

describe('sha256', () => {
  it('hashes empty string', async () => {
    const hash = await sha256('');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('hashes a known string', async () => {
    const hash = await sha256('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('produces 64-char hex string', async () => {
    const hash = await sha256('test');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles tailwind merge', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles conditional', () => {
    expect(cn('base', false && 'hidden')).toBe('base');
  });
});
