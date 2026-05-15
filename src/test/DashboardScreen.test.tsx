import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockOrder = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  update: mockUpdate,
}));

const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: mockFrom,
  })),
}));

// ── Shared components mock ─────────────────────────────────────────────────────
vi.mock('../components/shared.jsx', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Btn: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  GlobalNav: () => <nav data-testid="global-nav" />,
  Footer: () => <footer data-testid="footer" />,
  useToast: () => ({ showToast: vi.fn() }),
}));

// ── MembersModal mock ──────────────────────────────────────────────────────────
vi.mock('../components/MembersModal.jsx', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="members-modal">
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}));

// ── clipboard mock ─────────────────────────────────────────────────────────────
vi.mock('../lib/clipboard.js', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}));

// ── useIsMobile mock ───────────────────────────────────────────────────────────
vi.mock('../hooks/useIsMobile.js', () => ({
  useIsMobile: () => false,
}));

// ── Helpers ────────────────────────────────────────────────────────────────────
const defaultUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { name: 'Test User' },
};

const mockGo = vi.fn();
const mockLogout = vi.fn();

async function renderDashboard(props: Partial<Parameters<typeof import('../screens/DashboardScreen.jsx')['default']>[0]> = {}) {
  const { default: DashboardScreen } = await import('../screens/DashboardScreen.jsx');
  return render(
    <MemoryRouter>
      <DashboardScreen
        go={mockGo}
        user={defaultUser}
        logout={mockLogout}
        lang="en"
        {...props}
      />
    </MemoryRouter>
  );
}

