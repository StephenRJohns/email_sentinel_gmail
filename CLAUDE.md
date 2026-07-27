# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**emAIl Sentinel** — a Google Workspace Gmail Add-on (Google Apps Script, V8 runtime), contextual-only: the user opens an email, opens the add-on panel, and clicks "Evaluate this email". Every enabled user-defined plain-English rule is evaluated against that one open message using the Gemini REST API, and matches dispatch alerts via SMS, Google Chat, Calendar, Sheets, Tasks, Docs, or MCP/webhooks. There is **no background scanning** — the add-on holds only the `gmail.addons.current.message.readonly` scope (sensitive-tier), deliberately avoiding the restricted `gmail.readonly` scope and its annual paid CASA security assessment. Whole-mailbox 24/7 automation is the separate self-hosted Pro product.

There is no build step, no npm packages at runtime, no transpilation. Everything runs server-side on Google's infrastructure. The only local tooling is `clasp` for pushing files.

## Deploy / develop commands

```bash
# Install clasp once globally
npm install -g @google/clasp

# Authenticate
clasp login

# Push all .gs / .html / appsscript.json to the linked Apps Script project
clasp push

# Open the project in the Apps Script browser editor
clasp open

# Pull remote changes back to local (rarely needed)
clasp pull
```

The `scriptId` in `.clasp.json` links this directory to the live Apps Script project. The emAIl Sentinel Script ID is `1Cq_G1N935YKuuYe-5rViGnrHybrmgqJANwKUzlOzGP9UecGNyE07ssrR`. Apps Script has no in-repo unit tests; manual testing is done by running functions from the Apps Script editor or by opening an email in Gmail and clicking "Evaluate this email" in the add-on panel.

## Architecture

### Data flow

```
User opens a message → contextual trigger (appsscript.json contextualTriggers)
  └─ onGmailMessageOpen()                    [ContextualEvaluator.gs]  ← cheap card, no Gmail/Gemini call
       └─ "Evaluate this email" button → handleEvaluateOpenMessage()
            ├─ loadSettings() / loadRules()  [SettingsManager.gs / RulesManager.gs]
            ├─ GmailApp.setCurrentMessageAccessToken(e.gmail.accessToken)
            │  + getMessageById(e.gmail.messageId) → normalizeMessage_()
            ├─ evaluateEmailAgainstRule()    [RuleEvaluator.gs]  ← Gemini REST call, per enabled rule
            ├─ generateAlertMessage()        [RuleEvaluator.gs]  ← Gemini REST call, per match
            ├─ dispatchAlerts()              [AlertDispatcher.gs]
            └─ buildEvaluationResultCard_()  ← per-rule match/no-match/failed rows

Add-on UI (Google Cards) — all stateless, re-read UserProperties every render
  └─ onHomepage() / action handlers          [Code.gs → Cards.gs]
```

### State storage — UserProperties only

All persistent state lives in `PropertiesService.getUserProperties()` (per-user, per-script, private, 9 KB per value):

| Key | Contents |
|---|---|
| `mailsentinel.settings` | Gemini key/model, all SMS provider credentials, alert channel IDs |
| `mailsentinel.rules` | JSON array of rule objects (see schema in RulesManager.gs header) |
| `mailsentinel.log` | Ring buffer of last ~60 activity log lines |

There is no database, no backend, no external storage. (Legacy keys `mailsentinel.seen` and `mailsentinel.lastRunAt` from the pre-contextual scanning architecture may still exist in older installs; nothing reads them anymore.)

### Key design constraints

**Contextual scope is the load-bearing constraint:** `gmail.addons.current.message.readonly` can read *only* the message the user currently has open, and only during add-on interaction via `GmailApp.setCurrentMessageAccessToken(e.gmail.accessToken)` in the same execution. `GmailApp.search()` and any other-mail access are impossible. Do not reintroduce `gmail.readonly` (or `script.scriptapp`) — dropping them is what exempts the app from Google's restricted-scope CASA assessment; that is a deliberate business decision (2026-07-26), not an oversight. Time-driven triggers are also gone: no background scanning of any kind.

