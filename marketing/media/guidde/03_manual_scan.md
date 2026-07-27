# Evaluate an email on demand
**Duration:** 60 s
**Tool:** Guidde

Short, focused. Targets the user who just created a rule and is
impatient to see it work. (Replaces the retired "Scan email now"
video — the add-on is contextual-only now.)

---

## Hook (0:00–0:05)
ON-SCREEN: An open email in Gmail with the side panel showing the
**Evaluate this email** button highlighted.
VOICEOVER:
Open any email, click one button, and see in seconds which of your
rules it matches.

## Scene 1 — why it works this way (0:05–0:18)
ON-SCREEN: Gmail inbox LIST view with the side panel open on the
home card — no evaluate button anywhere. Then open the SENTINEL_TEST
email; the contextual card with **Evaluate this email** appears.
VOICEOVER:
"e-mail Sentinel" reads only the email you have open — never your
whole mailbox, never in the background. That is the privacy deal:
nothing is evaluated until you ask.

## Scene 2 — evaluate (0:18–0:35)
ON-SCREEN: Click **Evaluate this email**. The button shows a spinner.
After a few seconds the **Evaluation result** card appears with the
green ✅ "1 of 1 rule matched." banner and a "✅ Match — alerts sent"
row with Gemini's one-line reason.
VOICEOVER:
Click Evaluate. Gemini reads the message against every rule you have
enabled — you get a per-rule verdict, and matches fire your alerts
immediately.

## Scene 3 — the audit trail (0:35–0:45)
ON-SCREEN: Click **View activity log** on the result card. The log
shows the evaluation entry: sender, subject, rule name, MATCH and
the reason.
VOICEOVER:
Every evaluation is logged — what was read, which rules ran, and
why they matched. All stored privately in your own Google account.

## End card (0:45–0:50)
ON-SCREEN: Logo + Marketplace URL
VOICEOVER:
On-demand AI email triage. Get "e-mail Sentinel" — link below.

---

## Production notes

- Sequence one SENTINEL_TEST email into the inbox just before
  recording so the evaluation returns "✅ Match — alerts sent" —
  a green result card with content sells the feature better than
  "➖ No match".
- Scene 1's list-view beat matters: it is the visual proof of the
  privacy claim. Hold it ~2 seconds before opening the email.
- Evaluation takes a few seconds per enabled rule — keep only one
  or two rules enabled so the spinner beat stays short on camera.

---

## Recording checklist (Guidde)

Before you start: Gmail open, demo account, Screenshot mode ON, one
SENTINEL_TEST email already sitting unread in INBOX, one enabled rule
that matches it, "e-mail Sentinel" side panel open on the home card.

1. Hit **Start capture** in the Guidde extension.
2. From the inbox LIST view, click the "e-mail Sentinel" side-panel
   icon — hover the home card ~2 seconds (no evaluate button here).
3. Open the **SENTINEL_TEST** email in Gmail.
4. The side panel switches to the contextual card — hover the
   **Evaluate this email** button ~1 second.
5. Click **Evaluate this email**.
6. Wait for the spinner → **Evaluation result** card (~5–20 s).
7. Hover the green "✅ 1 of 1 rule matched." banner ~1 second.
8. Click **View activity log**.
9. Hover the MATCH entry ~2 seconds.
10. Hit **Stop capture** in Guidde.

After capture: in Guidde's editor, replace the auto-generated voiceover
on each step with the matching VOICEOVER lines from the scene script
above. Trim or merge any redundant click-steps Guidde captured (e.g.
double-clicks).
