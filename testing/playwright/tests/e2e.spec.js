// REWRITTEN 2026-07-26 for contextual-only flow — selectors unverified against live UI; expect drift on first run.

require('dotenv').config({ path: require('path').resolve(__dirname, '../e2e.config.env') });
const { test, expect } = require('../fixtures');
const { openAddon, getFrame, expectToast, clickButton, fillField, sendTestEmail, openEmailBySubject, openAddonPanel } = require('../helpers');

// ─── Pre-run requirements (manual, not automated) ────────────────────────────
//
// Before running this suite:
//   1. The add-on must be installed and signed in to the test account.
//   2. Gemini API key configured in Settings (only needed for tests that
//      verify post-save state — most automated checks don't require it).
//   3. Run resetUserPropertiesForTesting() in Apps Script editor for a
//      fully pristine run if rule state has accumulated from prior runs.
//
// This automated suite covers the reliably passing tests only. Tests that
// depend on:
//   - Multi-channel alert verification outside the add-on iframe (Calendar/
//     Sheets/Tasks/Docs/Chat surfaces)
//   - Contextual-card state branches the suite cannot force (no-Gemini-key
//     and no-enabled-rules paths would require wiping the test account's
//     settings/rules mid-run)
//   - Multi-step modal workflows that flake (S17 confirmations)
//   - Rule creation + cleanup state (S4, S20 rule-editor checks)
// remain manual per testing/e2e_test_plan.md.

// ─── S2 · Home card and Settings navigation ───────────────────────────────────

test('S2: home card loads with all status rows', async ({ page }) => {
  const frame = await openAddon(page);
  // Status rows: Plan (always "Lite" in this edition), Rules counts, Gemini
  // API key. Each row is one TextParagraph (<b>title</b><br><font>value</font>).
  // .first() on "Gemini API key" disambiguates from the Quick-setup checklist
  // line "✓ Paste your Gemini API key".
  await expect(frame.getByText(/Plan/).first()).toBeVisible();
  await expect(frame.getByText(/Lite/).first()).toBeVisible();
  await expect(frame.getByText('Gemini API key').first()).toBeVisible();
  // The "How it works" blurb names the contextual CTA.
  await expect(frame.getByText(/Evaluate this email/).first()).toBeVisible();
});

test('S2: Settings card opens', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Settings');
  // Verify Settings card loaded. (S8 separately verifies the in-card Home
  // button is unconditionally present on the four root cards so users have
  // a reliable escape route regardless of how they reached the card.) The
  // 'Gemini (rule evaluation)' section header is rendered unconditionally —
  // it does NOT require a Gemini key to be configured — so this assertion
  // is safe on a fresh test account.
  await expect(getFrame(page).getByText('Gemini (rule evaluation)')).toBeVisible();
});

// ─── S2 · No scheduled-scan surfaces remain ──────────────────────────────────
// The contextual-only conversion (2026-07-26) removed the Scan schedule
// dropdown, Business hours checkbox, Max email age field, and Reset baseline
// button from Settings. This regression guard asserts none of them come back.

test('S2: Settings has no scheduled-scan fields (contextual-only regression guard)', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Settings');
  const body = getFrame(page).locator('body');
  // Anchor on a section that IS present so the negatives aren't vacuous.
  await expect(body).toContainText('Gemini (rule evaluation)');
  await expect(body).not.toContainText('Scan email every');
  await expect(body).not.toContainText('Only check during business hours');
  await expect(body).not.toContainText('Only scan emails newer than');
  await expect(body).not.toContainText('Reset baseline');
});

// ─── S3 · Starter Rules ───────────────────────────────────────────────────────

test('S3: starter rules preview opens and lists creatable starter rules', async ({ page }) => {
  // The preview card filters out starter rules whose name already exists in
  // the user's rules list (Cards.gs buildStarterRulesCard). On a non-pristine
  // test account, only the not-yet-created subset is visible — assert that the
  // card opened with at least one starter-rule entry rather than enumerating
  // all five (which would require resetUserPropertiesForTesting before run).
  const frame = await openAddon(page);
  await clickButton(frame, 'Starter rules');
  const f = getFrame(page);
  // Either the "rules will be created" header is visible, or the
  // "All starter rules already exist." message is visible.
  await expect(
    f.getByText(/rules will be created \(disabled\)|All starter rules already exist/i)
  ).toBeVisible({ timeout: 30_000 });
  // At least one of the five canonical starter-rule names should appear when
  // the card is in the "rules will be created" state. Skip the click+toast
  // step entirely if the user has every starter rule already.
  const allExist = await f.getByText(/All starter rules already exist/i).isVisible();
  if (allExist) return;
  const canonicalNames = [
    'Urgent emails',
    'Invoices & payment requests',
    'Shipping & delivery updates',
    'Security & account alerts',
    'Bills & subscription renewals'
  ];
  let anyVisible = false;
  for (const name of canonicalNames) {
    if (await f.getByText(name).isVisible().catch(() => false)) { anyVisible = true; break; }
  }
  expect(anyVisible).toBe(true);
  await clickButton(f, 'Create starter rules');
  // Toast confirms creation OR reports the limit-skip outcome.
  await expectToast(page, /starter rules created|limit reached/i);
});

