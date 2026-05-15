import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ─── useIsMobile ────────────────────────────────────────────────────────────

describe('useIsMobile', () => {
  beforeEach(() => {
    // Reset matchMedia mock before each test
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      })),
    });
  });

  it('returns false when matchMedia does not match (desktop)', async () => {
    // Re-import after mock reset — useIsMobile uses module-level MQ
    const { useIsMobile } = await import('../hooks/useIsMobile.js');
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true when matchMedia matches (mobile)', async () => {
    // Set matchMedia to return matches: true before module loads MQ
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      })),
    });

    // The module-level MQ is already created, so we test state update via event
    const listeners: Array<(e: { matches: boolean }) => void> = [];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_: string, fn: (e: { matches: boolean }) => void) => {
          listeners.push(fn);
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      })),
    });

    vi.resetModules();
    const { useIsMobile } = await import('../hooks/useIsMobile.js');
    const { result } = renderHook(() => useIsMobile());

    act(() => {
      listeners.forEach(fn => fn({ matches: true }));
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', async () => {
    const removeEventListener = vi.fn();
    const addEventListener = vi.fn();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener,
        removeEventListener,
        dispatchEvent: vi.fn(() => false),
      })),
    });

    vi.resetModules();
    const { useIsMobile } = await import('../hooks/useIsMobile.js');
    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('updates isMobile state when change event fires', async () => {
    const listeners: Array<(e: { matches: boolean }) => void> = [];

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_: string, fn: (e: { matches: boolean }) => void) => {
          listeners.push(fn);
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      })),
    });

    vi.resetModules();
    const { useIsMobile } = await import('../hooks/useIsMobile.js');
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach(fn => fn({ matches: true }));
    });

    expect(result.current).toBe(true);

    act(() => {
      listeners.forEach(fn => fn({ matches: false }));
    });

    expect(result.current).toBe(false);
  });
});

// ─── useGo ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useGo } from '../hooks/useGo.js';

describe('useGo', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
  );

  it('navigates to ROUTES path for a simple screen', () => {
    const { result } = renderHook(() => useGo(), { wrapper });
    act(() => {
      result.current('dashboard');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('appends id for ID_SCREENS (editor)', () => {
    const { result } = renderHook(() => useGo(), { wrapper });
    act(() => {
      result.current('editor', 'abc123');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/editor/abc123');
  });

  it('appends id for ID_SCREENS (report)', () => {
    const { result } = renderHook(() => useGo(), { wrapper });
    act(() => {
      result.current('report', 'xyz789');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/report/xyz789');
  });

  it('appends id for ID_SCREENS (responses)', () => {
    const { result } = renderHook(() => useGo(), { wrapper });
    act(() => {
      result.current('responses', 'resp001');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/responses/resp001');
  });

  it('appends code for CODE_SCREEN (interview) when code is provided', () => {
    const { result } = renderHook(() => useGo(), { wrapper });
    act(() => {
      result.current('interview', undefined, 'CODE42');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/i/CODE42');
  });

  it('appends id as code for CODE_SCREEN (interview) when code is not provided', () => {
    const { result } = renderHook(() => useGo(), { wrapper });
    act(() => {
      result.current('interview', 'ID99');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/i/ID99');
  });

  it('navigates to "/" for unknown screen', () => {
    const { result } = renderHook(() => useGo(), { wrapper });
    act(() => {
      result.current('nonexistent_screen' as any);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('does NOT append id for screens not in ID_SCREENS', () => {
    const { result } = renderHook(() => useGo(), { wrapper });
    act(() => {
      result.current('dashboard', 'someId');
    });
    // dashboard is not in ID_SCREENS, so id should be ignored
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});

// ─── AuthContext ─────────────────────────────────────────────────────────────

vi.mock('../supabase.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

import { useAuth, AuthProvider } from '../contexts/AuthContext.jsx';
import { supabase } from '../supabase.js';

const mockSupabase = supabase as {
  auth: {
    getSession: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
};

describe('AuthContext', () => {
  beforeEach(() => {
    mockNavigate.mockClear();

    // Default: no session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSupabase.auth.signOut.mockResolvedValue({});
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );

  it('provides null user when no session exists', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current?.user).toBeNull();
  });

  it('provides user when session exists', async () => {
    const mockUser = { id: 'user1', user_metadata: { role: 'recruiter' } };
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current?.user).toEqual(mockUser);
  });

  it('provides logout function that signs out and navigates to /', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current?.logout();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('subscribes to auth state changes on mount and unsubscribes on unmount', async () => {
    const unsubscribe = vi.fn();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('useAuth returns null when used outside AuthProvider', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toBeNull();
  });
});
