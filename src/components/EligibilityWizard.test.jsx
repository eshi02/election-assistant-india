import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EligibilityWizard from './EligibilityWizard';

describe('EligibilityWizard', () => {
  it('renders the first question', () => {
    render(<EligibilityWizard onClose={vi.fn()} />);
    expect(screen.getByText(/Are you an Indian citizen/i)).toBeInTheDocument();
  });

  it('blocks non-citizens', () => {
    render(<EligibilityWizard onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('No'));
    expect(screen.getByText(/Not eligible to vote/i)).toBeInTheDocument();
  });

  it('blocks OCI holders', () => {
    render(<EligibilityWizard onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(/OCI\/PIO/i));
    expect(screen.getByText(/OCI\/PIO holders cannot vote/i)).toBeInTheDocument();
  });

  it('guides eligible 18+ users to register', () => {
    render(<EligibilityWizard onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Yes')); // citizen
    fireEvent.click(screen.getByText('18 or older'));
    fireEvent.click(screen.getByText('Yes')); // residence
    fireEvent.click(screen.getByText('No'));  // not registered

    expect(screen.getByText(/You're eligible/i)).toBeInTheDocument();
    expect(screen.getByText(/voters.eci.gov.in/i)).toBeInTheDocument();
  });

  it('tells 17-year-olds they can apply in advance', () => {
    render(<EligibilityWizard onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Yes')); // citizen
    fireEvent.click(screen.getByText('17'));
    fireEvent.click(screen.getByText('Yes')); // residence
    fireEvent.click(screen.getByText('No'));  // not registered

    expect(screen.getByText(/can apply in advance/i)).toBeInTheDocument();
  });

  it('allows resetting the wizard', () => {
    render(<EligibilityWizard onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('No')); // ineligible result
    fireEvent.click(screen.getByText(/Start over/i));
    expect(screen.getByText(/Are you an Indian citizen/i)).toBeInTheDocument();
  });
});
