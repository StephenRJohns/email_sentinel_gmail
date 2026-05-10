# UserTesting Round N — Pre-flight setup

> **Round number convention:** every directory and filename writes the round number as 3-digit zero-padded — `round_001`, `round_010`, `round_100`. The preflight scripts in `tools/preflight/` enforce this via `printf '%03d'`. References below that say `round_<NNN>` or `round_NNN` mean "fill in your round number, padded to 3 digits."

One-time setup work the developer does before submitting a round to UserTesting. Each step has a time budget and a "validate before continuing" check. Do not pay for sessions until Step 3 (pre-flight self-test) passes.

**Prerequisites (one-time, not per-round):**
- `gcloud` CLI installed and authenticated: `gcloud auth login && gcloud auth application-default login`
- Python promo tool configured: see `tools/promo/.env.example`

---

## Step 1 — Dedicated Gemini API key with a $5 billing cap (~5 min)

The point: a sandboxed key on a separate GCP project with a spend cap so a runaway tester loop cannot drain your real Gemini budget.

### Run the script

```bash
bash tools/preflight/step1_create_sandbox.sh ROUND_NUM
# e.g.: bash tools/preflight/step1_create_sandbox.sh 1
```

**What it does automatically:**
- Creates GCP project `emailsentinel-usertesting-r<NNN>`
- Links your billing account
- Enables the Generative Language API
- Creates a `$5` budget alert (notifies at 50 %, 90 %, 100 % of spend)
- Creates an API key scoped to the Generative Language API
- Validates the key with a live Gemini call

**One manual step the script cannot do** (Cloud Console UI only):

> Cloud Console → `emailsentinel-usertesting-r<NNN>` → APIs & Services → Generative Language API → **Quotas** → set **Requests per day** to **200**.
>
> The budget alert notifies but does not hard-kill spending. The quota cap does. 10 testers × ~10 calls each = 100 calls; 200 gives headroom but caps a runaway loop.

**Save the key** that the script prints to your password manager:
`UserTesting Round N — Gemini key — created YYYY-MM-DD`

---

## Step 2 — Marketplace SDK install URL (~2–3 hours, NOT 10 min)

> ⚠ The Apps Script Editor's "Test deployments" dialog only installs the add-on for the currently-signed-in (dev) account — it does NOT generate a public install URL. External testers need a Marketplace SDK install URL even for unverified pre-launch testing. This makes Step 2 substantially heavier than originally scoped; it is pull-forward of pre-launch critical-path work that has to happen for the public launch anyway.

### 2a. Enable the SDK (automated)

```bash
bash tools/preflight/step2a_enable_sdk.sh APPS_SCRIPT_GCP_PROJECT_ID
```

The project ID is the GCP project **linked to the email_sentinel Apps Script project** — find it in the Apps Script editor under **Project Settings → Google Cloud Platform (GCP) Project**. This is NOT the sandbox project from Step 1.

The script enables `appsmarket.googleapis.com` and then prints a checklist of the remaining manual steps with a direct Cloud Console URL.

### 2b–2c. App Configuration + Store Listing (manual, ~2 hr)

In Cloud Console → Marketplace SDK → **APP CONFIGURATION** tab, fill in:
- App name (must match OAuth consent screen exactly)
- Icon, banner, screenshots
- OAuth scopes (must match `appsscript.json`)
- Developer details, ToS URL (`emailsentinel.jjjjjenterprises.com/legal/terms`), Privacy URL (`emailsentinel.jjjjjenterprises.com/legal/privacy`)

In the **STORE LISTING** tab:
- Short description, Category
- Regions: **United States only** (matches `legal/TERMS.md` §2)
- Language: English

### 2d. Publish the OAuth consent screen

APIs & Services → **OAuth consent screen** → **Publish App** (moves from Testing → In Production). This allows external Google accounts to install (with the unverified-app warning) up to a 100-user lifetime cap until OAuth verification clears.

### 2e. Get the install URL

