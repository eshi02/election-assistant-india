import { describe, it, expect } from 'vitest';
import { findRelevantEntries, formatAsContext, getMetadata } from './knowledge.js';

describe('findRelevantEntries', () => {
  it('returns empty array for empty query', async () => {
    expect(await findRelevantEntries('')).toEqual([]);
    expect(await findRelevantEntries(null)).toEqual([]);
  });

  it('finds registration-related entries for "how to register"', async () => {
    const results = await findRelevantEntries('how do I register to vote');
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map(r => r.id);
    expect(ids).toContain('registration-form6');
  });

  it('finds polling day entries for "what ID to bring"', async () => {
    const results = await findRelevantEntries('what ID do I need to bring on polling day');
    const ids = results.map(r => r.id);
    expect(ids).toContain('polling-day-ids');
  });

  it('respects topN limit', async () => {
    const results = await findRelevantEntries('vote', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('surfaces misinformation entries for EVM-hacking style claims', async () => {
    const results = await findRelevantEntries('can EVMs be hacked from the internet', 6);
    const categories = results.map(r => r.category);
    expect(categories).toContain('misinformation');
  });
});

describe('formatAsContext', () => {
  it('returns empty string for empty array', () => {
    expect(formatAsContext([])).toBe('');
  });

  it('formats entries with id, title, and content', () => {
    const entries = [{ id: 'test-1', title: 'Test', content: 'Body' }];
    const formatted = formatAsContext(entries);
    expect(formatted).toContain('test-1');
    expect(formatted).toContain('Test');
    expect(formatted).toContain('Body');
  });
});

describe('getMetadata', () => {
  it('returns metadata with required fields', async () => {
    const meta = await getMetadata();
    expect(meta).toHaveProperty('source');
    expect(meta).toHaveProperty('lastUpdated');
    expect(meta.source).toContain('Election Commission of India');
  });
});