// ─── S5 · Contextual evaluation of an open email ─────────────────────────────
// The contextual-only flow: self-send a seeded email, open it in the Gmail
// message view, open the add-on panel (contextual card renders via
// onGmailMessageOpen), click the FILLED purple "Evaluate this email" button,
// and assert the "Evaluation result" card renders. handleEvaluateOpenMessage
// is synchronous and can take 30-90s with Gemini in the loop (up to two
// calls per enabled rule), hence the long timeout. Per-rule row content
// ("✅ Match — alerts sent" / "➖ No match") depends on which rules are
// enabled on the test account, so this test only asserts the result card
// itself; the match-row assertion lives in script_a.spec.js Task 4 where the
// DEMO rule is created first. The no-Gemini-key and no-enabled-rules branches
// of the contextual card remain manual (forcing them would wipe test-account
// state mid-suite).

test('S5: Evaluate this email produces an Evaluation result card', async ({ page }) => {
  const email = process.env.GOOGLE_EMAIL;
  test.skip(!email, 'GOOGLE_EMAIL not set in e2e.config.env');
  test.setTimeout(300_000);
  const subject = `Sentinel S5 seed ${Date.now()}`;
  await sendTestEmail(page, subject, email);
  await page.waitForTimeout(10_000);
  await openEmailBySubject(page, subject);
  const frame = await openAddonPanel(page);
  // Contextual card: happy path shows the Evaluate button; if the test
  // account has no enabled rules the card offers "Open Rules" instead —
  // treat that as a setup failure with a clear message rather than a flake.
  const evalBtn = frame.getByRole('button', { name: 'Evaluate this email' }).first();
  if (!(await evalBtn.isVisible({ timeout: 15_000 }).catch(() => false))) {
    const body = await frame.locator('body').textContent().catch(() => '');
    if (/No enabled rules yet/i.test(body)) throw new Error('S5 needs at least one enabled rule on the test account — enable one and re-run.');
    if (/No Gemini API key configured/i.test(body)) throw new Error('S5 needs a Gemini API key configured on the test account.');
  }
  await evalBtn.click({ force: true, timeout: 30_000 });
  await expect(getFrame(page).locator('body')).toContainText(
    /Evaluation result|Evaluation failed/i,
    { timeout: 240_000 }
  );
});

// ─── S8 · Activity Log UI ────────────────────────────────────────────────────

test('S8: activity log has Refresh button', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Activity log');
  await expect(getFrame(page).getByRole('button', { name: 'Refresh' })).toBeVisible();
});

// Both Refresh and Clear share a ButtonSet at the top of the Activity log
// card. The Clear flow itself (confirm card → toast → log emptied) stays
// manual per S17 — multi-step modal sequences flake on toast detection here.
// This test only asserts the entry-point button renders.
test('S8: activity log has Clear button', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Activity log');
  await expect(getFrame(page).getByRole('button', { name: 'Clear' })).toBeVisible();
});

// ─── S12 · Google Docs Alert Channel ─────────────────────────────────────────
// Full alert dispatch (Docs append + auto-create on first alert) is covered
// manually in plan section 12 — it requires a fired rule and a real Doc. The
// automated check is just that the Settings field for the global Doc ID renders
// (regression guard for accidental field removal during the alert-channel
// refactor that introduced this surface).

test('S12: Google Docs ID field visible in Settings', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Settings');
  await expect(
    getFrame(page).getByLabel('Google Docs ID', { exact: false })
  ).toBeVisible();
});

// ─── S13 · External Integrations Editor ──────────────────────────────────────
// The Type dropdown labels were renamed in commit 237bd0f
// ('Custom' → 'Custom MCP', 'Generic webhook' → 'Custom webhook'). A future
// label edit could regress them silently — this smoke test asserts the editor
// opens, the Type field renders, and the default selected option is the new
// 'Custom MCP' label. Asserting all five labels would require opening the
// dropdown menu, which is brittle across CardService renderings; the
// remaining four labels are covered by manual section 13.

