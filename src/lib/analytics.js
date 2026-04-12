import { supabase } from "../supabase.js";

/**
 * Fire-and-forget funnel event tracker.
 * Never throws — panel interview flow must never be blocked by analytics.
 *
 * Events:
 *   interview_link_opened    - interview page loaded successfully
 *   interview_info_submitted - name/age/gender form submitted, session created
 *   interview_q_started      - a question became active (q_index = 0-based)
 *   interview_q_answered     - a question answer was submitted
 *   interview_completed      - all questions answered
 *   interview_abandoned      - user clicked 나가기 mid-interview
 */
export async function track(eventName, { shareCode, sessionId, qIndex, ...rest } = {}) {
  try {
    await supabase.from("funnel_events").insert({
      event_name: eventName,
      share_code: shareCode ?? null,
      session_id: sessionId ?? null,
      q_index: qIndex ?? null,
      properties: Object.keys(rest).length ? rest : {},
    });
  } catch {
    // silently swallow — never block the user
  }
}
