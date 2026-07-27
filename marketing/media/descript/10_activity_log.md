# Activity log & troubleshooting
**Duration:** 110 s
**Tool:** Descript (heavier on narration than clicks)

The "the alert did not fire" video. Pre-empt the support questions
that turn into 1-star reviews. Cover: how to read the log, common
reasons rules do not fire, and how to re-run an evaluation.

---

## Hook (0:00–0:08)
ON-SCREEN: Activity log card with a few entries — some
"MATCH! ..." in green, one "No match" line, one "FAILED" line in
red.
VOICEOVER:
If a rule is not firing, the Activity log tells you why. It is
the first place to look.

## Scene 1 — open the log (0:08–0:25)
ON-SCREEN: 3-dots menu → Activity Log. Scroll through ~20
entries.
VOICEOVER:
Open Activity Log from the kebab menu. Every evaluation writes
entries. You see which email you evaluated. What each rule decided
about it, and why. And any alert dispatch errors.

## Scene 2 — reading a match (0:25–0:50)
ON-SCREEN: Highlight a multi-line block: timestamp →
"Evaluating open email — From: ... | Subject: ..." →
"Evaluating against rule 'Security & account alerts' ..." →
"MATCH! Email mentions a security incident from a known service"
→ the Calendar dispatch line.
VOICEOVER:
Each evaluation shows the From address and Subject of the email
you opened. Then a line per enabled rule. A green MATCH means
Gemini said yes — the match line shows the reason, and the lines
after tell you which channels fired.

## Scene 3 — reading a no-match (0:50–1:10)
ON-SCREEN: Highlight a block ending with "No match. The email is
about a marketing newsletter, not a security incident."
VOICEOVER:
A No match line tells you why Gemini decided the email does not
fit the rule. If you see No match for emails you think should
match, the rule text needs sharpening. Read the reason. Then
adjust.

## Scene 4 — failures and re-running (1:10–1:35)
ON-SCREEN: Highlight a red line — "MCP 'Asana' HTTP 401:
Unauthorized". Then cut to an open email with the **Evaluate this
email** button.
VOICEOVER:
Red lines are failures. Alert dispatch errors include the exact
response from the channel — no silent failures, and a broken
channel does not stop the others from firing. If an evaluation
fails from a Gemini quota blip, nothing is lost: open the email
and click Evaluate again. You decide when anything gets re-checked.

## End card (1:35–1:45)
ON-SCREEN: Logo + Marketplace URL
VOICEOVER:
Full audit trail, no black box. Get "e-mail Sentinel" — link below.

---

## Production notes

- Salt the Activity log with three different scenarios before
  recording: a match, a no-match, and a failure. The simplest
  way is (1) evaluate an email that matches a rule, (2) evaluate
  an email that should not match, and (3) temporarily set an MCP
  server endpoint to a 401-returning URL and evaluate a matching
  email for a fake dispatch failure.
- Scene 4's closing beat cuts to an open email with the Evaluate
  button — have one ready in the inbox so the cut is one click.
- The activity log in screenshot mode shows the demo From line
  ("Tester <test@example.com>") instead of real senders —
  do not forget to enable screenshot mode before recording.

---

## Recording checklist (Guidde)

Marked Descript for narration depth, but you can capture the click
flow with Guidde and overdub.

Before you start: Gmail open, demo account, Screenshot mode ON, the
Activity log **pre-salted** with all three scenarios — at least one
green MATCH, one No-match, and one red MCP failure (see Production
notes above for how to salt it). One evaluable email open-able in
the inbox for the Scene 4 closing beat.

1. Hit **Start capture** in the Guidde extension.
2. Click the **3-dot menu** on the home card.
3. Click **Activity Log**.
4. Scroll slowly down through ~20 entries.
5. Hover a multi-line MATCH block (timestamp → "Evaluating open
    email — From: ... | Subject: ..." → "Evaluating against rule
    '...'" → green "MATCH! ..." → the dispatch line) for ~3 s.
6. Scroll to a No-match block; hover the "No match. The email is
    about ..." line for ~3 s.
7. Scroll to a red MCP failure block; hover the
    `MCP "Asana" HTTP 401: Unauthorized` line for ~3 s.
8. In Gmail, open the prepared email — the side panel switches to
    the contextual card; hover **Evaluate this email** ~2 s (no
    need to click).
9. Hit **Stop capture** in Guidde.

After capture: replace the auto-generated voiceover with the
storyboard VOICEOVER lines. The hover/dwell shots in steps 5–7 are
where most of the narration lives — make sure each pause is long
enough to read the highlighted lines.
