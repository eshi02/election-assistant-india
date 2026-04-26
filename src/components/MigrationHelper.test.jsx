import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MigrationHelper from './MigrationHelper';

describe('MigrationHelper', () => {
  it('renders the first question', () => {
    render(<MigrationHelper onClose={vi.fn()} onAskChat={vi.fn()} />);
    expect(screen.getByText(/Are you currently registered as a voter/i)).toBeInTheDocument();
  });

  it('routes never-registered users to Form 6', () => {
    render(<MigrationHelper onClose={vi.fn()} onAskChat={vi.fn()} />);
    fireEvent.click(screen.getByText(/never registered/i));
    expect(screen.getByText(/Register first using Form 6/i)).toBeInTheDocument();
  });

  it('routes service voters to the postal-ballot path immediately', () => {
    render(<MigrationHelper onClose={vi.fn()} onAskChat={vi.fn()} />);
    fireEvent.click(screen.getByText(/I have an EPIC/i)); // registered yes
    fireEvent.click(screen.getByText('Yes')); // service voter
    expect(screen.getByText(/You qualify as a service voter/i)).toBeInTheDocument();
    expect(screen.getByText(/Form 12/i)).toBeInTheDocument();
  });

  it('routes NRI users to Form 6A', () => {
    render(<MigrationHelper onClose={vi.fn()} onAskChat={vi.fn()} />);
    fireEvent.click(screen.getByText(/I have an EPIC/i));
    fireEvent.click(screen.getByText('No')); // not service voter
    fireEvent.click(screen.getByText(/Outside India/i));
    expect(screen.getByText(/Register as an Overseas Voter/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Form 6A/i).length).toBeGreaterThan(0);
  });

  it('routes long-term migrants who can\'t travel to Form 8 transfer', () => {
    render(<MigrationHelper onClose={vi.fn()} onAskChat={vi.fn()} />);
    fireEvent.click(screen.getByText(/I have an EPIC/i));
    fireEvent.click(screen.getByText('No')); // not service voter
    fireEvent.click(screen.getByText(/Different state/i));
    fireEvent.click(screen.getByText(/6 months or more/i));
    fireEvent.click(screen.getByText(/Probably not/i));
    expect(screen.getByText(/Transfer your registration with Form 8/i)).toBeInTheDocument();
  });

  it('routes "I will be home on poll day" users to travel-home path', () => {
    render(<MigrationHelper onClose={vi.fn()} onAskChat={vi.fn()} />);
    fireEvent.click(screen.getByText(/I have an EPIC/i));
    fireEvent.click(screen.getByText('No')); // not service voter
    fireEvent.click(screen.getByText(/Different city, same state/i));
    fireEvent.click(screen.getByText(/6 months or more/i));
    fireEvent.click(screen.getByText(/Yes, definitely/i));
    expect(screen.getByText(/Travel home to vote/i)).toBeInTheDocument();
  });

  it('flags short-term migrants who cannot travel as having limited options', () => {
    render(<MigrationHelper onClose={vi.fn()} onAskChat={vi.fn()} />);
    fireEvent.click(screen.getByText(/I have an EPIC/i));
    fireEvent.click(screen.getByText('No'));
    fireEvent.click(screen.getByText(/Different state/i));
    fireEvent.click(screen.getByText(/temporarily/i));
    fireEvent.click(screen.getByText(/Probably not/i));
    expect(screen.getByText(/Limited options/i)).toBeInTheDocument();
    expect(screen.getByText(/postal ballot isn't available for general migrants/i)).toBeInTheDocument();
  });

  it('calls onAskChat with the prefilled question when "Ask the assistant" is clicked', () => {
    const onAskChat = vi.fn();
    render(<MigrationHelper onClose={vi.fn()} onAskChat={onAskChat} />);
    fireEvent.click(screen.getByText(/never registered/i));
    fireEvent.click(screen.getByText(/Ask the assistant/i));
    expect(onAskChat).toHaveBeenCalledWith(expect.stringContaining('Form 6'));
  });

  it('allows resetting back to the first question', () => {
    render(<MigrationHelper onClose={vi.fn()} onAskChat={vi.fn()} />);
    fireEvent.click(screen.getByText(/never registered/i));
    fireEvent.click(screen.getByText(/Start over/i));
    expect(screen.getByText(/Are you currently registered as a voter/i)).toBeInTheDocument();
  });
});
