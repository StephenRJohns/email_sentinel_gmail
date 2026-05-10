# Script C SMS Provider — Pre-flight Setup

Developer setup work before running a Script C (SMS provider validation) round. Script C sessions are **direct-recruited** — you find testers yourself rather than buying them through UserTesting.com. Testers must already have an active account with the SMS provider you assign to them.

**Prerequisites (one-time, not per-round):**
- `gcloud` CLI installed and authenticated (needed only if you are creating a fresh Gemini sandbox for this round; skip if reusing a key from an active Script A round)
- `tools/preflight/sms_preflight.env` created and filled — see Step 1 below

---

## Step 1 — Configure your SMS provider credentials (~10 min)

Copy the example env file and fill in credentials for every provider you plan to test:

```bash
cp tools/preflight/sms_preflight.env.example tools/preflight/sms_preflight.env
```

Then open `tools/preflight/sms_preflight.env` and fill in:

| Variable | Where to find it |
|---|---|
| `DEV_PHONE_NUMBER` | Your own mobile number — digits only, no spaces or dashes |
| `DEV_PHONE_COUNTRY` | Country code with `+` prefix (default `+1`) |
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account Info panel |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account Info panel (click to reveal) |
| `TWILIO_FROM_NUMBER` | Active Twilio number — Phone Numbers → Manage → Active numbers |
| `TELNYX_API_KEY` | Telnyx portal → API Keys → create or copy a V2 key |
| `TELNYX_FROM_NUMBER` | Active number with a Messaging Profile assigned |
| `PLIVO_AUTH_ID` | Plivo Console → Overview |
| `PLIVO_AUTH_TOKEN` | Plivo Console → Overview (click to reveal) |
| `PLIVO_FROM_NUMBER` | Active Plivo number — Phone Numbers |
| `CLICKSEND_USERNAME` | Your ClickSend account email address |
| `CLICKSEND_API_KEY` | ClickSend dashboard → Developers → API Credentials |
| `VONAGE_API_KEY` | Vonage dashboard → API Settings |
| `VONAGE_API_SECRET` | Vonage dashboard → API Settings (click to reveal) |
| `TEXTBELT_API_KEY` | Use the literal string `textbelt` for the free shared token, or your paid token |

Only fill in providers you have accounts for. Blank values are skipped by the validation script.

> `tools/preflight/sms_preflight.env` is gitignored — it holds live credentials and your personal phone number. Never commit it.

---

## Step 2 — Validate all configured providers (~10 min)

Run the validation script. It checks credentials for every configured provider and then sends a live test SMS from each one to your phone.

```bash
bash tools/preflight/validate_sms_providers.sh
```

Use `--check-only` to verify credentials without sending any SMS:

```bash
bash tools/preflight/validate_sms_providers.sh --check-only
```

The script prints a summary table:

```
============================================================
  Summary
============================================================
  Provider      Auth        SMS
  --------      ----        ---
  twilio        ✅ pass     ✅ pass
  telnyx        ✅ pass     ✅ pass
  plivo         —  skip     —  skip
  clicksend     ✅ pass     ✅ pass
  vonage        ❌ fail     —  skip
  textbelt      ✅ pass     ✅ pass
============================================================
```

**Fix every ❌ before proceeding.** Common causes:

| Provider | Common failure | Fix |
|---|---|---|
| Twilio | 401 — wrong Account SID or Auth Token | Re-copy from Console → Account Info panel |
| Twilio | SMS queued but never delivered | A2P 10DLC campaign unregistered or failed — check Console → Monitor → Logs → Messaging for error 30034 |
| Telnyx | SMS fails with 401 or profile error | Confirm the From number has a Messaging Profile assigned in the Telnyx portal |
| Plivo | 401 | Re-copy Auth ID and Auth Token from Console → Overview |
| ClickSend | 401 | Confirm username is the account email, not a display name |
| Vonage | SMS accepted (HTTP 200) but `message status` non-zero | Free-trial accounts require the destination number to be added as a test number — Vonage dashboard → Test numbers |
| Textbelt | `quotaRemaining: 0` | Free `textbelt` token is rate-limited to 1 SMS/day/IP — wait 24 hours or use a paid token |

> **A2P 10DLC (Twilio US-to-US):** If your Twilio Campaign is in "Submitted" or "In progress" state, delivery will fail with error 30034 until carrier approval completes. Campaign review typically takes 24–72 hours. Do not schedule Twilio testers until the campaign shows "Registered."

---

## Step 3 — Gemini key and deploy URL

Script C requires the same two developer-supplied items as Script A:
- A Gemini API key scoped to the emAIl Sentinel test deployment
- The Marketplace SDK install URL for the test deployment

**If you have an active Script A round in progress:** reuse the same sandbox key and deploy URL — there is no reason to create a separate GCP project.

**If no Script A round is active:** run the Script A Step 1 and Step 2 automation:

```bash
bash tools/preflight/step1_create_sandbox.sh ROUND_NUM
bash tools/preflight/step2a_enable_sdk.sh APPS_SCRIPT_GCP_PROJECT_ID
```

See `docs/preflight_setup.md` Steps 1 and 2 for full details.

---

## Step 4 — Pre-flight self-test (~20 min)

Run Script C yourself with one provider before sending it to any tester. Choose the provider you are most confident in.

1. Install the add-on via the deploy URL on a fresh (non-dev) Google account.
2. Enter the sandbox Gemini key.
3. Configure the provider credentials in Settings.
4. Add your mobile number as an SMS recipient.
5. Send a test SMS — confirm it arrives within ~30 seconds.
6. Create a rule using the word SENTINEL as the trigger.
7. Send yourself an email with subject `SENTINEL test 1`.
8. Click "Scan email now" → confirm the scan result card shows 1 match and a text arrives.

