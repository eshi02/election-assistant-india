import { describe, it, expect, vi, beforeEach } from 'vitest';

// Module's top-level guard exits the process if this isn't set.
process.env.GEMINI_API_KEY = 'test-key';

const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: function GoogleGenerativeAI() {
    return {
      getGenerativeModel: () => ({
        generateContent: mockGenerateContent,
      }),
    };
  },
}));

const { factCheckClaim } = await import('./gemini.js');

describe('factCheckClaim', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  it('returns the verdict, explanation, and validated sources for a well-formed Gemini reply', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          '{"verdict":"false","explanation":"EVMs used in Indian elections are standalone devices.","citedSourceIds":["misinformation-evm-hacking"]}',
      },
    });

    const result = await factCheckClaim('EVMs can be hacked over the internet');

    expect(result.verdict).toBe('false');
    expect(result.explanation).toContain('standalone');
    expect(result.sources).toEqual([
      { id: 'misinformation-evm-hacking', title: expect.any(String) },
    ]);
  });

  it('falls back to "unverifiable" when Gemini returns non-JSON text', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => 'I cannot answer that.' },
    });

    const result = await factCheckClaim('some random claim');

    expect(result.verdict).toBe('unverifiable');
    expect(result.sources).toEqual([]);
    expect(result.explanation).toMatch(/PIB Fact Check|1950/i);
  });

  it('drops citedSourceIds that were not in the retrieved context', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          '{"verdict":"true","explanation":"Yes.","citedSourceIds":["nonexistent-source-id"]}',
      },
    });

    const result = await factCheckClaim('aadhaar is mandatory to vote');

    expect(result.verdict).toBe('true');
    expect(result.sources).toEqual([]);
  });

  it('rejects unknown verdict labels and falls back to "unverifiable"', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          '{"verdict":"DEFINITELY_TRUE","explanation":"Sure.","citedSourceIds":[]}',
      },
    });

    const result = await factCheckClaim('something borderline');

    expect(result.verdict).toBe('unverifiable');
  });

  it('tolerates leading/trailing prose around the JSON block', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          'Sure! Here is the verdict:\n{"verdict":"misleading","explanation":"Partial truth.","citedSourceIds":[]}\nLet me know if you need more.',
      },
    });

    const result = await factCheckClaim('something partial');

    expect(result.verdict).toBe('misleading');
    expect(result.explanation).toContain('Partial truth');
  });
});
