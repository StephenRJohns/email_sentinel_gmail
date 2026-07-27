# Create a rule
**Duration:** ~2 min
**Tool:** Guidde (linear click-through fits perfectly)

Show how to create one rule from scratch — no starter template — so
viewers learn the field semantics, including a peek at both AI helpers
before canceling and finishing with the defaults.

---

## Hook (0:00–0:05)
ON-SCREEN: Rules card with "+ New rule" button highlighted.
VOICEOVER:
Rules are how "e-mail Sentinel" decides which emails get alerts.
Here is how to write one.

## Scene 1 — open the editor (0:05–0:15)
ON-SCREEN: Click "+ New rule"; the rule editor opens.
VOICEOVER:
Click New rule. The editor has four things to fill in — a name,
the rule itself, the alert channels, and the alert format.

## Scene 2 — name (0:15–0:25)
ON-SCREEN: Type rule name "Customer Escalation".
VOICEOVER:
Give it a short name you will recognize in alerts. Every enabled
rule runs whenever you evaluate an email — so the name is how you
tell the verdicts apart on the result card.

## Scene 3 — rule text (0:25–0:45)
ON-SCREEN: Type into the rule text field: "Email from a customer
that mentions cancellation, refund, downgrade, or escalation to a
manager."
VOICEOVER:
Write the rule in plain English. There is no syntax to learn —
Gemini reads the email you evaluate and decides whether it fits
what you described.

## Scene 4 — AI rule helper peek (0:45–1:05)
ON-SCREEN: Click "Help me write the rule text". A new card opens
showing a description input and a Generate button. Pause briefly,
then click Cancel to return to the rule editor.
VOICEOVER:
If you are not sure how to phrase the rule, the AI helper can
draft it for you — just describe what you want in plain English
and click Generate. We will stick with what we typed.

## Scene 5 — alert channels (1:05–1:30)
ON-SCREEN: Scroll down; check Calendar, Tasks, and SMS (if
configured). Show the SMS recipient checkboxes.
VOICEOVER:
Pick which channels get the alert. You can fan one rule out to
Calendar, Tasks, SMS, Google Chat — every channel you have set up
in Settings.

## Scene 6 — AI alert-text helper peek (1:30–1:50)
ON-SCREEN: Scroll to the alert format section. Click "Help me write
the alert text". A new card opens showing the selected channels and
a description input. Pause briefly, then click Cancel to return to
the rule editor.
VOICEOVER:
There is the same kind of helper for the alert message itself —
tell it what to include and Gemini writes the format instruction.
The default format works well, so we will leave it blank.

## Scene 7 — save and try it (1:50–2:00)
ON-SCREEN: Click Save. Back on Rules card, the new rule shows with
✅ ON in its header. Briefly open a matching email so the side panel
shows the **Evaluate this email** button.
VOICEOVER:
Save — the rule is on. Now open any email and click Evaluate this
email to run it. Nothing is checked in the background; you decide
which emails get read.

## End card (2:00–2:05)
ON-SCREEN: Logo + Marketplace URL
VOICEOVER:
Plain English. No regex. Get "e-mail Sentinel" — link below.

---

## Production notes

- Both AI helpers are free for everyone — no tier setup needed before
  recording.
- When you click "Help me write the rule text" in Scene 4, the card
  pre-populates its input with whatever you typed in the rule field —
  that is intentional and looks natural on camera.
- When you click "Help me write the alert text" in Scene 6, the card
  shows the channels you checked (Calendar, Tasks, SMS) — tick those
  first so the card context line is populated.
- For Scene 7's closing beat, have a matching email already in the
  inbox so opening it flips the side panel to the contextual card.

---

## Recording checklist (Guidde)

Before you start: Gmail open, demo account, Screenshot mode ON, the
side panel open on the home card, a Gemini key already saved in
Settings, at least one SMS recipient already added so the SMS checkbox
section is not empty, and one customer-escalation-looking email in
the inbox for the closing beat.

1. Hit **Start capture** in the Guidde extension.
2. Click **Rules** on the home card.
3. Click **+ New rule**.
4. Click the **Name** field, type `Customer Escalation`.
5. Click the **Rule** text field, type:
   `Email from a customer that mentions cancellation, refund, downgrade, or escalation to a manager.`
6. Click **Help me write the rule text**.
7. (On the AI helper card.) Read the card briefly — do not type or click Generate.
8. Click **Cancel** to return to the rule editor.
9. Scroll down to the alert channels section.
10. Check **Calendar**.
11. Check **Tasks**.
12. Check the SMS recipient checkbox(es) you want to demo.
13. Scroll down to the **Alert format** section.
14. Click **Help me write the alert text**.
15. (On the AI helper card.) Read the card briefly — note it lists the channels you selected.
16. Click **Cancel** to return to the rule editor.
17. Click **Save**.
18. (Back on Rules card.) Confirm the new rule's header shows ✅ ON.
19. Open the prepared customer-escalation email in Gmail; hover the
    **Evaluate this email** button ~1 second.
20. Hit **Stop capture** in Guidde.

After capture: in Guidde's editor, replace the auto-generated voiceover
on each step with the matching VOICEOVER lines from the scene script
above.
