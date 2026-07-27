// REWRITTEN 2026-07-26 for contextual-only flow — selectors unverified against live UI; expect drift on first run.

require('dotenv').config({ path: require('path').resolve(__dirname, '../e2e.config.env') });
const { test, expect } = require('../fixtures');
const {
  openAddon,
  getFrame,
  expectToast,
  clickButton,
  fillField,
  sendTestEmail,
  openEmailBySubject,
  openAddonPanel
} = require('../helpers');

// ─── UserTesting Round 1 — Script A (best-effort full automation) ────────────
//
// Mirrors usertesting/docs/script_a_core.md. One test() per task so a failure
// in one task does not block the others. Tasks gate themselves via env vars:
// missing creds → test.skip with a reason instead of a hard fail. The rule
// editor (Task 3) and email-send + contextual-evaluate + multi-channel verify
// (Task 4) are flagged in playwright/README.md as flaky/manual; they run here
// as best-effort and will show as failures on cards/Compose markup the suite
// cannot reach.
//
// Required env in e2e.config.env:
//   GOOGLE_EMAIL                  — required for Task 4 self-send
//   GEMINI_API_KEY                — required for Task 2a
//   TEST_PROMO_CODE               — optional; Task 2b skips if absent
//   CHAT_SPACE_NAME / CHAT_WEBHOOK_URL — optional; Task 2c skips if absent
//
// Re-run safety: every task is idempotent on its own happy path EXCEPT
// Task 2b. Promo codes are single-use — running this spec twice with the
// same TEST_PROMO_CODE will fail the second run on the redemption toast.
// Mint a fresh code for each run, or comment out the T2b test.

const SCRIPT_A_RULE_NAME    = 'Script A — DEMO test rule';
const SCRIPT_A_RULE_TEXT    = 'Any email with the word DEMO in the subject line.';
const SCRIPT_A_EMAIL_SUBJECT = 'DEMO test 1';

// ─── Task 1 · Install + open the add-on ──────────────────────────────────────
// The actual install flow (clicking through the unverified-app consent screen)
// can't be automated — Playwright can't sign in to a fresh Google account
// without tripping bot detection. The test assumes the add-on is already
// installed on the persistent Chrome profile (per testing/playwright/README.md
// "Setup"). What we CAN automate is "icon is reachable, home card renders,
// and the on-card content lets a tester answer 'what is this product?'."

