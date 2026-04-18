import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }),
  })),
}));

// Lazy import to avoid module-level side effects
const renderLanding = async () => {
  const { default: LandingScreen } = await import('../screens/LandingScreen.jsx');
  return render(
    <MemoryRouter>
      <LandingScreen />
    </MemoryRouter>
  );
};

describe('LandingScreen', () => {
  it('shows updated badge copy', async () => {
    await renderLanding();
    const badges = screen.getAllByText(/AI interviews\. AI analyzes\. You decide\./);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('does not show old badge copy', async () => {
    await renderLanding();
    expect(screen.queryByText(/AI가 인터뷰하고, AI가 분석합니다/)).not.toBeInTheDocument();
  });
});
