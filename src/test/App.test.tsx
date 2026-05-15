import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock @supabase/supabase-js so supabase.js doesn't fail on import.meta.env
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    }),
  })),
}));

// Mock analytics
vi.mock("../lib/analytics.js", () => ({
  track: vi.fn(),
}));

// Mock all screen components
vi.mock("../screens/LandingScreen.jsx", () => ({
  default: () => <div data-testid="landing-screen">LandingScreen</div>,
}));
vi.mock("../screens/RoleSelectScreen.jsx", () => ({
  default: () => <div data-testid="role-select-screen">RoleSelectScreen</div>,
}));
vi.mock("../screens/AuthScreen.jsx", () => ({
  default: () => <div data-testid="auth-screen">AuthScreen</div>,
}));
vi.mock("../screens/DashboardScreen.jsx", () => ({
  default: () => <div data-testid="dashboard-screen">DashboardScreen</div>,
}));
vi.mock("../screens/EditorScreen.jsx", () => ({
  default: () => <div data-testid="editor-screen">EditorScreen</div>,
}));
vi.mock("../screens/PanelEntryScreen.jsx", () => ({
  default: () => <div data-testid="panel-entry-screen">PanelEntryScreen</div>,
}));
vi.mock("../screens/PanelMyPageScreen.jsx", () => ({
  default: () => <div data-testid="panel-mypage-screen">PanelMyPageScreen</div>,
}));
vi.mock("../screens/ConsentScreen.jsx", () => ({
  default: () => <div data-testid="consent-screen">ConsentScreen</div>,
}));
vi.mock("../screens/InterviewScreen.jsx", () => ({
  default: () => <div data-testid="interview-screen">InterviewScreen</div>,
}));
vi.mock("../screens/ReportScreen.jsx", () => ({
  default: () => <div data-testid="report-screen">ReportScreen</div>,
}));
vi.mock("../screens/ResponsesScreen.jsx", () => ({
  default: () => <div data-testid="responses-screen">ResponsesScreen</div>,
}));
vi.mock("../screens/RecruiterAdminScreen.jsx", () => ({
  default: () => <div data-testid="admin-screen">RecruiterAdminScreen</div>,
}));
vi.mock("../screens/PanelBoardScreen.jsx", () => ({
  default: () => <div data-testid="panel-board-screen">PanelBoardScreen</div>,
}));
vi.mock("../screens/PricingScreen.jsx", () => ({
  default: () => <div data-testid="pricing-screen">PricingScreen</div>,
}));
vi.mock("../screens/SupportScreen.jsx", () => ({
  default: () => <div data-testid="support-screen">SupportScreen</div>,
}));
vi.mock("../screens/FAQScreen.jsx", () => ({
  default: () => <div data-testid="faq-screen">FAQScreen</div>,
}));
vi.mock("../screens/TermsScreen.jsx", () => ({
  default: () => <div data-testid="terms-screen">TermsScreen</div>,
}));
vi.mock("../screens/PrivacyScreen.jsx", () => ({
  default: () => <div data-testid="privacy-screen">PrivacyScreen</div>,
}));
vi.mock("../screens/AboutScreen.jsx", () => ({
  default: () => <div data-testid="about-screen">AboutScreen</div>,
}));
vi.mock("../screens/BillingSuccessScreen.jsx", () => ({
  default: () => <div data-testid="billing-success-screen">BillingSuccessScreen</div>,
}));
vi.mock("../screens/ExpertVerifyScreen.jsx", () => ({
  default: () => <div data-testid="expert-verify-screen">ExpertVerifyScreen</div>,
}));
vi.mock("../screens/PaymentScreen.jsx", () => ({
  default: () => <div data-testid="payment-screen">PaymentScreen</div>,
}));
vi.mock("../screens/PaymentSuccessScreen.jsx", () => ({
  default: () => <div data-testid="payment-success-screen">PaymentSuccessScreen</div>,
}));
vi.mock("../screens/InterviewPublishScreen.jsx", () => ({
  default: () => <div data-testid="publish-screen">InterviewPublishScreen</div>,
}));
vi.mock("../components/OnboardingModal.jsx", () => ({
  default: () => null,
}));

