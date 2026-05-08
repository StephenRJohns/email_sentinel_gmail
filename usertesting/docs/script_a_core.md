# UserTesting — Script A: Core install + first rule + all five Google channels

**Target session length:** 20 minutes (unmoderated, screen + audio recording)
**Cohort within Round 1:** 10 of 10 sessions
**Pre-supplied to tester:**
- Test-deployment install URL (issued by developer; see "Pre-flight" section below)
- Gemini API key (rotate after the round; see "Credentials" section)
- One-time-use Pro promo code (unique per tester; revoked / single-use after redemption)

---

## What this product is (one-line summary for tester intro)

emAIl Sentinel is a Gmail add-on that watches your inbox and sends you alerts (Calendar event, Chat message, Sheet row, Task, Doc entry, SMS) when emails matching plain-English rules arrive — for example, "alert me when I get an email from any client mentioning a deadline."

---

## Screener questions (submit with the test on UserTesting)

Tester must answer **yes** to all five to qualify:

1. Do you use Gmail daily as your primary email account?
2. Do you receive 50+ emails per day in Gmail (work + personal combined)?
3. Are you in one of these roles: small business owner, freelancer/consultant, salesperson, real estate agent, paralegal, recruiter, or another role where missing an important email has real consequences?
4. Are you in the United States?
5. Does your Google account have **Google Chat** enabled? You can verify by visiting **chat.google.com** in your browser and signing in — if you can open it and see the "Spaces" section in the left sidebar, you qualify. Personal Gmail accounts and most Google Workspace business plans have Chat enabled by default. Some school accounts and enterprise accounts have Chat disabled by their administrator and would NOT qualify.

Tester must answer **yes** to one of:

6a. Have you ever installed a Gmail add-on, browser extension, or Workspace add-on before?
6b. Are you comfortable installing software in your browser when given a link?

---

## Tester briefing (read by tester at session start)

You're going to test a Gmail add-on called emAIl Sentinel that's in private pre-launch testing. You'll install it, set it up, and create one rule that alerts you in **five Google places at once** — Calendar, Chat, Sheets, Tasks, and Docs — when a matching email arrives. We've supplied a promo code that unlocks the paid features for this session so every channel is available to you.

**Important — you'll see a warning page during install** that says *"This app hasn't been verified by Google yet."* That's expected — this is a private pre-launch test, not a publicly listed app. Click **Continue** and **Allow** when you see those screens.

**Please do NOT click "Start scheduled scans"** (the filled button below the **Scan email every** dropdown) even though it's prominent on the home card. Background scans run every 1+ hour and cannot deliver a result during this 20-minute session — we will use the **Scan email now** button instead, which runs an immediate scan on demand. You will see Start scheduled scans and the dropdown early; just leave them alone and follow the tasks below.

Please **think aloud the entire time** — narrate what you're looking at, what you expect to happen, what's confusing, and what you'd do next. There are no wrong answers; we want to understand your honest reactions to the product.

---

## Pre-supplied credentials

(The developer fills these in for each round and rotates them after the round closes.)

- **Gemini API key:** `<DEV_GEMINI_KEY>` — paste this into Settings → Gemini API key when prompted.
- **Test-deployment install URL:** `<TEST_DEPLOYMENT_URL>` — the URL you'll visit to install the add-on.
- **Pro promo code:** `<TESTER_PROMO_CODE>` — a one-time code that flips your account to the Pro tier so you can use Google Chat as an alert channel. You'll redeem it in Task 2.

---

## Tasks

### Task 1 — Install the add-on (3 min)

1. Open `<TEST_DEPLOYMENT_URL>` in your browser. Sign in to Gmail if asked.
2. You'll see a Google consent screen titled *"This app hasn't been verified by Google yet"*. Click **Continue** → review the permissions → click **Allow**.
3. Reload Gmail (`mail.google.com`). On the right side of your inbox, you should see a column of add-on icons. Click the **emAIl Sentinel** icon (it looks like a small shield or eye — find it).

**Tell us out loud:** What did you expect to see when the icon opened? What does the home card look like? In your own words, what does this product do?

