# UserTesting workspace

Everything to do with paid usability-testing rounds for emAIl Sentinel — task scripts, the per-round outgoing artifacts you submit to UserTesting.com, the per-round incoming artifacts you download back, and the triage / findings notes that come out of each round.

## Layout

| Subdirectory | Committed to git? | Contents |
|---|---|---|
| `docs/` | ✅ yes | Canonical task scripts, screener questions, triage template, pre-flight setup walkthrough. The reusable templates that *don't* contain per-round secrets. |
| `outgoing/` | ❌ no — gitignored | Per-round (and per-tester) filled scripts with real `<DEV_GEMINI_KEY>`, `<TEST_DEPLOYMENT_URL>`, and `<TESTER_PROMO_CODE>` substituted in. These are *secrets-bearing* working files copied from `docs/` and edited locally for each round/tester before pasting into the UserTesting platform. Don't commit. |
| `incoming/` | ❌ no — gitignored | Downloaded session recordings, transcripts, and any raw tester output from the UserTesting platform. May contain tester PII (email addresses, phone numbers, faces in webcam recordings if enabled). Don't commit. |
| `findings/` | ✅ yes | Triage docs filled out from the recordings, plus per-round summaries. Sanitized — no PII, just summarized findings, severity, fix status. These get committed because they're the durable artifact of each round. |

## Per-round workflow

For each Round N (N = 1, 2, …, written as 3-digit zero-padded `001`, `002`, …, `010`, `100` in every directory and filename):

1. **Prep (Steps 1–3 of `docs/preflight_setup.md`).** Sandbox GCP project + capped Gemini key, Apps Script test deployment, pre-flight self-test on a fresh non-dev account.
2. **Outgoing (Step 4).** Mint 10+1 single-use promo codes in the standalone admin/service Apps Script project (10 testers + 1 self-test reserve). Copy `docs/script_a_core.md` to `outgoing/round_<NNN>/script_a_filled_tester_<i>.md` once per tester. Replace `<DEV_GEMINI_KEY>`, `<TEST_DEPLOYMENT_URL>`, and `<TESTER_PROMO_CODE>` placeholders — every tester gets a different code. Paste into UserTesting's task editor (one session per tester). Submit and pay. (Every round uses Script A; `docs/script_b_power.md` is **retired** and not part of any round.)
3. **Wait.** Sessions trickle back over 1–2 weeks. UserTesting emails you when each completes.
4. **Incoming.** As recordings arrive, download them (UserTesting → Test → individual session → Download MP4) and any auto-generated transcripts to `incoming/round_<NNN>/`. Optionally download the platform's notes export.
5. **Findings.** `cp docs/triage_template.md findings/round_<NNN>_<YYYY-MM-DD>_findings.md`, fill in the table while watching the recordings. After the round closes, write `findings/round_<NNN>_summary.md` capturing top issues, fix priorities, and the "would you pay $4.99/month?" yes-rate.
6. **Fix.** Land critical / important fixes in the codebase. Update the **Fix status** column in the findings file as each is shipped.
7. **Rotate secrets.** Revoke the Round-N Gemini key, create a fresh test deployment URL, and **void any unredeemed Round-N promo codes** in the standalone admin project before Round N+1 — Round-N testers shouldn't retain working access. Redeemed codes cannot be revoked (the tier flip is per-user persistent), but unredeemed ones can.

## Why outgoing/ and incoming/ are gitignored

- **outgoing/** holds files with the real Gemini API key embedded. The key is your sandbox-project credential, but it still costs real money if exfiltrated and gets logged in git history forever even after rotation.
- **incoming/** holds tester recordings that may show their email inbox, phone number, voice, and (if webcam was enabled) face. Even if your participants consented to UserTesting's standard ToS, committing recordings to a public-or-could-go-public repo is a privacy escalation you don't need.

The directories themselves are kept (with `.gitkeep`) so the structure is obvious without having to read this README.

## Reference

- **Pre-flight walkthrough:** `docs/preflight_setup.md`
- **Task script — core flow (UserTesting.com):** `docs/script_a_core.md`
- **Task script — SMS provider validation (direct-recruited):** `docs/script_c_sms_providers.md`
- **Pre-flight walkthrough (SMS round):** `docs/preflight_sms.md`
- **Task script — SMS path (RETIRED, historical reference only):** `docs/script_b_power.md`
- **Triage template:** `docs/triage_template.md`
- **Round-001 plan summary:** memory file `project_pre_launch_todo.md` (Testing section) and the locked plan at `~/.claude/plans/should-i-run-a-wondrous-hollerith.md`.

## Scripts

| Script | What it automates | Run |
|---|---|---|
| `tools/preflight/step1_create_sandbox.sh` | GCP sandbox project + capped Gemini key | Step 1 of preflight |
| `tools/preflight/step2a_enable_sdk.sh` | Marketplace SDK enable + manual checklist | Step 2a of preflight |
| `tools/preflight/step4b_fill_scripts.sh` | Fill Script A placeholders for all testers | Script A rounds |
| `tools/preflight/step4c_fill_sms_scripts.sh` | Assign providers + fill Script C per tester | Script C SMS rounds |
| `tools/preflight/validate_sms_providers.sh` | Credential check + live test SMS for all 6 providers | Script C preflight Step 2 |