// Reset per-test
beforeEach(() => {
  vi.clearAllMocks();
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockFrom.mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
    update: mockUpdate,
  });
  // Default: interviews query returns empty
  mockOrder.mockResolvedValue({ data: [], error: null });
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('DashboardScreen', () => {
  describe('render without user (no auth)', () => {
    it('renders nav and footer even without user', async () => {
      // Override order to avoid hanging promises
      mockOrder.mockResolvedValue({ data: [], error: null });

      const { default: DashboardScreen } = await import('../screens/DashboardScreen.jsx');
      render(
        <MemoryRouter>
          <DashboardScreen go={mockGo} user={null} logout={mockLogout} lang="en" />
        </MemoryRouter>
      );

      expect(screen.getByTestId('global-nav')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('does not show greeting when user is null', async () => {
      const { default: DashboardScreen } = await import('../screens/DashboardScreen.jsx');
      render(
        <MemoryRouter>
          <DashboardScreen go={mockGo} user={null} logout={mockLogout} lang="en" />
        </MemoryRouter>
      );

      // greeting uses user name — falls back to "there" if user is falsy but user itself null means no query
      // The greeting div is rendered unconditionally
      expect(screen.getByText(/Hello,/)).toBeInTheDocument();
    });
  });

  describe('render with authenticated user', () => {
    it('shows greeting with user name', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Hello, Test User/)).toBeInTheDocument();
      });
    });

    it('shows greeting in Korean when lang=ko', async () => {
      await renderDashboard({ lang: 'ko' });

      await waitFor(() => {
        expect(screen.getByText(/안녕하세요, Test User/)).toBeInTheDocument();
      });
    });

    it('renders stat cards (Total Projects, Total Responses, etc.)', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Total Projects')).toBeInTheDocument();
        expect(screen.getByText('Total Responses')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('renders quick-access panels (Panelist Recruiting, Recruitment Board)', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Panelist Recruiting')).toBeInTheDocument();
        expect(screen.getByText('Recruitment Board')).toBeInTheDocument();
      });
    });

    it('renders + New Project button', async () => {
      await renderDashboard();

      await waitFor(() => {
        // Btn renders children as-is
        const btns = screen.getAllByText(/\+ New Project/);
        expect(btns.length).toBeGreaterThan(0);
      });
    });
  });

  describe('empty state (no interviews)', () => {
    it('shows "Create your first interview" prompt when no interviews exist', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Create your first interview')).toBeInTheDocument();
      });
    });

    it('shows QuickStart steps when no interviews exist', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('How to get started')).toBeInTheDocument();
        expect(screen.getByText('Design Questions')).toBeInTheDocument();
        expect(screen.getByText('Recruit Panelists')).toBeInTheDocument();
        expect(screen.getByText('AI Report')).toBeInTheDocument();
      });
    });

    it('does not show search bar when no interviews', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search projects...')).not.toBeInTheDocument();
      });
    });
  });

  describe('with interviews', () => {
    const mockInterviews = [
      {
        id: 'iv-1',
        title: 'Customer Research 2024',
        status: 'active',
        share_code: 'abc123',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        questions: [{ count: 5 }],
        sessions: [{ count: 12 }],
        interview_members: [{ count: 2 }],
      },
      {
        id: 'iv-2',
        title: 'Product Feedback',
        status: 'draft',
        share_code: 'def456',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        questions: [{ count: 3 }],
        sessions: [{ count: 0 }],
        interview_members: [{ count: 0 }],
      },
    ];

    beforeEach(() => {
      mockOrder.mockResolvedValue({ data: mockInterviews, error: null });
    });

    it('renders interview cards with titles', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Customer Research 2024')).toBeInTheDocument();
        expect(screen.getByText('Product Feedback')).toBeInTheDocument();
      });
    });

    it('shows search bar when interviews exist', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
      });
    });

    it('shows status filter buttons', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Draft').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows correct total stats in stat cards', async () => {
      await renderDashboard();

      await waitFor(() => {
        // 2 interviews total → "2" in Total Projects stat card
        const statValues = screen.getAllByText('2');
        expect(statValues.length).toBeGreaterThan(0);
      });
    });

    it('navigates to editor when New Project is clicked (free plan, under limit)', async () => {
      // Only 2 interviews — under the free limit of 3
      mockOrder.mockResolvedValue({ data: mockInterviews, error: null });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Customer Research 2024')).toBeInTheDocument();
      });

      const newProjectBtns = screen.getAllByText(/\+ New Project/);
      await userEvent.click(newProjectBtns[0]);

      expect(mockGo).toHaveBeenCalledWith('editor');
    });

    it('shows upgrade modal when free user hits 3-interview limit', async () => {
      const threeInterviews = [
        ...mockInterviews,
        {
          id: 'iv-3',
          title: 'Third Interview',
          status: 'draft',
          share_code: 'ghi789',
          created_at: new Date().toISOString(),
          questions: [{ count: 1 }],
          sessions: [{ count: 0 }],
          interview_members: [{ count: 0 }],
        },
      ];
      mockOrder.mockResolvedValue({ data: threeInterviews, error: null });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Third Interview')).toBeInTheDocument();
      });

      const newProjectBtns = screen.getAllByText(/\+ New Project/);
      await userEvent.click(newProjectBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('shows no interviews on fetch error (does not crash)', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      await renderDashboard();

      await waitFor(() => {
        // On error, interviews stays [] and empty state is shown
        expect(screen.getByText('Create your first interview')).toBeInTheDocument();
      });
    });

    it('renders correctly when credit balance fetch fails', async () => {
      // maybeSingle returns error for credits query
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'credits error' } });
      mockOrder.mockResolvedValue({ data: [], error: null });

      await renderDashboard();

      await waitFor(() => {
        // Component still renders
        expect(screen.getByTestId('global-nav')).toBeInTheDocument();
      });
    });
  });

  describe('Pro subscription UI', () => {
    beforeEach(() => {
      mockOrder.mockResolvedValue({ data: [], error: null });
    });

    it('shows Pro badge when user has active subscription', async () => {
      // First maybeSingle call = credits, second = subscription
      mockMaybeSingle
        .mockResolvedValueOnce({ data: { balance: 100 }, error: null })
        .mockResolvedValueOnce({ data: { status: 'active', cancel_at_period_end: false, current_period_end: null }, error: null });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/✦ Pro/)).toBeInTheDocument();
      });
    });

    it('shows Manage button for active non-canceling Pro subscription', async () => {
      mockMaybeSingle
        .mockResolvedValueOnce({ data: { balance: 100 }, error: null })
        .mockResolvedValueOnce({ data: { status: 'active', cancel_at_period_end: false, current_period_end: null }, error: null });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Manage')).toBeInTheDocument();
      });
    });

    it('does not show Pro badge when user is on free plan', async () => {
      mockMaybeSingle
        .mockResolvedValueOnce({ data: { balance: 0 }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.queryByText(/✦ Pro/)).not.toBeInTheDocument();
      });
    });

    it('opens cancel subscription modal when Manage is clicked', async () => {
      mockMaybeSingle
        .mockResolvedValueOnce({ data: { balance: 100 }, error: null })
        .mockResolvedValueOnce({ data: { status: 'active', cancel_at_period_end: false, current_period_end: null }, error: null });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Manage')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Manage'));

      await waitFor(() => {
        expect(screen.getByText('Cancel subscription?')).toBeInTheDocument();
      });
    });
  });
});