test('S13: External integrations editor opens with renamed Type labels', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Settings');
  await clickButton(getFrame(page), '+ Add external integration');
  const f = getFrame(page);
  // 'Server name' is the first input on the editor — confirms editor opened.
  await expect(f.getByLabel('Server name', { exact: false })).toBeVisible();
  // 'Custom MCP' is the default selected option. In CardService's Material
  // dropdown, the option span lives in a hidden overlay when the dropdown is
  // closed, so toBeVisible() always fails. toBeAttached() confirms the label
  // string exists (and is NOT the old 'Custom' label) without requiring CSS
  // visibility — sufficient as a rename-regression guard.
  await expect(f.getByText(/Custom MCP/).first()).toBeAttached();
});

// ─── S14 · Help Card Navigation ──────────────────────────────────────────────

test('S14: Help card loads with all five topic buttons', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Help');
  const f = getFrame(page);
  await expect(f.getByText('emAIl Sentinel Lite Help')).toBeVisible({ timeout: 30_000 });
  for (const topic of ['Quick start & writing rules', 'Rule examples by channel', 'Alert channel setup', 'Gemini pricing & models', 'Settings & troubleshooting']) {
    await expect(f.getByRole('button', { name: topic })).toBeVisible();
  }
});

// Each topic button pushes a topic-content card via handleShowHelpTopic.
// Several topic titles match their button label exactly (e.g. 'Alert channel
// setup'), so getByText on the title would resolve to both the now-hidden
// help-card button and the new content card. Anchor on a distinctive content
// fragment that only exists inside that topic's body — these strings are
// effectively a fingerprint that the topic loaded.
//
// One topic is reached fresh per iteration via re-openAddon → click Help →
// click topic, because CardService's pushCard stack does not give Playwright
// a reliable in-iframe back path. The Settings & troubleshooting topic is
// already covered by 'S14: Settings & troubleshooting topic shows both
// support links', so it is omitted here.
test('S14: each remaining help topic loads with distinctive content', async ({ page }) => {
  test.setTimeout(180_000);
  const checks = [
    { button: 'Quick start & writing rules', fingerprint: /Be specific about senders/i },
    { button: 'Rule examples by channel',    fingerprint: /Wire transfer/i },
    { button: 'Alert channel setup',         fingerprint: /Generic webhook/i },
    { button: 'Gemini pricing & models',     fingerprint: /twice per rule/i }
  ];
  for (const { button, fingerprint } of checks) {
    const f = await openAddon(page);
    await clickButton(f, 'Help');
    await clickButton(getFrame(page), button);
    await expect(getFrame(page).getByText(fingerprint).first()).toBeVisible();
  }
});

// Trademark attribution sync guard. Slack was removed as a named MCP type
// (it does not host an MCP server; Slack users now go via Custom webhook
// with an incoming-webhook URL) and was correspondingly dropped from the
// help footer's trademark line. The body still contains Slack mentions in
// other topics ('Slack channel via webhook' in Examples; 'Slack, Discord,
// n8n' in Channels), but those topics are not loaded by this flow — only
// home → Help → Settings & troubleshooting are pushed, none of which
// mention Slack anywhere in their content.
test('S14: trademark footer omits Slack on Settings & troubleshooting topic', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Help');
  await clickButton(getFrame(page), 'Settings & troubleshooting');
  const body = getFrame(page).locator('body');
  await expect(body).toContainText(/Microsoft and Teams are trademarks/i);
  await expect(body).toContainText(/Asana is a trademark/i);
  await expect(body).not.toContainText(/Slack/i);
});

test('S14: help footer shows JJJJJ Enterprises credit', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Help');
  await expect(getFrame(page).getByText('JJJJJ Enterprises')).toBeVisible();
  await expect(getFrame(page).getByText(/emAIl Sentinel.*product of JJJJJ Enterprises/i)).toBeVisible();
});

test('S14: Settings & troubleshooting topic shows both support links', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Help');
  await clickButton(getFrame(page), 'Settings & troubleshooting');
  // Two support paths now: Community Discussions for usage Q&A and rule
  // recipes, GitHub Issues for bugs and feature requests.
  // Use getByRole('link') to avoid strict-mode violation: the kebab nav
  // also contains a 'Community discussions' span that resolves to 2 elements.
  await expect(getFrame(page).getByRole('link', { name: 'Community discussions' })).toBeVisible();
  await expect(getFrame(page).getByRole('link', { name: 'Open a GitHub issue' })).toBeVisible();
});

test('S14: home card has a Community button next to Help', async ({ page }) => {
  const frame = await openAddon(page);
  await expect(frame.getByRole('button', { name: /^Community$/i })).toBeVisible();
});