**Apps Script execution limit:** Scripts time out at 6 minutes. `evaluateOpenMessage_()` guards with `EVAL_MAX_RUN_MS = 240000` (4 min) — after that, remaining rules are reported as "Skipped" on the result card rather than risking the hard kill mid-dispatch. Each rule costs up to two Gemini calls (evaluate + alert format on match) plus channel dispatch.

**9 KB UserProperties limit:** `saveRules()` throws a user-visible error if rules JSON exceeds 9 KB. `migrateRule_()` strips the legacy `labels` field on load so old rules don't waste the budget.

**Log buffering:** `startLogBuffering()` + `flushLog()` batch all `activityLog()` calls into a single UserProperties write. Interactive evaluation writes log entries directly (the user is already waiting on the spinner, and unbuffered writes survive a hard kill); the buffering pair is still used by `Diagnostics.gs`.

**Cards are fully stateless:** Every card builder reads UserProperties fresh. Never cache state in global variables between card renders.

**No back-arrow event in CardService:** Google's add-on framework does not emit an event when the user taps the system back arrow at the top-left of a card. Editor cards therefore cannot show a "discard unsaved changes?" confirmation dialog — pressing back instantly pops the navigation stack and the in-flight form values are dropped. The mitigation is `buildUnsavedChangesNotice_()` in `Cards.gs`, which is the first section on every editor card (rule editor, settings, MCP server editor, SMS recipient editor, chat space editor) and warns the user to click Save before navigating back. If a future iteration wants real protection, the next step would be a draft-persistence layer keyed on form-input `setOnChangeAction` (which fires on blur, not on every keystroke, and is not available on plain `TextInput` for typing-time auto-save).

**Action color conventions on FILLED buttons:** Cards.gs defines three brand color constants used to distinguish button intent. `BRAND_PURPLE_` (`#581c87`) is the primary brand color and the default for non-destructive FILLED CTAs (Save, Generate, + New rule, Evaluate this email). `BRAND_PURPLE_LIGHT_` (`#7c3aed`) is the secondary FILLED CTA for cards that already have a primary purple button (currently unused after the contextual conversion — kept for future layouts). `BRAND_RED_` (`#c62828`) marks every Delete button in the UI (rule list Delete + Delete all rules, MCP/SMS/Chat editor Delete buttons, and all corresponding confirmation Delete buttons). The rule toggle button reads `Off` when the rule is currently on (action: turn off) and `On` when currently off — short labels because CardService scales row widths down at higher card-section counts, and longer labels (`Disable`/`Enable`) wrapped the Delete button onto a second row at 5+ rules. The current state is visible from the section header (`✅ ON` / `⏸ OFF`), so the button doesn't duplicate it. Toggle is plain TEXT style in both states (a FILLED yellow on Disable was tried earlier but caused CardService's per-card column-width alignment to inflate every toggle slot, pushing Delete onto a second row even with one ON rule). Text color is wrapped explicitly via `whiteText_()` for dark backgrounds (purple, red); CardService doesn't auto-pick text color reliably for FILLED buttons with custom backgrounds. The `BRAND_YELLOW_LIGHT_` constant and `blackText_()` helper are still defined but unused — kept in case a future caution-colored button finds a layout that works without per-section width spillover. New action buttons should be classified into one of the three live categories rather than introducing new brand colors.

**SelectionInput auto-save pattern (`setOnChangeAction`):** `SelectionInput.setOnChangeAction` fires immediately when the user picks a new option, so a dropdown can persist its value without a Save click — the Settings card's SMS provider dropdown uses this (`handleSmsProviderChange`). The response must not be an empty `ActionResponse` (CardService rejects it); return at least a navigation `updateCard`. The same pattern does not work for `TextInput` (its onChangeAction fires only on blur, and only on types that support it), which is why editor drafts can't auto-save while typing.