// Import App after mocks
import Voica from "../App.jsx";

// Since App uses BrowserRouter internally, we set window history before each render.

describe("App routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderAppAt(path: string) {
    window.history.pushState({}, "", path);
    return render(<Voica />);
  }

  it("renders LandingScreen at /", async () => {
    renderAppAt("/");
    await waitFor(() => {
      expect(screen.getByTestId("landing-screen")).toBeInTheDocument();
    });
  });

  it("renders AuthScreen at /auth", async () => {
    renderAppAt("/auth");
    await waitFor(() => {
      expect(screen.getByTestId("auth-screen")).toBeInTheDocument();
    });
  });

  it("renders DashboardScreen at /dashboard", async () => {
    renderAppAt("/dashboard");
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument();
    });
  });

  it("renders PricingScreen at /pricing", async () => {
    renderAppAt("/pricing");
    await waitFor(() => {
      expect(screen.getByTestId("pricing-screen")).toBeInTheDocument();
    });
  });

  it("renders AboutScreen at /about", async () => {
    renderAppAt("/about");
    await waitFor(() => {
      expect(screen.getByTestId("about-screen")).toBeInTheDocument();
    });
  });

  it("renders RoleSelectScreen at /role-select", async () => {
    renderAppAt("/role-select");
    await waitFor(() => {
      expect(screen.getByTestId("role-select-screen")).toBeInTheDocument();
    });
  });

  it("renders FAQScreen at /faq", async () => {
    renderAppAt("/faq");
    await waitFor(() => {
      expect(screen.getByTestId("faq-screen")).toBeInTheDocument();
    });
  });

  it("renders TermsScreen at /terms", async () => {
    renderAppAt("/terms");
    await waitFor(() => {
      expect(screen.getByTestId("terms-screen")).toBeInTheDocument();
    });
  });

  it("renders PrivacyScreen at /privacy", async () => {
    renderAppAt("/privacy");
    await waitFor(() => {
      expect(screen.getByTestId("privacy-screen")).toBeInTheDocument();
    });
  });

  it("renders SupportScreen at /support", async () => {
    renderAppAt("/support");
    await waitFor(() => {
      expect(screen.getByTestId("support-screen")).toBeInTheDocument();
    });
  });

  it("renders PanelBoardScreen at /panel", async () => {
    renderAppAt("/panel");
    await waitFor(() => {
      expect(screen.getByTestId("panel-board-screen")).toBeInTheDocument();
    });
  });

  it("renders EditorScreen at /editor", async () => {
    renderAppAt("/editor");
    await waitFor(() => {
      expect(screen.getByTestId("editor-screen")).toBeInTheDocument();
    });
  });

  it("renders EditorScreen at /editor/:id with param", async () => {
    renderAppAt("/editor/abc123");
    await waitFor(() => {
      expect(screen.getByTestId("editor-screen")).toBeInTheDocument();
    });
  });

  it("renders InterviewScreen at /i/:code", async () => {
    renderAppAt("/i/testcode");
    await waitFor(() => {
      expect(screen.getByTestId("interview-screen")).toBeInTheDocument();
    });
  });

  it("renders ConsentScreen at /consent", async () => {
    renderAppAt("/consent");
    await waitFor(() => {
      expect(screen.getByTestId("consent-screen")).toBeInTheDocument();
    });
  });

  it("renders LandingScreen for unknown 404 fallback", async () => {
    renderAppAt("/this-route-does-not-exist");
    await waitFor(() => {
      expect(screen.getByTestId("landing-screen")).toBeInTheDocument();
    });
  });
});