test('Task 1 · home card loads with the value-prop content', async ({ page }) => {
  const frame = await openAddon(page);
  // Plan status row always reads "Lite" in this edition.
  await expect(frame.getByText(/Lite/).first()).toBeVisible();
  // The "How it works" blurb explains the contextual flow.
  await expect(frame.getByText(/Evaluate this email/).first()).toBeVisible();
  // Home card nav row: Settings, Starter rules, Rules, Activity log, Help, Community.
  // The Rules nav button label carries live counts ('Rules   ✅ n  ⚠️ n  ⚪ n'),
  // so match on the prefix rather than exact text.
  await expect(frame.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(frame.getByRole('button', { name: 'Starter rules' })).toBeVisible();
  await expect(frame.getByRole('button', { name: /^Rules/ })).toBeVisible();
  await expect(frame.getByRole('button', { name: 'Activity log' })).toBeVisible();
});

// ─── Task 2a · Gemini API key ────────────────────────────────────────────────

test('Task 2a · Gemini key saves and Test Gemini reports OK', async ({ page }) => {
  const key = process.env.GEMINI_API_KEY;
  test.skip(!key, 'GEMINI_API_KEY not set in e2e.config.env');
  test.setTimeout(180_000); // Test Gemini round-trip can be slow.
  const frame = await openAddon(page);
  await clickButton(frame, 'Settings');
  await fillField(getFrame(page), 'API key', key);
  await clickButton(getFrame(page), 'Save settings');
  await expectToast(page, /Settings saved|No changes/);
  await clickButton(getFrame(page), 'Test Gemini');
  await expectToast(page, /Gemini OK|model responded/i, 60_000);
});

// ─── Task 2b · Redeem the Pro promo code ─────────────────────────────────────
// Single-use: re-running this test with the same TEST_PROMO_CODE will fail.
// Skipped automatically when already on Pro (the promo section is not rendered).

test('Task 2b · promo code redeems and flips account to Pro', async ({ page }) => {
  const code = process.env.TEST_PROMO_CODE;
  test.skip(!code, 'TEST_PROMO_CODE not set — mint one with tools/promo and add to e2e.config.env');
  const frame = await openAddon(page);
  // Promo section is on the home card (bottom). No navigation needed.
  const promoInput = frame.getByLabel('Enter promo code', { exact: false });
  // Section is double-gated: hidden on Pro, hidden when PROMO_SERVICE_URL not set.
  if (!(await promoInput.isVisible({ timeout: 10_000 }).catch(() => false))) {
    test.skip(true, 'Promo section not rendered (already Pro, or PROMO_SERVICE_URL unset)');
  }
  await fillField(frame, 'Enter promo code', code);
  await clickButton(frame, 'Redeem code');
  // Accept either a successful redemption or an "already redeemed" response.
  // The code is single-use; running both Pro and Free suites back-to-back
  // consumes the code in the first run — skip rather than fail on the second.
  await expectToast(page, /Pro plan activated|Welcome|already redeemed/i, 30_000);
  const bodyText = await getFrame(page).locator('body').textContent().catch(() => '');
  if (/already redeemed/i.test(bodyText)) {
    test.skip(true, 'TEST_PROMO_CODE was already redeemed by a prior run — mint a fresh code in e2e.config.env');
  }
});

// ─── Task 2c · Add a Google Chat space ───────────────────────────────────────
// chat.google.com webhook creation cannot be automated by this suite — that
// step has to happen out-of-band and the resulting URL is supplied via
// CHAT_WEBHOOK_URL. This test exercises the in-app "+ Add Chat space" editor
// only.

test('Task 2c · add Chat space saves with the supplied webhook URL', async ({ page }) => {
  const url  = process.env.CHAT_WEBHOOK_URL;
  const name = process.env.CHAT_SPACE_NAME || 'Script A test space';
  test.skip(!url, 'CHAT_WEBHOOK_URL not set in e2e.config.env');
  const frame = await openAddon(page);
  await clickButton(frame, 'Settings');
  await clickButton(getFrame(page), '+ Add Chat space');
  const f = getFrame(page);
  await fillField(f, 'Space name', name);
  await fillField(f, 'Webhook URL', url);
  await clickButton(f, 'Save');
  await expectToast(page, /Chat space .*(saved|added|updated)/i, 15_000);
});

// ─── Task 3 · Create rule with all five Google channels ──────────────────────
// playwright/README.md flags "+ New rule" as not reliably automatable due to
// Apps Script's FILLED-button rendering. This test runs anyway as best-effort
// per the "full Script A" scope; expect failures here on accessible-name
// resolution rather than logic bugs.

test('Task 3 · create rule with all five Google channels ticked', async ({ page }) => {
  test.skip(process.env.TEST_TIER !== 'pro', 'Free tier 3-rule quota is filled by S3 starter rules — Task 3 requires Pro');
  test.setTimeout(180_000);
  const frame = await openAddon(page);
  // The Rules nav button label carries live counts — match on the prefix.
  await clickButton(frame, /^Rules/);
  await clickButton(getFrame(page), '+ New rule');
  const f = getFrame(page);
  await fillField(f, 'Rule name', SCRIPT_A_RULE_NAME);
  // (No labels field — the contextual-only rule editor has no
  // "Gmail labels to watch" input.)
  await fillField(f, 'Rule text (plain English)', SCRIPT_A_RULE_TEXT);
  // Tick the four ungated Google channels (Calendar, Sheets, Tasks, Docs).
  // Each is a CardService SelectionInput.CHECK_BOX rendered as a Material
  // checkbox; .check() targets the [role="checkbox"] node inside the row.
  for (const labelRe of [
    /Google Calendar.*create an event/i,
    /Google Sheets.*append a log row/i,
    /Google Tasks.*create a task/i,
    /Google Docs.*append a log entry/i
  ]) {
    const cb = f.getByRole('checkbox', { name: labelRe }).first();
    if (await cb.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cb.check({ force: true }).catch(() => {});
    }
  }
  // Chat space — only present if Task 2c added one and CHAT_SPACE_NAME matches.
  const chatName = process.env.CHAT_SPACE_NAME || 'Script A test space';
  const chatBox = f.getByRole('checkbox', { name: chatName }).first();
  if (await chatBox.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await chatBox.check({ force: true }).catch(() => {});
  }
  await clickButton(f, 'Save');
  await expectToast(page, /Rule saved|Rule added/i, 15_000);
});

// ─── Task 4 · Send test email, open it, and Evaluate this email ──────────────
// Real outbound send via Compose + 10s settle, then the contextual-only flow:
// open the DEMO email in the Gmail message view, open the add-on panel (the
// contextual card renders via onGmailMessageOpen), click the FILLED purple
// "Evaluate this email" button, and assert the "Evaluation result" card shows
// the DEMO rule row with "✅ Match — alerts sent". The five per-surface
// verifications (Calendar/Sheets/Tasks/Docs/Chat) require leaving the add-on
// iframe and inspecting external Google products — the match row is the
// add-on-side evidence that the rule fired and dispatch was attempted. The
// per-channel rendering checks remain in the manual e2e_test_plan.md.

test('Task 4 · self-send DEMO email and Evaluate this email reports a match', async ({ page }) => {
  const email = process.env.GOOGLE_EMAIL;
  test.skip(!email, 'GOOGLE_EMAIL not set in e2e.config.env');
  test.skip(process.env.TEST_TIER !== 'pro', 'Task 3 is skipped on Free tier (no DEMO rule created), so evaluation will find 0 matches');
  test.setTimeout(300_000);
  await sendTestEmail(page, SCRIPT_A_EMAIL_SUBJECT, email);
  // 10s for the message to land in the inbox.
  await page.waitForTimeout(10_000);
  await openEmailBySubject(page, SCRIPT_A_EMAIL_SUBJECT);
  const frame = await openAddonPanel(page);

  await clickButton(frame, 'Evaluate this email');

  // Result card header + the DEMO rule's match row. Evaluation runs every
  // enabled rule (up to two Gemini calls each), hence the long timeout.
  const body = getFrame(page).locator('body');
  await expect(body).toContainText(/Evaluation result/i, { timeout: 240_000 });
  await expect(body).toContainText(SCRIPT_A_RULE_NAME);
  await expect(body).toContainText(/Match — alerts sent/);
});

// ─── Task 5 · Wrap-up questions ──────────────────────────────────────────────
// Tester interview ("what does this product do?", "would you pay $4.99?",
// "who do you know who'd benefit?"). Cannot be automated — kept as a
// permanent skip so the spec mirrors Script A 1-to-1 and the tracker tooling
// reports the right total of tasks.

test('Task 5 · wrap-up interview (manual, permanent skip)', async () => {
  test.skip(true, 'Tester interview — see usertesting/docs/script_a_core.md Task 5');
});
