# emAIl Sentinel — Script C: SMS Provider Validation

**Target session length:** 20 minutes (unmoderated, screen + audio recording)
**Recruitment:** Direct outreach — testers must already have an active account with the assigned SMS provider.
**Provider for this session:** `<PROVIDER_NAME>`

---

## What this product is

emAIl Sentinel is a Gmail add-on that watches your inbox and sends you alerts — SMS, Calendar event, Google Chat message, and more — when emails matching plain-English rules arrive. For example: "alert me when any email from a client mentions an invoice." In this session you will configure your existing **`<PROVIDER_NAME>`** account as the SMS delivery channel, write a rule, and confirm a real text arrives on your phone.

---

## Tester briefing

You are testing emAIl Sentinel's SMS alert path using your own `<PROVIDER_NAME>` account. This is a private pre-launch session — the add-on is not yet publicly listed on Google Workspace Marketplace.

**You will need:**
- Your `<PROVIDER_NAME>` credentials (details in the "Your credentials" section below)
- A phone number that can receive SMS — your own mobile is fine

**You will see a warning during install** that says *"This app hasn't been verified by Google yet."* That is expected for a pre-launch add-on. Click **Continue** then **Allow**.

**Please think aloud throughout** — narrate what you see, what you expect to happen, and what confuses you. There are no wrong answers.

---

## Pre-supplied credentials

The developer has provided these for this session. Rotate after the session — do not share.

- **Gemini API key:** `<DEV_GEMINI_KEY>`
- **Install URL:** `<TEST_DEPLOYMENT_URL>`

---

## Your credentials

<PROVIDER_SETUP_BLOCK>

---

## Tasks

### Task 1 — Install the add-on (2 min)

1. Open `<TEST_DEPLOYMENT_URL>` in Chrome. Sign in to your Google account if prompted.
2. You will see a Google consent screen titled *"This app hasn't been verified by Google yet."* Click **Continue** → review the permissions list → click **Allow**.
3. Reload Gmail (`mail.google.com`). In the right-hand sidebar you should see a column of add-on icons. Click the **emAIl Sentinel** icon.

**Tell us out loud:** What does the home card look like? In your own words, what do you think this product does?

---

### Task 2 — Enter your Gemini API key (2 min)

1. From the home card, click **Settings**.
2. Paste the Gemini API key from the "Pre-supplied credentials" section above into the **Gemini API key** field.
3. Click **Save settings**. You should see a brief confirmation toast.
4. Click **Test Gemini**. Wait for the toast — it should read *"Gemini OK — model responded."*

**Tell us out loud:** Was the Gemini key setup clear? Did you know what Gemini is, or was it unfamiliar?

---

### Task 3 — Configure your SMS provider and send a test text (6 min)

1. Still in Settings, scroll down to the **SMS provider** section.
2. Follow the **Provider setup steps** from "Your credentials" above to enter your `<PROVIDER_NAME>` credentials.
3. Click **Save settings**.
4. Scroll down to **SMS recipients**. Click **+ Add SMS recipient**.
   - **Name:** anything (e.g. "My phone")
   - **Country code:** select the country matching your phone number
   - **Phone number:** digits only — no spaces, dashes, or country code (e.g. `2105551234` for a US +1 210 555 1234 number)
   - Click **Save**.
5. Scroll down to **Test phone number**. Select the same country code and enter the same digits.
6. Click **Save settings**.
7. Click **Send test SMS**.

**Tell us out loud:**
- Did the test SMS arrive on your phone? How long did it take?
- Was anything confusing about entering the provider credentials — field labels, where to find the values in your `<PROVIDER_NAME>` dashboard, the country-code / digits-only split?
- Did you expect a confirmation from the add-on before the text arrived, or was waiting without feedback OK?

---

### Task 4 — Create a rule with an SMS alert (4 min)

