# emAIl Sentinel — E2E Playwright Tests

Automated end-to-end tests for the reliably-passing portion of the test plan. Runs in a headed Chrome window using your existing Google session — no password automation required. Tests that would dispatch real alerts (SMS/Chat/MCP/Calendar/Sheets/Tasks/Docs), depend on multi-step modal workflows, or need visual color checks remain manual per `testing/e2e_test_plan.md`.

> **Rewritten 2026-07-26 for the contextual-only flow** (open an email → **Evaluate this email** → "Evaluation result" card; no scheduled scans, no labels field). Selectors are unverified against the live UI — expect drift on the first run. The `S<number>` prefixes in spec test names are legacy identifiers kept for `--grep` stability; the test plan itself has been renumbered (its new §15 covers the contextual-only posture).

---

## Setup

### 1. Install dependencies

```bash
cd testing/playwright
npm install
npx playwright install chrome
```

### 2. Find your Chrome profile path

Open Chrome and go to `chrome://version`. Copy the value next to **Profile Path**.

### 3. Fill in the config file

```bash
# The config file is already created — just fill it in:
nano e2e.config.env   # or open in any editor
```

Set at minimum:
- `CHROME_PROFILE_PATH` — the path copied from chrome://version
- `GOOGLE_EMAIL` — your Gmail test account address
- `GEMINI_API_KEY` — from aistudio.google.com/app/apikey

---

## Running the tests

### Run all automated tests
```bash
./testing/run_free_e2e_tests.sh
```

### Run a single section
```bash
npx playwright test --grep "S2"
```

### View the HTML report after a run
```bash
npm run report
```

---

## Automated test coverage

| Section | Description | Tests |
|----------|-------------|-------|
| S2 | Home card status rows (Plan "Lite", Rules counts, Gemini key), Settings nav, contextual-only regression guard (no scheduled-scan / business-hours / max-age / Reset-baseline fields) | 3 |
| S3 | Starter rules preview + creation toast | 1 |
| S5 | Self-send a matching email, open it, click "Evaluate this email" → "Evaluation result" card | 1 |
| S8 | Activity log UI — Refresh + Clear button presence | 2 |
| S12 | Google Docs ID field presence in Settings | 1 |
| S13 | External integrations editor opens with renamed Type labels | 1 |
| S14 | Help card navigation, footer credit, support links, keyword search (find/empty/no-match), per-topic content fingerprint, trademark-footer Slack-omission guard, Community home-card button | 9 |
| S17b | Unsaved-changes notice on Settings card | 1 |
| S20 | Lite home-card visibility (Plan row, "Upgrade to Pro" link, promo section absent) | 2 |

**Total: 21 automated tests in `e2e.spec.js`.** Plus 7 in `script_a.spec.js` and 5 in `script_b.spec.js` (the latter is RETIRED — see file header). The old S17 Reset-baseline, S18 business-hours, and S19 max-email-age tests were deleted with the features.

---

## Manual-only sections

The following test plan sections are NOT automated. Verify these by hand against `testing/e2e_test_plan.md`:

| Section (new plan numbering) | Why manual |
|---------|------------|
| §4 Create a dedicated test rule via "+ New rule" | Apps Script's FILLED-button rendering of "+ New rule" doesn't reliably expose the visible label as the accessible name in Playwright (the automated S5 test relies on a pre-enabled rule instead) |
| §7 Evaluate a non-matching email | Needs a second seeded email guaranteed NOT to match; cheap to do by hand |
| §9–13 Alert channels | SMS/Chat/MCP/Calendar/Sheets/Tasks/Docs — would dispatch real alerts and burn provider credits |
| §15 Contextual-only posture (kebab contents, empty Triggers table, single `gmail.addons.current.message.readonly` scope) | The Settings-fields half is automated (S2 regression guard); the Apps Script Triggers table and the OAuth consent screen live outside the Gmail iframe |
| §16 Confirmation dialogs | Multi-step Clear→Cancel→Clear→Clear sequences flake on toast detection |
| §20 Action color conventions | CardService doesn't expose button background color or text color to Playwright in a stable way; visual color check is manual. |
| §22 AI "Help me write" buttons present with no upgrade prompt | Same "+ New rule" rendering issue as §4 (the buttons live inside the rule editor) |

---

## Tier selection

`run_pro_e2e_tests.sh` exports `TEST_TIER=pro`; `run_free_e2e_tests.sh` leaves it unset (treated as `free`). The two tiers are now **completely identical** — every feature is free, the AI "Help me write" gate was removed, and the promo section no longer renders for anyone — so the suite runs the same in both modes. Remaining tier-conditioned skips:

- (None — the former Free-tier 3-rule-quota skips on Tasks 3/4 were removed; every test now runs regardless of `TEST_TIER`.)

No Apps Script tier flip is needed before either wrapper — all features are free and the tiers are identical.

---

## Notes

- Tests run **headed** (visible browser window). Google blocks headless login attempts.
- The config file `e2e.config.env` is gitignored and will never be committed.
- On failure, screenshots and video are saved to `test-results/`.
- Gmail's add-on iframe selectors may occasionally need adjustment if Google updates its UI — check `helpers.js` if tests break after a Gmail update.
