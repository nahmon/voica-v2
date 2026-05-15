import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock supabase for analytics ──────────────────────────────────────────────
// vi.mock is hoisted, so the factory must not reference variables declared below.
// Instead, we use vi.hoisted() to create mocks that are safe to reference.
const { mockInsert, mockFrom } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  return { mockInsert, mockFrom };
});

vi.mock("../supabase.js", () => ({ supabase: { from: mockFrom } }));

// ── routes.js ────────────────────────────────────────────────────────────────
import { ROUTES, ID_SCREENS, CODE_SCREEN } from "../lib/routes.js";

describe("ROUTES", () => {
  it("contains all expected route keys", () => {
    const expectedKeys = [
      "landing", "advertiser_login", "role_select", "dashboard", "editor",
      "panel_entry", "panel_mypage", "panel_board", "consent", "interview",
      "report", "responses", "recruiter_admin", "pricing", "support",
      "faq", "terms", "privacy", "about",
    ];
    for (const key of expectedKeys) {
      expect(ROUTES).toHaveProperty(key);
    }
  });

  it("landing route maps to /", () => {
    expect(ROUTES.landing).toBe("/");
  });

  it("interview route maps to /i", () => {
    expect(ROUTES.interview).toBe("/i");
  });

  it("panel routes have correct paths", () => {
    expect(ROUTES.panel_entry).toBe("/panel/join");
    expect(ROUTES.panel_mypage).toBe("/panel/mypage");
    expect(ROUTES.panel_board).toBe("/panel");
  });

  it("all route values start with /", () => {
    for (const path of Object.values(ROUTES)) {
      expect(path).toMatch(/^\//);
    }
  });
});

describe("ID_SCREENS", () => {
  it("is a Set", () => {
    expect(ID_SCREENS).toBeInstanceOf(Set);
  });

  it("contains editor, report, responses", () => {
    expect(ID_SCREENS.has("editor")).toBe(true);
    expect(ID_SCREENS.has("report")).toBe(true);
    expect(ID_SCREENS.has("responses")).toBe(true);
  });

  it("does not contain non-id screens", () => {
    expect(ID_SCREENS.has("landing")).toBe(false);
    expect(ID_SCREENS.has("interview")).toBe(false);
    expect(ID_SCREENS.has("dashboard")).toBe(false);
  });
});

describe("CODE_SCREEN", () => {
  it('equals "interview"', () => {
    expect(CODE_SCREEN).toBe("interview");
  });

  it("is a string", () => {
    expect(typeof CODE_SCREEN).toBe("string");
  });
});

// ── clipboard.js ─────────────────────────────────────────────────────────────
import { copyToClipboard } from "../lib/clipboard.js";

describe("copyToClipboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses navigator.clipboard.writeText when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await copyToClipboard("hello");
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("falls back to execCommand when clipboard API fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("not allowed"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    // jsdom doesn't define execCommand — define it before spying
    if (!document.execCommand) {
      Object.defineProperty(document, "execCommand", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
        writable: true,
      });
    }
    const execCommand = vi.spyOn(document, "execCommand").mockReturnValue(true);

    await copyToClipboard("fallback text");

    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("fallback creates and removes textarea element", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("not allowed"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    if (!document.execCommand) {
      Object.defineProperty(document, "execCommand", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
        writable: true,
      });
    }
    vi.spyOn(document, "execCommand").mockReturnValue(true);

    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");

    await copyToClipboard("test");

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    const el = appendSpy.mock.calls[0][0] as HTMLTextAreaElement;
    expect(el.tagName).toBe("TEXTAREA");
    expect(el.value).toBe("test");
  });

  it("handles empty string", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await copyToClipboard("");
    expect(writeText).toHaveBeenCalledWith("");
  });
});

// ── analytics.js ─────────────────────────────────────────────────────────────
import { track } from "../lib/analytics.js";

describe("track()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it("inserts an event with all provided fields", async () => {
    await track("interview_link_opened", {
      shareCode: "abc123",
      sessionId: "sess1",
      qIndex: 0,
    });

    expect(mockFrom).toHaveBeenCalledWith("funnel_events");
    expect(mockInsert).toHaveBeenCalledWith({
      event_name: "interview_link_opened",
      share_code: "abc123",
      session_id: "sess1",
      q_index: 0,
      properties: {},
    });
  });

  it("uses null for missing optional fields", async () => {
    await track("interview_completed");

    expect(mockInsert).toHaveBeenCalledWith({
      event_name: "interview_completed",
      share_code: null,
      session_id: null,
      q_index: null,
      properties: {},
    });
  });

  it("puts extra properties into the properties field", async () => {
    await track("interview_q_answered", {
      shareCode: "xyz",
      sessionId: "s2",
      qIndex: 2,
      duration: 30,
      skipped: false,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: { duration: 30, skipped: false },
      })
    );
  });

  it("never throws even when supabase errors", async () => {
    mockInsert.mockRejectedValue(new Error("network error"));

    await expect(track("interview_abandoned")).resolves.toBeUndefined();
  });

  it("sets properties to empty object when no extra fields", async () => {
    await track("interview_q_started", { shareCode: "s", sessionId: "s", qIndex: 1 });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ properties: {} })
    );
  });
});

