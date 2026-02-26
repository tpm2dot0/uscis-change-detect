import { describe, it, expect } from 'vitest';
import { computeDiff } from './diff';

describe('computeDiff', () => {
  it('returns null for identical objects', () => {
    const obj = { a: 1, b: 'hello' };
    expect(computeDiff('test', obj, obj)).toBeNull();
  });

  it('returns a unified diff for different objects', () => {
    const old = { status: 'pending', date: '2026-01-01' };
    const curr = { status: 'approved', date: '2026-02-20' };
    const result = computeDiff('Case', old, curr);
    expect(result).toBeTruthy();
    expect(result).toContain('pending');
    expect(result).toContain('approved');
    expect(result).toContain('---');
    expect(result).toContain('+++');
  });

  it('returns null for deeply equal objects', () => {
    const a = { x: [1, 2, 3], y: { z: true } };
    const b = { x: [1, 2, 3], y: { z: true } };
    expect(computeDiff('test', a, b)).toBeNull();
  });

  it('returns null when keys are in different order but values identical', () => {
    const a = { statusTitle: 'Received', statusText: 'Details...', statusTitleSpanish: 'Recibido' };
    const b = { statusText: 'Details...', statusTitleSpanish: 'Recibido', statusTitle: 'Received' };
    expect(computeDiff('test', a, b)).toBeNull();
  });

  it('returns null for nested objects with different key order', () => {
    const a = { outer: { b: 2, a: 1 }, name: 'test' };
    const b = { name: 'test', outer: { a: 1, b: 2 } };
    expect(computeDiff('test', a, b)).toBeNull();
  });

  it('detects actual value change even with different key order', () => {
    const a = { statusTitle: 'Old Title', code: 'IAF' };
    const b = { code: 'IAF', statusTitle: 'New Title' };
    const result = computeDiff('test', a, b);
    expect(result).toBeTruthy();
    expect(result).toContain('Old Title');
    expect(result).toContain('New Title');
  });
});
