# Google Chat alerts setup
**Duration:** 90 s
**Tool:** Guidde

Quick and clean. Chat webhooks are simpler than SMS — no API keys
or paid signups needed. Chat is free for everyone, like every other
alert channel.

https://chat.googleapis.com/v1/spaces/AAQA9rAkYho/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=IhLYtHjS-DCelyeVFZQomi4pZsJkLjYS6gI2Hhk3b8Y

https://chat.googleapis.com/v1/spaces/AAQAgwjCDOQ/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=poiPFOxdUoaCQvm2DvLTLoFSxKX03PuokZH1rqqPjfQ

---

## Hook (0:00–0:05)
ON-SCREEN: Google Chat space "Sentinel Alerts" with a bot message:
"e-mail Sentinel Rule Fired: Critical security alert..."
VOICEOVER:
Get email alerts in Google Chat — your team sees them in the
same place they handle everything else.

## Scene 1 — where it lives (0:05–0:15)
ON-SCREEN: Settings card → Google Chat section.
VOICEOVER:
Chat alerts sit in Settings alongside Calendar, Sheets, Tasks,
and SMS — every channel is free, so turn on whichever ones fit
your team's workflow.

## Scene 2 — create the webhook (0:15–0:50)
ON-SCREEN: Open Google Chat → pick a Space → settings gear →
Apps & integrations → Webhooks → Add webhook → name it "emAIl
Sentinel" → copy the URL.
VOICEOVER:
Open the Chat space where you want alerts to land. Settings,
Apps and integrations, Webhooks, Add webhook. Name it something
obvious — "e-mail Sentinel" — and copy the URL. That URL is the
only thing the add-on needs.

## Scene 3 — paste it in Settings (0:50–1:10)
ON-SCREEN: Back in "e-mail Sentinel" Settings → Chat spaces → "+ Add
Chat space" → name "Sentinel Alerts", paste URL → save.
VOICEOVER:
In Settings, click Add Chat space, name it, paste the URL, and
save. You can add multiple spaces — alerts to engineering go to
one, alerts to support go to another.

## Scene 4 — attach to a rule (1:10–1:25)
ON-SCREEN: Open a rule → check the "Sentinel Alerts" Chat space
checkbox → save.
VOICEOVER:
On any rule, check the Chat space you want, save, and the next
match posts to that space.

## End card (1:25–1:30)
ON-SCREEN: Logo + Marketplace URL
VOICEOVER:
Team alerts in Google Chat. Get "e-mail Sentinel" — link
below.

---

## Production notes

- The webhook URL contains a secret — blur it visibly after
  pasting in Scene 3, or use a fake URL for the recording.
- For the bot message in the Hook (0:00–0:05), record a real
  arriving message after wiring up screenshot mode so the message
  body shows the demo sender, not a real one.

---

## Recording checklist (Guidde)

Before you start: Gmail open, demo account, Screenshot mode ON, a
Google Chat space called `Sentinel Alerts` pre-created, a fake webhook URL
ready to paste (or be ready to blur the real one in post), at least
one rule already saved, side panel open on the home card.

1. Hit **Start capture** in the Guidde extension.
2. Click **3-dot menu** → **Settings**.
3. Scroll to the **Google Chat** section.
4. Switch to a Google Chat tab, open the **Sentinel Alerts** space.
5. Click the space-name dropdown at the top.
6. Click **Apps & integrations**.
7. Click **Webhooks**.
8. Click **Add webhook**.
9. Click the **Name** field, type `"e-mail Sentinel"`.
10. Click **Save**.
11. Click the **Copy** icon next to the generated URL.
12. Switch back to Gmail.
13. In the Settings card, click **+ Add Chat space**.
14. Click the **Name** field, type `Sentinel Alerts`.
15. Click the **Webhook URL** field, paste.
16. Click **Save**.
17. Click **3-dot menu** → **Rules**.
18. Click an existing rule.
19. Scroll to the Chat spaces section in the rule editor.
20. Check **Sentinel Alerts**.
21. Click **Save**.
22. Hit **Stop capture** in Guidde.

After capture: blur the webhook URL anywhere it is visible. Replace
the auto-generated voiceover on each step with the matching
VOICEOVER lines from the scene script above. Insert the Hook shot
(real Chat message arrival) at the front — record that separately
after triggering a real match against the demo space.
https://chat.googleapis.com/v1/spaces/AAQAgwjCDOQ/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=Fph3LFwQOk__iUPL2mXxwx8dg_wk3S35Slv0LfWEn4k