### Task 2 — Setup: Gemini key, redeem Pro code, add a Chat space (8 min)

This is the longest task. Take your time and narrate as you go — the order of these sub-tasks reflects how a real new user would set things up before writing rules.

#### 2a. Gemini API key

1. From the home card, click **Settings**.
2. Find the **Gemini API key** field at the top. Paste the key the moderator gave you: `<DEV_GEMINI_KEY>`.
3. Click **Save settings**. You should see a confirmation toast.
4. Click **Test Gemini**. You should see *"Gemini OK — model responded."*

#### 2b. Redeem the Pro promo code

1. Return to the home card (open the kebab "⋮" menu and pick **Home**, or tap the back arrow if visible). At the bottom of the home card you should see a section titled **Enter a promo code to upgrade to Pro**.
2. Paste the code the moderator gave you into the **Enter promo code** field: `<TESTER_PROMO_CODE>`.
3. Click **Redeem code**. You should see a toast: *"Pro plan activated. Welcome!"* The home card refreshes; the **Plan** row at the top now reads *"Pro"* instead of *"Free"* and the promo code section is no longer visible (your account is now Pro).

#### 2c. Add a Google Chat space

1. Open a new browser tab and go to `chat.google.com`.
2. In the left sidebar under **Spaces**, either pick an existing Space you have permission to add webhooks to, or click **+** at the top of the Spaces list to create a new one (give it any name like "emAIl Sentinel test"). If creating a new Space, you can leave it as just yourself — webhooks work in single-member Spaces.
3. Click the **space name in the header** (the title at the top of the Space's main pane).
4. From the dropdown menu, click **Apps & integrations**, then click **Webhooks**.
5. Click **+ Add webhook**. Give it any name (e.g. "emAIl Sentinel"). Click **Save**.
6. The dialog shows a **Webhook URL** — click the copy icon next to it.
7. Switch back to the emAIl Sentinel Settings tab. Scroll to the **Google Chat spaces** section and click **+ Add Chat space**.
8. Fill in the editor: **Space name** is anything you want (e.g. "Test space"). Paste the webhook URL into **Webhook URL**. Click **Save**.

**If after 5 minutes you cannot get the webhook URL** (Google's Chat UI sometimes hides webhook creation behind admin policy), narrate what blocked you and skip to Task 3 — we will tick the four other channels and treat the Chat-setup difficulty as itself a finding.

**Tell us out loud:**
- (2a) Did you understand what a "Gemini API key" is from the on-card text alone?
- (2b) Was the promo redemption smooth? Did anything about the promo code section at the bottom of the home card feel out of place or hidden?
- (2c) How easy was it to find the webhook setting in Google Chat? At any point did you feel lost? If so, where?

### Task 3 — Create your first rule with all five Google channels (4 min)

1. Return to the home card (open the kebab "⋮" menu and pick **Home**, or use the back arrow if visible).
2. Click **Rules** → **+ New rule**.
3. Give the rule any name you want (e.g. "My first rule").
4. In **Gmail labels to watch**, type `INBOX`.
5. In **Rule text**, write a plain-English description of what kind of email should trigger this rule. Type one yourself — for example: *"Any email with the word DEMO in the subject line."* Below the text field you will also see a button labeled **Help me write the rule text** (because you are on Pro). Do not click it for this task; just note that it is there.
6. Under **Alert channels**, tick **all five Google channels**:
   - **Google Calendar — create an event**
   - **Google Sheets — append a log row**
   - **Google Tasks — create a task**
   - **Google Docs — append a log entry**
   - And under **Google Chat spaces**, tick the space you added in Task 2c (if you got that far). If you did not finish 2c, skip the Chat tickbox.
7. Click **Save**.

**Tell us out loud:** How did you decide what to type as the rule text? Did the five channel tickboxes feel like too many, the right amount, or were any of them surprising? What did you expect to see after Save?

### Task 4 — Send yourself a test email and confirm the alert in all five places (3 min)

1. In Gmail, click **Compose**. Send yourself an email that should trigger the rule (e.g., subject line `DEMO test 1`).
2. Wait about 10 seconds for the email to land in your inbox.
3. Open the emAIl Sentinel add-on again. Open the kebab "⋮" menu and click **Scan email now**. A card titled **Scan email now** opens — read the description, then click the purple **Run scan now** button.
4. The button shows a spinner while the scan runs (10–60 seconds). When it finishes, a result card appears: *"Scan complete — 1 new email, 1 match"* in green.
5. Verify the alert in **each of the five surfaces** — open them in browser tabs and check for a new entry from around the current time:
   - **Calendar** (`calendar.google.com`) — a new event titled *"[emAIl Sentinel] My first rule: DEMO test 1"*.
   - **Sheets** — open the spreadsheet titled *"emAIl Sentinel Log"* in your Drive (`drive.google.com`) — a new row appended.
   - **Tasks** (`tasks.google.com`) — a new task in your default list.
   - **Docs** — open the doc titled *"emAIl Sentinel Log"* in your Drive — a new entry appended.
   - **Chat** — open the Space you set up in Task 2c — a new message from the webhook with the alert text.

**Tell us out loud:** Which channels showed up? Which surface felt the most useful for catching the alert? Were any of the five formats confusing or unhelpful? How confident are you that this would work for a real email you cared about?

### Task 5 — Wrap-up questions (2 min)

Please answer these aloud:

1. In your own words, **what does this product do**? Could you explain it to a coworker?
2. **What was confusing** during this session?
3. **What did you expect to happen** that didn't?
4. The product will cost **$4.99/month** (or $39/year) for unlimited rules and Pro-only alert channels (Google Chat, custom MCP, custom webhooks). The free tier covers 3 rules and SMS, Calendar, Sheets, Tasks, and Docs alerts — but NOT Chat. Today's session was on the **paid Pro tier** (the promo code we gave you unlocked it), so you experienced Chat alerts. **Would you pay $4.99/month for the Pro version you just used?** Or would the free tier (no Chat, max 3 rules) be enough? Why?
5. **Who do you know** who would benefit from this product? (Optional — names not needed, just job titles or scenarios.)

---

## Questions?

If you run into a technical problem during the session or have a question for the developer, email **dev@jjjjjenterprises.com**.

---

## Notes for the developer (not shown to tester)

- The "unverified app" warning will be Google's standard consent screen until OAuth verification clears. Don't try to skip it — that bail rate is a useful pre-launch signal.
- Pre-supplied Gemini key should be on a dedicated dev account with a $5–10 billing cap. Rotate after the round.
- **Promo codes are dev-mint, tester-redeem-only.** Testers can never create promo codes — the add-on UI exposes only the redemption section (input + Redeem code button), and code minting lives in the separate standalone admin/service Apps Script project that testers have no access to. Mint one unique code per tester (10 codes for a 10-session round) via that standalone project — see `scripts/PromoCodeAdmin.gs`. Each tester's code substitutes for `<TESTER_PROMO_CODE>` in their copy of this script. Codes are single-use; reusing one across two testers will lock the second tester out of Pro. Unredeemed codes are voided at the round close as part of the same secret-rotation pass that revokes the Gemini key.
- The `PROMO_SERVICE_URL` Script Property must be set on the test-deployment Apps Script project — without it the promo code section at the bottom of the home card will not render and Task 2b is impossible.
- **Chat-setup is the highest-friction task.** Real testers will struggle with the chat.google.com Apps & integrations menu. Before declaring the test broken: a tester who narrates getting stuck at webhook creation but completes Tasks 3 and 4 with the four free Google channels still produces a complete-enough session to count for Round 1. The Chat-completion rate is itself the metric we're measuring on this task.
- If a tester closes Gmail mid-task or the add-on icon doesn't appear after install, that's a finding — don't coach them around it.
- Watching the recordings: pay particular attention to Task 1 ("what does this product do") — if the home card doesn't communicate the value prop in 30 seconds without explanation, that's the highest-priority fix. Also watch Task 2c (Chat setup) closely — that step has the highest expected difficulty and the most variance per tester.
- If a tester runs out of time before Task 5, they still produce useful data — Tasks 1–4 cover the install funnel + multi-channel setup, which is what most matters before Marketplace launch.