**Universal-action navigation has no native back arrow; the kebab "Home" item is the escape hatch:** Sub-cards reached via the kebab "⋮" menu items in `appsscript.json universalActions` (Rules, Settings, Activity Log, Help) use `UniversalActionResponseBuilder.displayAddOnCards`, which *replaces* the navigation stack rather than pushing onto it. Gmail therefore does not render its native back arrow on those cards. Likewise, every confirm-delete handler (`handleConfirmDeleteRule`, `handleConfirmClearLog`, `handleConfirmDeleteMcpServer`, `handleConfirmDeleteSmsRecipient`, `handleConfirmDeleteChatSpace`, and the starter-rules creation handler) does `popToRoot().updateCard(buildXxxCard())` to dismiss the confirmation sub-card, which leaves the root card with no back arrow either. The kebab menu's first entry — `Home` → `actionShowHome` (Code.gs) — gives users a reliable way back to the home card from any state. An earlier iteration prepended an in-card `homeButtonSection_()` to each root card; that was removed because the kebab Home entry already covers the no-back-arrow case and the in-card variant cluttered the top of every card. Universal-action responses do *not* support `setNotification` toasts — any kebab flow that needs visible feedback must land on a card (evaluation results land on `buildEvaluationResultCard_()`, which is pushed from a button action, where toasts and spinners do work).

**Community Discussions universal action opens an external URL directly:** The kebab "⋮" menu's "Community discussions" item (`appsscript.json` → `actionOpenDiscussions` in `Code.gs`) returns `CardService.newUniversalActionResponseBuilder().setOpenLink(...)` rather than `displayAddOnCards`. This is the supported pattern for a kebab item that should jump straight to an external URL with no card render — `setOpenLink` on `UniversalActionResponseBuilder` opens the URL (`https://github.com/StephenRJohns/email_sentinel/discussions`) in a new tab without touching the add-on's card stack. The github.com/ prefix is already whitelisted in `appsscript.json openLinkUrlPrefixes`. The home card has a parallel "Community" plain-text button next to "Help" that uses the same URL via `TextButton.setOpenLink` (FILLED + setBackgroundColor + setOpenLink combinations have caused platform-rejection errors in this codebase, so all Community-link buttons stay plain TEXT style).

**Long-running work must sit behind a button click, never a trigger render:** Universal actions and trigger functions (`onHomepage`, `onGmailMessageOpen`) cannot show a load indicator — running a slow operation inside them blocks the panel silently for its full duration and feels broken (empirically confirmed in the pre-contextual era). That's why `onGmailMessageOpen` builds a cheap card with an "Evaluate this email" button instead of evaluating directly: the button's action handler (`handleEvaluateOpenMessage`) is where the Gemini calls happen, and CardService renders its default spinner on the button while the action runs. Keep trigger renders cheap; put anything slow behind a button.

**All user-visible dates are localized via `formatLocalDateTime_` (`Code.gs`):** `Date.toISOString()` produces UTC/Zulu strings like `2026-04-27T22:29:58.636Z` which are confusing to non-UTC users. `formatLocalDateTime_(d)` uses `Utilities.formatDate(d, getUserTimeZone_(), 'yyyy-MM-dd h:mm:ss a z')` to emit `2026-04-27 5:29:58 PM CDT`. `getUserTimeZone_()` prefers `CalendarApp.getDefaultCalendar().getTimeZone()` (matches what Gmail/Calendar display in their UI), falling back to `Session.getScriptTimeZone()`, and is cached in a module-level `_cachedUserTz_` so a single evaluation that writes many activity-log entries doesn't pay the CalendarApp round-trip per entry (Apps Script preserves module state for one execution, exactly the cache scope we want). `ContextualEvaluator.gs:normalizeMessage_` pre-formats `receivedDateTime` so all downstream presentation contexts (Calendar event descriptions, Tasks notes, Sheets rows, the Gemini evaluation prompt, and the alert text Gemini generates) inherit the localized format. `receivedMillis` (raw epoch) is kept alongside for any code that needs sortable/comparable timestamps. The activity-log timestamp prefix is also localized in 12-hour AM/PM (`yyyy-MM-dd h:mm:ss a`); the `buildActivityCard` bolding splits on the literal double-space separator between stamp and message rather than a fixed offset (older 24-hour entries still in the 60-line ring buffer continue to render correctly during rollover). New code that surfaces a date to the user should use `formatLocalDateTime_` rather than calling `.toISOString()` or `.toString()`.