**Pass threshold:** all 5 steps (install → Gemini key → provider config → rule → triggered SMS) complete in under 14 minutes as a developer. Budget testers will run ~50 % longer — if your self-test hits 14 min, simplify the rule or pre-fill provider credentials before tester sessions.

**Things to spot-check:**
- Do provider credential field labels match what each provider's dashboard calls them? (e.g., Twilio calls it "Auth Token", not "API secret".)
- Does the country-code / digits-only split on the SMS recipient form cause confusion? Watch whether you instinctively include the country code in the digits field.
- Does the ClickSend "From" display sensibly on your handset? (ClickSend uses the account username, not a phone number.)
- Does the test SMS error toast name the provider and give an actionable hint if credentials are wrong? (Test with a deliberately wrong value.)
- Does the activity log entry after a scan read clearly to a non-developer?

---

## Step 5 — Recruit testers and assign providers (~30 min)

### 5a. Who to recruit

Script C testers must already have an active account with the assigned provider. Good sources:
- Developer friends who have Twilio or Telnyx accounts for personal projects
- Product/startup communities (Indie Hackers, Product Hunt makers Slack, Solo Founders Discord) — many members have Vonage, Plivo, or Twilio accounts
- Your own professional network — anyone who has integrated SMS into a SaaS product

Target 1–2 testers per provider (max 2 per provider, 6 providers = up to 12 sessions). Prioritize providers you expect to get the most real-world use: Twilio and Telnyx first, then ClickSend and Vonage, then Plivo and Textbelt.

### 5b. Assign providers and fill scripts

```bash
bash tools/preflight/step4c_fill_sms_scripts.sh ROUND GEMINI_KEY DEPLOY_URL
# e.g.:
# bash tools/preflight/step4c_fill_sms_scripts.sh 1 AIza... https://workspace.google.com/...
```

All three arguments can be omitted — the script prompts for each. It shows a live availability board (each provider has a 2-session cap) and lets you assign interactively. It writes one filled script per tester to `usertesting/outgoing/round_N/` (gitignored):

```
script_c_sms_tester_001_twilio.md
script_c_sms_tester_002_twilio.md
script_c_sms_tester_003_telnyx.md
...
```

Every file has the provider-specific "Your credentials" block filled in (what fields to find, where to find them in that provider's dashboard) and the shared Gemini key and deploy URL substituted.

### 5c. Distribute to testers

Script C sessions are unmoderated screen recordings — the same format as Script A. Send each tester their filled script via email, Notion doc, or Google Doc. Ask them to record using Loom or UserTesting's recorder if you want video; a written summary also works if video is impractical.

Unlike Script A (which goes through UserTesting.com's panel), Script C is direct-recruited and free — no per-session fee. The trade-off is that you handle scheduling and follow-up yourself.

**No promo codes needed:** Script C has no Pro-gating in the tested path (SMS works on the Free tier). Do not send a promo code unless you want to test Pro-tier behavior specifically.

---

## Step 6 — Triage and fix (~2–4 hr after sessions return)

```bash
cp usertesting/docs/triage_template.md \
   usertesting/findings/round_N_$(date +%Y-%m-%d)_sms_findings.md
```

Watch each recording at 1.5×. One row per distinct issue. Tag each row with the provider so provider-specific bugs are easy to spot.

High-signal things to watch for across all providers:
- **Country-code / digits-only split** — testers including the country code in the digits field. This is the highest-friction UI element. Note whether the hint text `"e.g. 5551234567 — country code is added from the dropdown above"` was read.
- **Field label mismatch** — tester opens the provider dashboard but cannot find the credential because the add-on's label does not match the dashboard's label. Note exact mismatch.
- **Silent delivery failure** — test SMS button returns success toast but no text arrives. Log the provider and tester's account type (free trial vs. paid).
- **Error toast clarity** — when delivery fails, is the error message actionable? Does it name the provider? Does it suggest what to check?
- **Timing** — note how long from "Send test SMS" to SMS receipt per provider. Outliers (> 30 s) indicate API latency issues.

---

## Step 7 — Rotate credentials after the round

After all sessions complete:

1. **Revoke the sandbox Gemini key** (if created for this round):
   GCP Console → `emailsentinel-usertesting-r<N>` → APIs & Services → Credentials → find "UserTesting Round N — Gemini key" → Delete.

2. **Create a fresh deploy URL** for the next round if needed (new Marketplace SDK deployment).

3. Testers retain access to the add-on (the install persists) but the Gemini key stops working — they cannot run new scans. That is the intended post-round state.

---

## Round cost and time budget

| Step | Cost | Time |
|---|---|---|
| Step 1 — fill `sms_preflight.env` | $0 | ~10 min |
| Step 2 — validate all providers (`validate_sms_providers.sh`) | $0 (minimal SMS costs if providers charge per message) | ~10 min |
| Step 3 — Gemini key + deploy URL (reuse from Script A or create new) | $0–$5 cap | ~5 min (reuse) or ~30 min (new) |
| Step 4 — pre-flight self-test | $0 | ~20 min |
| Step 5 — recruit + assign + distribute scripts (`step4c_fill_sms_scripts.sh`) | $0 | ~30 min |
| Wait for sessions | $0 | 1–2 weeks (your time: 0) |
| Step 6 — triage + fix | $0 | ~2–4 hr review + fixes |
| Step 7 — rotate credentials | $0 | ~10 min |
| **Total** | **~$0** | **~6–8 hr of dev time over ~2–3 weeks** |

> The only monetary cost is whatever your SMS providers charge for test messages during Step 2 and the tester sessions. Most providers include free trial credits; Textbelt's free token is genuinely free at 1 SMS/day.
