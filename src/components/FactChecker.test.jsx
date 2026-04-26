import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FactChecker from './FactChecker';

vi.mock('../services/factcheck', () => ({
  factCheck: vi.fn(),
}));
vi.mock('../services/translate', () => ({
  translate: vi.fn((text) => Promise.resolve(text)),
}));

import { factCheck } from '../services/factcheck';

describe('FactChecker', () => {
  beforeEach(() => {
    factCheck.mockReset();
  });

  it('renders the textarea and a disabled submit button initially', () => {
    render(<FactChecker onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Paste the forwarded message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check this claim/i })).toBeDisabled();
  });

  it('renders the verdict badge after a successful fact-check', async () => {
    factCheck.mockResolvedValueOnce({
      verdict: 'false',
      explanation: 'EVMs in India are standalone devices.',
      sources: [{ id: 'misinformation-evm-hacking', title: 'Myth' }],
    });

    render(<FactChecker onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Paste the forwarded message/i), {
      target: { value: 'EVMs can be hacked from China' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Check this claim/i }));

    await waitFor(() => {
      expect(screen.getByText('False')).toBeInTheDocument();
    });
    expect(screen.getByText(/standalone devices/i)).toBeInTheDocument();
    expect(screen.getByText(/misinformation-evm-hacking/i)).toBeInTheDocument();
  });

  it('shows a red error banner when the backend fails', async () => {
    factCheck.mockRejectedValueOnce(new Error('Backend error: 500'));

    render(<FactChecker onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Paste the forwarded message/i), {
      target: { value: 'something' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Check this claim/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert').textContent).toMatch(/Backend error: 500/);
  });

  it('does not call the backend when the textarea is empty', () => {
    render(<FactChecker onClose={vi.fn()} />);
    const button = screen.getByRole('button', { name: /Check this claim/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(factCheck).not.toHaveBeenCalled();
  });

  it('shows the unverifiable verdict when Gemini cannot judge', async () => {
    factCheck.mockResolvedValueOnce({
      verdict: 'unverifiable',
      explanation: 'No ECI source addresses this claim.',
      sources: [],
    });

    render(<FactChecker onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Paste the forwarded message/i), {
      target: { value: 'A specific candidate is corrupt' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Check this claim/i }));

    await waitFor(() => {
      expect(screen.getByText('Unverifiable')).toBeInTheDocument();
    });
  });
});
