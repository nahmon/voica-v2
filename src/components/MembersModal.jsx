import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, useToast } from "./shared.jsx";

export default function MembersModal({ interviewId, interviewTitle, onClose }) {
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` };
  };

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/interview-members/${interviewId}`, {
        headers: await authHeaders(),
      });
      if (res.ok) setMembers(await res.json());
    })();
  }, [interviewId]);

  const handleInvite = async () => {
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/interview-members/${interviewId}`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMembers(prev => [...prev, data]);
      setEmail("");
      showToast("초대했어요", "success");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId) => {
    const res = await fetch(`/api/interview-members/${interviewId}?memberId=${memberId}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== memberId));
    else showToast("삭제에 실패했어요", "error");
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.white, borderRadius: 20, padding: "32px 28px", maxWidth: 460, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.16)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: F }}>팀원 초대</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            {Ic.X({ s: 18, c: C.body })}
          </button>
        </div>
        <div style={{ fontSize: 13, color: C.body, marginBottom: 24, fontFamily: F }}>{interviewTitle}</div>

        {/* Invite input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleInvite()}
            type="email"
            placeholder="이메일 주소 입력"
            style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: F, outline: "none", color: C.navy }}
          />
          <Btn onClick={handleInvite} disabled={loading}>
            {loading ? "초대 중..." : "초대"}
          </Btn>
        </div>

        {/* Member list */}
        {members.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: C.body, fontFamily: F }}>초대된 팀원이 없어요</div>
        ) : (
          members.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: C.purple, flexShrink: 0 }}>
                {m.email[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.navy, fontFamily: F }}>{m.email}</div>
                <div style={{ fontSize: 11, color: m.user_id ? C.success : C.body, fontFamily: F }}>
                  {m.user_id ? "가입됨" : "미가입 (초대 대기)"}
                </div>
              </div>
              <button onClick={() => handleRemove(m.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                {Ic.X({ s: 14, c: C.body })}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