After saving the SDK draft (**do not** click "Publish to Marketplace" — that triggers Google's listing review on top of OAuth review), retrieve the pre-publication install URL from the APP CONFIGURATION or OVERVIEW tab. Save it — it is required for Step 4b.

### 2f. Validate the URL

Open it in Incognito signed into a non-dev Google account. Accept the unverified-app consent. Reload Gmail. Confirm the emAIl Sentinel icon appears in the right rail. **Fix any failures before Round 1 — testers cannot get past install issues you haven't already discovered.**

### 2g. Skip-this-step alternative

If you don't have 2–3 hours right now, share the Apps Script project as **Viewer** with each tester's Gmail address — they install via script.google.com. Trade-off: testers get source-code access. Flip `email_sentinel` to private on GitHub first if you take this path.

---

## Step 3 — Pre-flight self-test on a fresh Google account (~30 min)

This is the most important step. You run Script A end-to-end as if you were a paying tester, with a stopwatch.

### 3a. What you need

- A Google account that is NOT your dev account (create a throwaway Gmail or use a personal account)
- A clean browser session signed into that account
- The fresh account must have Google Chat enabled (verify at `chat.google.com` — Spaces sidebar visible)
- A single-use Pro promo code minted for this self-test (one of the +1 reserve codes from Step 4a — mint those first, keep one aside)

### 3b. Run the automated portion first

The Playwright suite covers Tasks 1–4 of Script A. Run it against the test-deployment using the dedicated E2E Chrome profile (see `testing/playwright/e2e.config.env` — point `GOOGLE_EMAIL` and `TEST_PROMO_CODE` at the fresh test account and self-test reserve code):

```bash
bash testing/run_script_a.sh
```

Tasks that need env vars set in `e2e.config.env` before running:

| Env var | Used by |
|---|---|
| `GEMINI_API_KEY` | Task 2a — paste the Round N sandbox key here |
| `TEST_PROMO_CODE` | Task 2b — the self-test reserve code |
| `CHAT_WEBHOOK_URL` | Task 2c — a webhook from your own Chat Space |
| `GOOGLE_EMAIL` | Task 4 — the fresh test account address |

### 3c. Walk Tasks 3–5 manually

Tasks 3 (rule creation observation), 4 (multi-channel alert verification), and 5 (wrap-up interview) require human observation. After the Playwright run, walk them using:

```bash
bash testing/walk_script_a.sh --resume
```

### 3d. Pass thresholds

| Script | Self-test target | If you go over |
|---|---|---|
| Script A (core + 5 Google channels) | ≤ 14 min as developer | Real testers go ~50 % longer → > 21 min. If Task 2c (Chat webhook) consistently runs > 5 min, pre-supply a webhook URL and reduce 2c to a paste step. |

### 3e. Things to spot-check during pre-flight

- Does the home card communicate "what is this product?" within 30 seconds? (Task 1 hinges on this.)
- Does the promo code section appear on Free tier and disappear after redemption?
- Does the chat.google.com webhook walkthrough match current Google Chat UI? Update Task 2c step 4 if the menu has shifted.
- Do all five Google channels fire from a single rule? Missing tail-end channels (Docs, Chat) usually mean the run hit `MAX_RUN_MS` — simplify the rule prompt to reduce Gemini latency.
- Does the unverified-app consent warning match your scripts ("Continue → Allow")?
- Is the activity log line clear to a non-technical tester?
- Does the home card show the Scan email every dropdown above Start scheduled scans? Script A's briefing tells testers to ignore both — confirm the copy is still accurate.

### 3f. Fix what you find before Step 4

Time budget: 30 min self-test + up to 60 min fixes. Fix and re-run pre-flight if you find structural issues (broken install flow, unintuitive Gemini key entry).

---

## Step 4 — Mint codes + fill scripts + submit to UserTesting (~30 min)

> **Round scope:** All sessions run **Script A** (core install + first rule + all five Google channels including Chat). Script B is retired for all rounds. The "Start scheduled scans" path is out of scope (cannot deliver a result inside a 20-min session).

### 4a. Mint per-tester promo codes

Generate **11 codes** total — 10 for testers, 1 reserved for the Step 3 self-test. Use the promo CLI from repo root:

```bash
python -m tools.promo.cli mint usertest-round-NNN 11 --label "Round N — minted YYYY-MM-DD"
```

This writes `promo_codes/usertest-round-NNN.txt` with all codes. Confirm `PROMO_SERVICE_URL` is set in the **add-on project's** Script Properties — without it the home card hides the promo redemption section and Task 2b is impossible.

Fallback (no Python tool): edit `BATCH_NAME` / `BATCH_QTY` / `BATCH_LABEL` in `scripts/PromoCodeAdmin.gs`, run `runGenerateBatch` from the Apps Script editor, copy codes from Logger output. Revert the constants before any future commit.

### 4b. Fill placeholders (automated)

```bash
bash tools/preflight/step4b_fill_scripts.sh ROUND GEMINI_KEY DEPLOY_URL BATCH_FILE
# e.g.:
# bash tools/preflight/step4b_fill_scripts.sh 1 AIza... https://workspace.google.com/... promo_codes/usertest-round-001.txt
```

All four arguments can be omitted — the script prompts for each (and auto-detects the most recent batch file). It writes one filled file per tester to `usertesting/outgoing/round_NNN/` (gitignored). Every file has a unique promo code; never reuse a code across two testers.

### 4c. Sign up for UserTesting

If you don't have an account: **https://www.usertesting.com/** → sign up.

### 4d. Configure the test — Script A only, 10 sessions

1. Create a new test → **Unmoderated / Self-serve**
2. Devices: **Desktop only**
3. Browser: any (Chrome and Firefox both work)
4. Session length: **20 minutes**
5. Tester profile filters (from Script A's screener questions section):
   - Heavy Gmail user (50+ emails/day)
   - One of: small business owner / freelancer / salesperson / real estate agent / paralegal / recruiter
   - US-based
   - Google Chat enabled (`chat.google.com` — Spaces sidebar visible)
   - Has installed a browser extension before, OR comfortable installing software when given a link
6. Tasks: paste Script A tasks 1–5 from the per-tester filled file in `usertesting/outgoing/round_NNN/`. Clone the test 10 times and use a different filled file each time — the only difference between sessions is the `TESTER_PROMO_CODE` line in Task 2b.
7. Session count: **10 sessions**
8. Submit

### 4e. Pay

~$49 × 10 = **~$490** total. UserTesting charges per session at submission.

---

## Step 5 — When sessions return (1–2 weeks later)

UserTesting emails you when each session completes. Recordings trickle back over 1–2 weeks.

### 5a. Watch and note

```bash
cp usertesting/docs/triage_template.md \
   usertesting/findings/round_NNN_$(date +%Y-%m-%d)_findings.md
```

Watch each recording at 1.5× speed. Fill the findings table as you go — one row per distinct issue, verbatim quotes when possible.

### 5b. Group and fix

After all 10 sessions, sort by severity (5+ testers = critical, 2–4 = important, 1 = backlog). Fix critical + important in priority order. Push with `clp`. Update the **Fix status** column as each ships.

### 5c. Rotate credentials (required before Round N+1)

```bash
# Void unredeemed promo codes
python -m tools.promo.cli void-batch usertest-round-NNN

# Revoke the Gemini key
# GCP Console → emailsentinel-usertesting-rN → APIs & Services → Credentials
# → find "UserTesting Round N — Gemini key" → Delete

# Create a fresh deploy URL for next round (new Marketplace SDK deployment)
```

### 5d. Optional Round N+1

After fixes ship, run a smaller round (~5 sessions, ~$245) to verify regressions are gone before Marketplace submission. Use the same scripts; mint a fresh batch of codes and a new sandbox Gemini key.

---

## Round cost & time budget

| Step | Cost | Time |
|---|---|---|
| Step 1 — sandbox GCP + capped Gemini key (`step1_create_sandbox.sh`) | $0 (until tester usage; capped at $5) | ~5 min |
| Step 2 — Marketplace SDK setup + install URL (`step2a_enable_sdk.sh` + manual) | $0 | **~2–3 hours** (pull-forward of launch critical-path) |
| Step 3 — pre-flight self-test (`run_script_a.sh` + `walk_script_a.sh`) | $0 | ~30 min + ≤60 min fixes |
| Step 4 — mint codes (`promo CLI`) + fill scripts (`step4b_fill_scripts.sh`) + UserTesting submission | ~$490 | ~30 min |
| Wait for sessions | $0 | 1–2 weeks (your time: 0) |
| Step 5 — triage + fix | $0 | ~3–4 hr review + 4–10 hr fixes |
| Optional Round N+1 | ~$245 | ~2 hr review |
| **Total Round 1 only** | **~$490** | **~12–14 hr of dev time over ~3 weeks** |
