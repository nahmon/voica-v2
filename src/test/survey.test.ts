import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client used by survey.js
const mockSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockUpsert = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  insert: mockInsert,
  update: mockUpdate,
  upsert: mockUpsert,
  single: mockSingle,
}));

vi.mock("../../api/_supabase.js", () => ({ supabase: { from: mockFrom } }));
vi.mock("../../api/_rateLimit.js", () => ({ rateLimit: () => true, getIp: () => "127.0.0.1" }));

// Minimal req/res helpers
function makeReq(method: string, body: object = {}, query: Record<string, string> = {}) {
  return { method, body, query, headers: {} } as any;
}
function makeRes() {
  const res = { _status: 0, _body: {} as any } as any;
  res.status = (s: number) => { res._status = s; return res; };
  res.json = (b: any) => { res._body = b; return res; };
  return res;
}

describe("survey API — session flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockUpdate.mockReturnThis();
    mockInsert.mockReturnThis();
    mockUpsert.mockReturnThis();
  });

  it("POST session: creates session when interview is active", async () => {
    // Interview lookup returns active interview
    mockSingle
      .mockResolvedValueOnce({ data: { id: "iv1", status: "active" }, error: null })
      // Session insert returns id
      .mockResolvedValueOnce({ data: { id: "sess1" }, error: null });

    const { default: handler } = await import("../../api/survey.js");
    const req = makeReq("POST", { interview_id: "iv1", respondent: {} }, { resource: "session" });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(201);
    expect(res._body.session_id).toBe("sess1");
  });

  it("POST session: rejects inactive interview", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "iv1", status: "closed" }, error: null });

    const { default: handler } = await import("../../api/survey.js");
    const req = makeReq("POST", { interview_id: "iv1" }, { resource: "session" });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(403);
  });

  it("PATCH session: completes session and returns ok", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "sess1", status: "in_progress", interview_id: "iv1", interviews: { reward_amount: 0 } }, error: null });
    mockUpdate.mockReturnValue({ eq: () => ({ error: null }) });

    const { default: handler } = await import("../../api/survey.js");
    const req = makeReq("PATCH", { session_id: "sess1", status: "completed" }, { resource: "session" });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body.ok).toBe(true);
  });

  it("PATCH session: rejects invalid status", async () => {
    const { default: handler } = await import("../../api/survey.js");
    const req = makeReq("PATCH", { session_id: "sess1", status: "hacked" }, { resource: "session" });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(400);
  });

  it("POST response: rejects non-in_progress session", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "sess1", status: "completed", interview_id: "iv1" }, error: null });

    const { default: handler } = await import("../../api/survey.js");
    const req = makeReq("POST", { session_id: "sess1", question_id: "q1", type: "voice" }, { resource: "response" });
    const res = makeRes();

    await handler(req, res);

    expect(res._status).toBe(403);
  });
});