1. Return to the home card (open the kebab "⋮" menu → **Home**, or tap the back arrow if visible).
2. Click **Rules** → **+ New rule**.
3. Fill in the rule editor:
   - **Rule name:** anything (e.g. "SMS test rule")
   - **Gmail labels to watch:** type `INBOX`
   - **Rule text:** write a plain-English description — for example: *"Any email with the word SENTINEL in the subject line."* You may use the **Help me write the rule text** button if you want, but it is not required.
4. Under **Alert channels**, find the **SMS** section and tick the recipient you added in Task 3.
5. Click **Save**.

**Tell us out loud:** Was the rule editor layout clear? When you ticked your phone number in the SMS section, did you feel confident a text would actually fire when a matching email arrived?

---

### Task 5 — Trigger the rule and confirm the SMS arrives (4 min)

1. In Gmail, click **Compose**. Send yourself an email with **subject line `SENTINEL test 1`** (the trigger word from your rule). The recipient can be your own address.
2. Wait about 10 seconds for the email to land in your inbox.
3. Switch to the emAIl Sentinel add-on. Open the kebab "⋮" menu and click **Scan email now**. A card titled **Scan email now** appears — read the description, then click the purple **Run scan now** button.
4. The button shows a spinner while the scan runs (10–60 seconds). When it finishes, the result card should read *"Scan complete — 1 new email, 1 match"* in green.
5. Within about 30 seconds of the result card appearing, a text should arrive on your phone.

**Tell us out loud:**
- Did the text arrive? Was it within a reasonable time?
- Read the text message aloud. Is the content clear and useful — would you want to receive exactly this text for a real important email?
- Was the "Scan email now" path obvious? Were you unsure at any point whether the scan was running?

---

### Task 6 — Wrap-up questions (2 min)

1. In your own words, what does this product do?
2. What was most confusing — the Gemini key, the provider credential setup, the phone number entry format, or something else?
3. Did the text message content feel right? Too much information, not enough, or about right?
4. How does this compare to how you currently get notified about important emails?
5. The add-on costs **$4.99/month** (or $39/year) for unlimited rules and Pro-only channels (Google Chat, external integrations). SMS and the five Google channels (Calendar, Sheets, Tasks, Docs) are included on the **free plan**. The SMS provider's own per-message fees are separate — billed directly by `<PROVIDER_NAME>`. Would you use the free plan? Would you pay $4.99/month for the Pro version? Why?

---

## Notes for the developer (not shown to tester)

- **A2P 10DLC (Twilio testers only):** if the tester's number is unregistered, delivery will silently fail with error 30034. Ask them to check Twilio Console → Monitor → Logs → Messaging for the error code.
- **Textbelt free-tier rate limit:** the `textbelt` key allows 1 SMS/24 h per IP. If a tester re-runs Task 3 or 5 mid-session the second SMS will be rejected. The error toast should mention this — confirm it does.
- **Country-code / digits-only split:** this is the highest-friction UI element. Watch carefully whether testers enter the full E.164 number in the digits field (including country code and +), which produces a malformed number. The hint text reads "e.g. 5551234567 — country code is added from the dropdown above" — note if testers read it.
- **ClickSend "From" field:** ClickSend does not require a dedicated "From" number — the add-on uses the account username as the sender ID. Confirm this still renders acceptably on the tester's handset.
- **Vonage sandbox vs. live:** Vonage free trial accounts start in sandbox mode where only verified numbers can receive messages. If delivery fails, the tester may need to add their number as a test number in the Vonage dashboard. Note whether this is clear from the add-on's error message.
- **Telnyx:** requires a Messaging Profile linked to the "From" number. If the tester's number is not linked to a profile, delivery will fail silently. Ask them to verify in the Telnyx portal.
- **Activity log:** after a successful scan, the tester should see a log entry in Activity log (kebab menu). Note whether they find it unprompted and whether the entry text makes sense to a non-developer.
- **Timing signal:** note how long from Run scan now to SMS receipt for each provider. Outliers indicate API latency issues worth investigating.