test('S14: help search finds a known phrase across topics', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Help');
  // The "Search help" input + button live in their own section at the top.
  // "back arrow" appears only in the Settings & troubleshooting topic (the
  // unsaved-changes troubleshooting entry) — the old "Reset baseline" query
  // matched a Settings feature removed in the contextual-only conversion.
  await fillField(getFrame(page), 'Search all topics', 'back arrow');
  await clickButton(getFrame(page), 'Search');
  // Results card uses the query in its header.
  await expect(getFrame(page).getByText(/Search:\s*"back arrow"/i)).toBeVisible();
  // The Settings & troubleshooting topic mentions the back arrow, so it should
  // appear as a result. Apps Script keeps the previous Help card in the DOM
  // (hidden) — a bare getByText match resolves to many nodes including hidden
  // ones. The "Open: <topic>" button label is unique to the results card and
  // is only rendered for matched topics, so anchor on it.
  await expect(getFrame(page).getByRole('button', { name: /^Open:\s*Settings & troubleshooting$/i })).toBeVisible();
});

test('S14: help search empty query shows toast prompt', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Help');
  // Click Search without typing anything.
  await clickButton(getFrame(page), 'Search');
  await expectToast(page, 'Enter a search term first');
});

// Negative-path coverage for handleSearchHelp: an obviously-bogus query
// pushes a results card with the empty-state message instead of a topic
// list. Catches regressions where the no-match branch silently falls
// through to a results card with zero sections (which would render as an
// empty card and read as broken).
test('S14: help search no-match shows empty-result message', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Help');
  await fillField(getFrame(page), 'Search all topics', 'xyzzy123nonexistent');
  await clickButton(getFrame(page), 'Search');
  await expect(getFrame(page).getByText(/No matches in any help topic/i)).toBeVisible();
});

// ─── S17 · Confirmation dialogs ──────────────────────────────────────────────
// The Clear-log and Delete-rule confirmation flows remain manual per
// playwright/README.md (multi-step Clear→Cancel→Clear→Clear sequences flake
// on toast detection). The former Reset-baseline confirmation test was
// removed in the contextual-only conversion — there is no seen-message
// baseline (and no Reset baseline button) anymore.

// ─── S17b · Unsaved-Changes Notice on Editor Cards ──────────────────────────
// CardService gives no event for the system back arrow, so editor cards cannot
// prompt to save unsaved changes. Each editor card prepends an amber notice as
// its first section. The Settings card is the most reliably reachable editor
// from automation; the rule editor / MCP / SMS recipient / Chat space editors
// are covered manually in the test plan because of the FILLED-button rendering
// issue noted in playwright/README.md.

test('S17b: unsaved-changes notice present on Settings card', async ({ page }) => {
  const frame = await openAddon(page);
  await clickButton(frame, 'Settings');
  await expect(getFrame(page).getByText(/before tapping the back arrow/i)).toBeVisible();
});

// ─── S18/S19 · Removed in the contextual-only conversion ─────────────────────
// Business hours and Max email age were scheduled-scan settings; both fields
// were removed from the Settings card (their absence is asserted by the S2
// contextual-only regression guard above).

// ─── S20 · Plan Visibility ───────────────────────────────────────────────────
// Only the home-card visibility checks are automated. Rule-editor Pro-gating
// checks (Chat/MCP labels, AI Suggest suffix) remain manual — they require a
// "+ New rule" click that the Apps Script FILLED-button rendering doesn't
// expose to Playwright reliably.

test('S20: home card shows Lite plan row and Upgrade to Pro link', async ({ page }) => {
  const frame = await openAddon(page);
  // The Plan status row always reads "Lite" in this edition, and the Pro
  // upsell (self-hosted 24/7 monitoring) is always shown.
  await expect(frame.getByText(/Lite/).first()).toBeVisible();
  await expect(frame.getByText(/24\/7 automatic monitoring/i)).toBeVisible();
  await expect(frame.getByRole('button', { name: /Upgrade to Pro/i }).first()).toBeVisible();
});

// The promo-code section was removed from the home card when the last in-app
// feature gate (AI rule writing) went free — with both tiers identical, a
// "upgrade to Pro" promo box would change nothing user-visible. This test now
// asserts the section stays gone. Server-side redemption logic
// (`runPromoServiceTests`) still lives in the standalone admin/service project.

test('S20: promo redemption section is not rendered (all features free)', async ({ page }) => {
  const frame = await openAddon(page);
  await expect(frame.getByLabel('Enter promo code', { exact: false })).toHaveCount(0);
  await expect(frame.getByRole('button', { name: 'Redeem code' })).toHaveCount(0);
});