**MCP Streamable HTTP responses can be SSE; tool-level errors are inside `result.isError`:** `sendMcpAlert_` in `McpServers.gs` POSTs JSON-RPC `tools/call` to the MCP server and the response can come back with `Content-Type: application/json` (single JSON object) *or* `Content-Type: text/event-stream` (one or more SSE message events whose `data:` lines hold the JSON-RPC response). Asana's V2 MCP at `https://mcp.asana.com/v2/mcp` returns SSE in practice. The handler detects `text/event-stream` in the response Content-Type header and reassembles `data:`-prefixed lines into a JSON string before parsing — without that, `JSON.parse` throws on the SSE body, the catch block swallows it as a "non-JSON ack", and the dispatcher logs a misleading `MCP alert sent to: <name>` even when the tool actually failed. Three error tiers must all be checked: (1) HTTP non-2xx → `'MCP "<name>" HTTP <code>: <body>'`; (2) JSON-RPC envelope error at `body.error` → `'MCP "<name>" error: <body.error>'`; (3) tool-level error at `body.result.isError === true` with detail in `body.result.content[].text` → `'MCP "<name>" tool error: <detail>'`. New MCP server presets in `MCP_TYPE_DEFAULTS` should not skip these checks.

**Gemini via REST, not SDK:** `callGemini_()` uses `UrlFetchApp` + the user's own API key. No extra OAuth scope needed (only `script.external_request`).

### All OAuth scopes are actively used

Every scope in `appsscript.json` is required — and none is restricted-tier (see the contextual-scope constraint above before adding any):
- `gmail.addons.execute` — add-on execution
- `gmail.addons.current.message.readonly` — reading the currently open message in `handleEvaluateOpenMessage` (sensitive-tier; the only Gmail scope)
- `calendar` — `CalendarApp` in `sendCalendarAlert_()` (also `getUserTimeZone_()`)
- `spreadsheets` — `SpreadsheetApp` in `sendSheetsAlert_()`
- `tasks` — Tasks REST API in `sendTasksAlert_()` (via `ScriptApp.getOAuthToken()`)
- `documents` — `DocumentApp` in `sendDocsAlert_()`
- `script.external_request` — `UrlFetchApp` for Gemini + all SMS providers

### Email alerting is intentionally absent

We do not support email as an alerting channel. Alert channels are: SMS, Google Chat, Google Calendar, Google Sheets, Google Tasks, Google Docs, and External integrations. The "External integrations" umbrella covers two dispatch shapes: (1) **MCP servers** that speak JSON-RPC 2.0 over HTTPS with `tools/call`, and (2) **direct HTTPS POST** of a body template with no JSON-RPC envelope (Asana REST, generic webhook). The Type dropdown lists, paired by "Custom *X*" (user-provided endpoint) and named-vendor presets: **Custom MCP** (HTTPS MCP server speaking JSON-RPC 2.0 — recommended starting point, Help has a Cloudflare Worker walkthrough); **Custom webhook (HTTPS POST)** (any HTTPS endpoint accepting JSON — Slack incoming webhooks, Discord webhooks, n8n / Zapier / Make scenarios, custom internal APIs); **Microsoft Teams** (Microsoft Graph MCP, renamed from "Microsoft 365" since Teams is the actual surface; OAuth + admin-consent friction); **Asana (REST API — easier)** (direct POST to `/api/1.0/tasks` with a PAT, not MCP); **Asana (MCP V2 — requires OAuth)** (true JSON-RPC, tokens expire ~hourly). Slack was removed as a named type because Slack does not host an MCP server; Slack users now pick **Custom webhook** with their incoming-webhook URL. Legacy stored types `slack` and `ms365` migrate at editor-render time (slack→custom, ms365→teams) so existing user configs survive. The set `DIRECT_POST_TYPES = ['asana-rest', 'webhook']` in `McpServers.gs` is the canonical list of types that route through `sendDirectPost_` instead of the JSON-RPC envelope; the editor card hides the Tool name field for those types and renames "Tool arguments" → "Request body".

### SMS provider dispatch