// ── templates.js ─────────────────────────────────────────────────────────────
import { TEMPLATES, templateToQuestions } from "../lib/templates.js";

describe("TEMPLATES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(TEMPLATES)).toBe(true);
    expect(TEMPLATES.length).toBeGreaterThan(0);
  });

  it("each template has required fields", () => {
    for (const t of TEMPLATES) {
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("title");
      expect(t).toHaveProperty("desc");
      expect(t).toHaveProperty("icon");
      expect(t).toHaveProperty("questions");
      expect(Array.isArray(t.questions)).toBe(true);
    }
  });

  it("all template ids are unique", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains expected template ids", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids).toContain("new_grad");
    expect(ids).toContain("experienced");
    expect(ids).toContain("ux_research");
    expect(ids).toContain("csat");
    expect(ids).toContain("executive");
  });

  it("each question has text and type", () => {
    for (const t of TEMPLATES) {
      for (const q of t.questions) {
        expect(typeof q.text).toBe("string");
        expect(q.text.length).toBeGreaterThan(0);
        expect(["voice", "likert", "mc"]).toContain(q.type);
      }
    }
  });
});

describe("templateToQuestions()", () => {
  const voiceTemplate = {
    id: "test",
    title: "Test",
    desc: "desc",
    icon: "T",
    questions: [
      { text: "Question 1?", type: "voice" },
      { text: "Question 2?", type: "voice" },
    ],
  };

  const mixedTemplate = {
    id: "mixed",
    title: "Mixed",
    desc: "desc",
    icon: "M",
    questions: [
      { text: "Rate this.", type: "likert" },
      { text: "Pick one.", type: "mc", options: ["A", "B", "C"] },
      { text: "Describe.", type: "voice" },
    ],
  };

  it("returns same number of questions as template", () => {
    const result = templateToQuestions(voiceTemplate);
    expect(result).toHaveLength(2);
  });

  it("voice question has id, type=voice, content", () => {
    const [q] = templateToQuestions(voiceTemplate);
    expect(typeof q.id).toBe("string");
    expect(q.id.length).toBeGreaterThan(0);
    expect(q.type).toBe("voice");
    expect(q.content).toBe("Question 1?");
  });

  it("each question gets a unique id", () => {
    const results = templateToQuestions(voiceTemplate);
    const ids = results.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("likert question has options with min/max/labels", () => {
    const [likert] = templateToQuestions(mixedTemplate);
    expect(likert.type).toBe("likert");
    expect(likert.options).toMatchObject({ min: 1, max: 5 });
    expect(Array.isArray((likert.options as any).labels)).toBe(true);
    expect((likert.options as any).labels).toHaveLength(5);
  });

  it("mc question has type=multiple_choice and options array", () => {
    const [, mc] = templateToQuestions(mixedTemplate);
    expect(mc.type).toBe("multiple_choice");
    expect(Array.isArray(mc.options)).toBe(true);
  });

  it("mc question defaults to 3 empty options when none provided", () => {
    const t = {
      ...mixedTemplate,
      questions: [{ text: "Pick.", type: "mc" }],
    };
    const [mc] = templateToQuestions(t as any);
    expect(mc.options).toEqual(["", "", ""]);
  });

  it("converts all TEMPLATES without throwing", () => {
    for (const t of TEMPLATES) {
      expect(() => templateToQuestions(t)).not.toThrow();
    }
  });
});

// ── constants.jsx ─────────────────────────────────────────────────────────────
import { C, S, F } from "../lib/constants.jsx";

describe("C (color tokens)", () => {
  it("has purple color defined", () => {
    expect(C.purple).toBe("#6E4BFF");
  });

  it("has navy color defined", () => {
    expect(C.navy).toBe("#1B1140");
  });

  it("has success color defined", () => {
    expect(C.success).toBe("#15be53");
  });

  it("has white color", () => {
    expect(C.white).toBe("#ffffff");
  });

  it("all hex color values are valid hex strings", () => {
    const hexValues = Object.values(C).filter(
      (v) => typeof v === "string" && v.startsWith("#")
    );
    expect(hexValues.length).toBeGreaterThan(0);
    for (const hex of hexValues) {
      expect(hex).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    }
  });
});

describe("S (shadow tokens)", () => {
  it("has card shadow defined", () => {
    expect(typeof S.card).toBe("string");
    expect(S.card.length).toBeGreaterThan(0);
  });

  it("static card shadows are none", () => {
    expect(S.elevated).toBe("none");
    expect(S.standard).toBe("none");
    expect(S.ambient).toBe("none");
    expect(S.deep).toBe("none");
  });

  it("float shadow is defined", () => {
    expect(typeof S.float).toBe("string");
    expect(S.float).not.toBe("none");
  });
});

describe("F (font stack)", () => {
  it("is a string", () => {
    expect(typeof F).toBe("string");
  });

  it("includes Pretendard", () => {
    expect(F).toContain("Pretendard");
  });

  it("includes system fallback fonts", () => {
    expect(F).toContain("sans-serif");
  });
});