`dispatchAlerts()` routes SMS through a function-dispatch table in `AlertDispatcher.gs`. Adding a new SMS provider means: adding the provider object to `SMS_PROVIDER_INFO`, adding the function name to `SMS_PROVIDERS`, and implementing `sendXxxSms_(toNumber, text, settings)`.

### License tiers

`LicenseManager.gs` defines `TIERS` (Free vs Pro) with per-tier limits:
`maxRules`, `allowChat`, `allowMcp`, `allowAiSuggest`, `logRetentionDays`
(currently all wide-open on both tiers — the add-on is the free Lite edition
and Pro is a separate self-hosted product). Enforcement is layered:
`handleNewRule` (early gate at "+ New rule" click — checks `canAddRule()`
before opening the editor so the user doesn't fill out a rule that won't
save), `upsertRule` (defense-in-depth rule count + Chat/MCP stripping at save
time, also covers programmatic save paths that bypass the UI),
`handleHelpWriteRuleText` / `handleHelpWriteAlertText` (Pro gate for AI rule
writing), and `buildRuleEditorCard` (UI hides gated channel sections). Tier is persisted in `settings.license.tier`; for pre-launch
testing, select `setTierPro` or `setTierFree` from the Apps Script editor's
function dropdown (in `LicenseManager.gs`) and click Run. These are no-arg
wrappers around the underscore-private `setTier_(tier)` helper. Automatic
entitlement sync with the Marketplace Subscription API is a planned
integration for the paid-tier launch.

### Screenshot mode

`ScreenshotMode.gs` exposes a developer-only toggle (`setScreenshotModeOn` /
`setScreenshotModeOff` from the Apps Script editor's function dropdown) that
substitutes safe demo PII into outgoing alerts and on the recipient-display
surfaces so Marketplace screenshots don't leak real names, phone numbers, or
email addresses. State persists in `settings.screenshotMode`.

When ON:
- `emailData.from` is rewritten to `Tester <test@example.com>` before
  `generateAlertMessage` is called (so the Gemini-generated alert text uses
  the fake sender) and before `dispatchAlerts` (so Calendar / Sheets / Tasks
  descriptions get it too).
- `emailData.subject` and `emailData.body` are run through
  `scrubScreenshotPii_`, which applies a user-defined substring redaction
  list before they reach Gemini.
- The SMS dispatch recipient is overridden to `+12105551212`.
- The Settings-card SMS recipients list and the Rule-editor SMS multi-select
  display `Tester` for each name and `+12105551212` for each number, via
  `applyScreenshotName_` / `applyScreenshotPhone_`.
- `ContextualEvaluator.gs` activity log lines use the same overridden values.

**Real developer PII never enters source code.** The redaction pair list
(real → demo) lives in UserProperties under
`mailsentinel.screenshotRedactions` and is configured at runtime via
`setScreenshotRedaction(real, demo)`. The Apps Script editor's "Run" button
can't pass arguments, so use the local stub `configureMyScreenshotRedactions`:
edit it locally to add your `setScreenshotRedaction(...)` calls, run once
from the editor, then **revert the stub body to empty before committing**.
The values are now in UserProperties (private, per-user) and persist across
deploys until cleared via `clearScreenshotRedactions()`. `listScreenshotRedactions()`
returns the in-memory list and logs only the count to Logger — never the
values themselves, so the activity log and Stackdriver logs remain
PII-free even when redactions are configured. The hardcoded demo values
(`Tester`, `test@example.com`, `+12105551212`) are fictional — `555-1212` is
the standard demonstration suffix in the North American Numbering Plan.

### Founding-member lifetime offer — retired

The launch-only $79 lifetime tier was retired when the add-on became the
free Lite edition. `foundingMembersRemaining()` /
`isFoundingMemberOfferActive()` in `LicenseManager.gs` are kept as stubs
returning 0/false so older call sites stay safe.

### Branding

The app name is **emAIl Sentinel** — lowercase e, lowercase m, uppercase A, uppercase I (together: "AI"), lowercase l, space, uppercase S, lowercase entinel. This exact capitalization must be preserved everywhere.
