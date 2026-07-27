# emAIl Sentinel — End-to-End Test Plan · Issue #10

Complete every item in order. All items in Sections 1–8 and 14–22 are required.
Sections 9–13 are optional alert-channel tests. Section 23 is a server-side self-test required only when the promo redemption service is deployed.

**Automation vs. manual scope.** Steps in this plan that would send a real SMS are manual-only — the Playwright suite in `testing/playwright/` intentionally skips any action that dispatches an actual text message (see Section 9). All other required steps are automated.

**Architecture note (2026-07-26).** The add-on is contextual-only: it reads only the email you have open, only when you click **Evaluate this email** — it never scans your mailbox in the background. There are no time-driven triggers, no scan schedule, no seen-message baseline, no business-hours or max-email-age settings, and the only Gmail scope is `gmail.addons.current.message.readonly`. Section 15 verifies this posture explicitly.

---

## 1 · Prerequisites

*Confirm these are in place before opening Gmail.*

- [ ] Google account with Gmail access.
- [ ] Gemini API key obtained from aistudio.google.com/app/apikey (free, no credit card required).
- [ ] Add-on installed — either via "clasp push + Test deployments → Install" or by pasting source files manually in script.google.com.
- [ ] Gmail is open in a browser tab and the emAIl Sentinel icon is visible in the right-hand add-on rail.
- [ ] **(Optional, for a clean run)** In the Apps Script editor, run `resetUserPropertiesForTesting()` (defined in `Code.gs`) to clear all settings, rules, and activity log. The Logger should output: `All user properties cleared — add-on is in pristine first-use state.` Reload the add-on card after running.

---

## 2 · First-Open Guards & Initial Settings Setup

*Verify the no-Gemini-key contextual guard, then configure the key and verify the connection.*

- [ ] **Contextual guard: no Gemini key.** With no key configured, open any email in Gmail, then open the add-on panel (contextual card, title "emAIl Sentinel Lite"). The card shows bold red text "No Gemini API key configured." followed by "Open Settings and paste a key first — rule evaluation runs on your own Gemini." and an **Open Settings** button. The **Evaluate this email** button is NOT rendered in this state.
- [ ] Click the emAIl Sentinel icon in the Gmail add-on rail (or navigate Home).
- [ ] Home card loads with title "emAIl Sentinel Lite". Status rows show: Plan = "Lite", Rules = "✅ 0 &nbsp; ⚠️ 0 &nbsp; ⚪ 0", Gemini API key = "NOT configured".
- [ ] A "How it works" paragraph is visible: open any email, open emAIl Sentinel in the side panel, click **Evaluate this email**.
- [ ] A "Want 24/7 automatic monitoring?" paragraph describes emAIl Sentinel Pro (self-hosted, whole-mailbox, Gmail and Outlook) with a plain-text **Upgrade to Pro** button that opens the external upgrade page in a new tab.
- [ ] Quick setup checklist is visible on the home card with grouped structure: a top-level "- Open Settings" bullet followed by indented sub-bullets "- Paste your Gemini API key" and "- Set up alert channels", a bullet for creating a rule ("Create a rule or click Starter rules below"), and a final bullet "- Open any email and click **Evaluate this email** in the side panel".
- [ ] Click Settings (either via the universal action "⋮" menu or the Settings nav button).
- [ ] Paste your Gemini API key into the "Gemini API key" field. The aistudio.google.com/app/apikey URL is a tappable link.
- [ ] Confirm model is "gemini-2.5-flash" (default).
- [ ] **No scanning settings anywhere.** Confirm the Settings card has NO "Scan email every" dropdown, NO "Only check during business hours" checkbox, NO "Only scan emails newer than (days)" field, and NO "Reset baseline" button. The sections present are: Gemini (rule evaluation), SMS provider, Google alert channels, External integrations, and the Save/Test buttons.
- [ ] Click "Save settings". Toast notification reads: "Settings saved."
- [ ] Click "Test Gemini". Toast reads: "Gemini OK — model responded."
- [ ] Navigate back to Home card. Gemini API key row now shows "Configured". In the Quick setup checklist, the "Paste your Gemini API key" sub-bullet now shows a ✓.

---

## 3 · Starter Rules

*Create the five built-in rules from the home card shortcut, then verify the no-enabled-rules contextual guard.*

- [ ] From the home card, click "Starter rules".
- [ ] Preview card shows 5 starter rules (Urgent emails, Invoices & payment requests, Shipping & delivery updates, Security & account alerts, Bills & subscription renewals).
- [ ] Click "Create starter rules".
- [ ] Toast reads "5 starter rules created (disabled). Edit each to add alert recipients and enable." All 5 rules are created — there is no per-plan rule cap on Lite.
- [ ] Rules card opens. Created rules are listed with ⏸ OFF status. Home card Rules row shows "✅ 0 &nbsp; ⚠️ 0 &nbsp; ⚪ 5".
- [ ] **Contextual guard: no enabled rules.** With all rules still disabled, open any email and open the add-on panel. The contextual card reads "No enabled rules yet. Create one (or enable an existing rule), then come back to any open email and evaluate it." with an **Open Rules** button. The **Evaluate this email** button is NOT rendered in this state.

---

## 4 · Create a Dedicated Test Rule

*Create a simple, uniquely-named rule to verify evaluation without triggering real alerts.*

- [ ] Click Rules → "+ New rule".
- [ ] **No labels field.** Confirm the editor has NO "Gmail labels to watch" field — rules apply to whatever email you evaluate.
- [ ] Rule name field: enter `Test rule — E2E`
- [ ] Rule text field (titled "Rule text (plain English)"): enter `Any email with SENTINEL_TEST anywhere in the subject line.`
- [ ] Alert message content (titled "Alert message content (plain English)"): leave as default.
- [ ] Leave all alert channel checkboxes unchecked for now (SMS, External integrations, Google Chat, Calendar, Sheets, Tasks, Docs).
- [ ] Click "Save". Toast reads: "Rule saved, but no alert channels configured. Edit the rule to add at least one."
- [ ] Rule appears in the Rules list as ON (enabled by default).
- [ ] **Malformed ⚠️ count.** Because the rule is enabled with no alert channels, it counts as malformed: the home card Rules row and Rules nav button show "✅ 0 &nbsp; ⚠️ 1 &nbsp; ⚪ 5". (Section 19 covers the matching red "None configured" Channels-row warning.)

---

## 5 · Send the Test Email

*Trigger a real match by sending a precisely-worded email to your own inbox.*

- [ ] Open Gmail Compose (in a different tab or window).
- [ ] To: your own Gmail address.
- [ ] Subject: exactly `SENTINEL_TEST — please ignore`
- [ ] Body: anything (or leave blank).
- [ ] Send the email.
- [ ] Wait ~30 seconds, then confirm the email appears in your Gmail INBOX.

---

## 6 · Evaluate the Open Email (Match Path)

*Verify Gemini evaluates the open email against every enabled rule and the result card + activity log record the match.*

- [ ] Open the `SENTINEL_TEST — please ignore` email in Gmail, then open the add-on panel.
- [ ] The contextual card (title "emAIl Sentinel Lite") reads "Check this email against your 1 enabled rule. Matches send alerts to the channels each rule specifies." with a grey hint that evaluation typically takes a few seconds per rule, and a filled brand-purple **Evaluate this email** button.
- [ ] Click **Evaluate this email**. The button shows CardService's default spinner while evaluation runs (one Gemini call per enabled rule, plus one per match for alert formatting).
- [ ] An **Evaluation result** card pushes on top (Gmail's native back arrow is available). The banner reads "✅ 1 of 1 rule matched." in green, with the email subject in grey below it.
- [ ] A per-rule section headed "Test rule — E2E" shows "✅ Match — alerts sent" in green, followed by Gemini's brief reason.
- [ ] Click the "View activity log" button below the rule rows.
- [ ] Log shows: `Evaluating open email — From: [your address]  |  Subject: SENTINEL_TEST…`
- [ ] Log shows: `Evaluating against rule "Test rule — E2E" …`
- [ ] Log shows: `MATCH! [brief Gemini reason]`
- [ ] No SMS / Chat / Calendar / Sheets / Task / Docs / MCP entries appear (no channels were configured).

---

## 7 · Evaluate a Non-Matching Email

*Verify the no-match path renders correctly.*

- [ ] Open any ordinary email that does NOT contain `SENTINEL_TEST` in the subject, then open the add-on panel and click **Evaluate this email**.
- [ ] The **Evaluation result** card banner reads "➖ 0 of 1 rule matched." in grey, with the email subject below it.
- [ ] The "Test rule — E2E" section shows "➖ No match" in grey with Gemini's reason.
- [ ] Activity log records `No match. [reason]` for the rule; no alert dispatch entries appear.
- [ ] **Failure row (optional, hard to force).** If a Gemini call fails for a rule (e.g. quota exhausted), that rule's row reads "⚠️ Evaluation failed" in red and the banner appends "(N not evaluated)". Rules skipped by the 4-minute evaluation time cap read "⚠️ Skipped" with "Re-run to evaluate this rule."

---

## 8 · Activity Log UI

*Verify the log controls and timestamp formatting work correctly.*

- [ ] Activity log displays entries newest-first.
- [ ] **Entry formatting.** Each entry's timestamp prefix is bold and rendered in 12-hour AM/PM in the user's local timezone — `yyyy-MM-dd h:mm:ss a` (e.g. `2026-04-27 5:29:58 PM`). Entries are separated by a blank line for readability. The bolding uses the literal double-space separator between stamp and message, so any older 24-hour entries still in the 60-line ring buffer also bold correctly during rollover.
- [ ] **Local timezone consistency.** Compare an activity-log timestamp to the **Timestamp** column of the same alert's Sheets row (Section 12) and the date in the Calendar event description (Section 11). All three should show the same local-timezone wall-clock time within seconds of each other. If they disagree, the user's primary Calendar timezone is wrong — fix it in [calendar.google.com](https://calendar.google.com/calendar/u/0/r/settings) ▸ Time zone.
- [ ] "Refresh" button reloads the log without navigating away.
- [ ] If log has more than 20 entries, "Show older (N more)" button appears and loads additional entries.
- [ ] **Kebab "Home" item returns to the home card.** Open Rules, Settings, Help, and Activity log via both home-card buttons (stacked nav, Gmail's native back arrow visible) and via the kebab "⋮" menu universal actions (replaced nav, no native back arrow). From any of these cards, open the "⋮" menu and pick **Home** — it returns to the home card from either entry path. Root cards no longer carry an in-card Home button; the kebab Home item is the sole escape hatch. The Starter rules card is the one nav target reachable only via push from home, so the back arrow is always available there too. (See Section 18 for the full coverage matrix.)

---

## 9 · SMS Alert Channel Test

*Optional — requires an SMS provider. Recipients are named contacts managed via add/edit/delete cards in Settings.*

> **Manual-only section.** Every step in this section is performed by the tester by hand. The Playwright automation suite intentionally does NOT run any step that would trigger a real SMS send (Send test SMS button, or a rule-triggered SMS dispatch), to avoid burning provider credits and spamming phones. Automation may still exercise SMS *UI configuration* flows, but never the actual send.

- [ ] [Optional] In Settings → SMS provider dropdown, select your provider.
- [ ] [Optional] Enter the required provider credentials (Textbelt: API key; Telnyx/Plivo/Twilio: API/SID + Auth + From number; ClickSend: username + key; Vonage: key + secret; Webhook: HTTPS endpoint URL). Credential fields are masked — only the last 4 characters are shown; leave blank to keep the current value. **For Telnyx, Plivo, Twilio:** the "From" number renders as a country-code dropdown plus a digits-only field (same shape as the test number / SMS recipient). Pick the country code, type digits without the leading code (e.g. `2108992131`), Save → stored as E.164 (`+12108992131`). Re-open Settings — dropdown shows the same country code, digits field shows the local digits. Empty digits → save proceeds with empty stored "From" (provider won't accept SMS dispatch until set). Non-numeric or too-short/too-long digits → toast: `Twilio "From" number: Phone number must be 7–15 digits.` (or the analogous Telnyx/Plivo message) and save aborts.
- [ ] [Optional] Scroll to the SMS recipients section (appears once a provider is selected). Click "Add recipient". Confirm the editor has a "Country code" dropdown (defaults to "🇺🇸 +1 (US/Canada)") and a "Phone number (digits only)" input. Enter Name = "E2E Phone", leave country code at +1, enter `5551234567` in the digits field, save. Toast reads `Recipient "E2E Phone" saved as +15551234567.` Re-open the recipient — dropdown is still +1 and digits show `5551234567`.
- [ ] [Optional] Edit the recipient, change the country code dropdown to a non-US entry (e.g. 🇬🇧 +44), enter `7911123456` in digits, save. Toast reads `... saved as +447911123456.` Re-open — dropdown shows +44, digits show `7911123456`.
- [ ] [Optional] Try saving with an empty digits field — toast: "Phone number is empty." With non-numeric or too-short/too-long input — toast: "Phone number must be 7–15 digits." (or "Phone number is empty." if all non-digit characters).
- [ ] [Optional] In the "Send test SMS to" field, enter your number. Click "Save settings". Toast: "Settings saved."
- [ ] [Optional] Click "Send test SMS". Toast: "Test SMS sent to +1… via [provider]."
- [ ] [Optional] Confirm SMS received on your phone with "[emAIl Sentinel] Test" in the text.
- [ ] [Optional] Edit "Test rule — E2E". In the Alert channels section, an SMS checkbox list now shows "E2E Phone (+1…)" — tick it → Save.
- [ ] [Optional] Send another test email (subject: `SENTINEL_TEST SMS`), open it in Gmail, and click **Evaluate this email** in the add-on panel.
- [ ] [Optional] Evaluation result card shows "✅ Match — alerts sent" for the rule. Activity log: "SMS alert sent to: +1…"
- [ ] [Optional] Confirm rule-triggered SMS received on phone.
- [ ] [Optional] Webhook provider only: verify your endpoint receives the POST with JSON body `{"to": "+15551234567", "body": "[emAIl Sentinel] …"}` and responds HTTP 200.

---

## 10 · Google Chat Alert Channel Test

*Optional — requires a Google Workspace paid account with Chat enabled. Spaces are managed via add/edit/delete cards in Settings.*

- [ ] [Optional] In Settings → Google alert channels: click "Add Chat space". Enter the space name (e.g. "E2E Chat") and paste its webhook URL. Save the space card.
- [ ] [Optional] Click "Save settings".
- [ ] [Optional] Edit "Test rule — E2E". In the Alert channels section, the Google Chat checkbox list now shows "E2E Chat" — tick it → Save.
- [ ] [Optional] Send another test email (subject: `SENTINEL_TEST Chat`), open it, and click **Evaluate this email**.
- [ ] [Optional] Result card shows "✅ Match — alerts sent". Activity log: "Chat alert sent to: E2E Chat".
- [ ] [Optional] Confirm message posted in the configured Chat space.

---

## 11 · Google Calendar Alert Channel Test

*Optional — uses your primary calendar by default (leave Calendar ID blank).*

- [ ] [Optional] Edit "Test rule — E2E" → tick the "Google Calendar — create an event" checkbox → Save.
- [ ] [Optional] Send another test email (subject: `SENTINEL_TEST Calendar`), open it, and click **Evaluate this email**.
- [ ] [Optional] Activity log: "Calendar event created."
- [ ] [Optional] Open Google Calendar. Event exists with title "[emAIl Sentinel] Test rule — E2E: SENTINEL_TEST…".
- [ ] [Optional] Event description contains From, Subject, Received, and the Gemini-generated alert message.

---

## 12 · Google Sheets, Tasks & Docs Alert Channel Tests

*Optional — alerts are written to the spreadsheet specified in Settings ▸ Sheets ID (or auto-created if blank), to the default Tasks list, and appended to the doc specified in Settings ▸ Docs ID (or auto-created if blank).*

- [ ] [Optional] **Sheets ID — paste a URL.** In Settings, paste a full Google Sheets URL (e.g. `https://docs.google.com/spreadsheets/d/<ID>/edit?gid=0#gid=0`) into the Sheets ID field and click Save settings. (Note: the displayed value may not visually update until reload — the ID is used correctly at runtime regardless.)
- [ ] [Optional] **Sheets per-rule override.** Edit "Test rule — E2E" → tick "Google Sheets — append a log row". A "Sheets ID or URL for this rule" field appears below the checkbox. Leave blank to use the global Settings value, or paste a different Sheets URL/ID to override per rule. Save.
- [ ] [Optional] Send another test email (subject: `SENTINEL_TEST Sheets`), open it, and click **Evaluate this email**.
- [ ] [Optional] Activity log: "Sheets row appended." (or "Auto-created alert spreadsheet: [ID]" the first time, if no Sheets ID was set anywhere).
- [ ] [Optional] Open the target spreadsheet. The alert row is appended to the **first tab** (no separate "Alerts" tab is created). If the first tab was empty, headers are added: Timestamp, Rule, From, Subject, Received, Alert Message. The alert message column contains plain-text content (no `**markdown**` artifacts).
- [ ] [Optional] **Local time zone in Sheets / Docs.** All date columns and entry headers (Sheets Timestamp / Received columns, Docs entry heading and Received line) render in your local timezone in `yyyy-MM-dd h:mm:ss AM/PM TZ` format (e.g. `2026-04-27 5:29:58 PM CDT`) — never UTC/Zulu (`...T22:29:58.636Z`). The timezone is taken from your primary Google Calendar; verify it matches what Gmail and Calendar display. The Calendar event description, Tasks note body, and Docs entry body for the same alert all use the same format.
- [ ] [Optional] **Tasks per-rule override.** Edit "Test rule — E2E" → tick "Google Tasks — create a task". A "Tasks list ID for this rule" field appears below the checkbox. Leave blank to use the global Settings value (default `@default` = "My Tasks"), or paste a specific list ID. Save.
- [ ] [Optional] Send another test email (subject: `SENTINEL_TEST Tasks`), open it, and click **Evaluate this email**.
- [ ] [Optional] Activity log: "Task created."
- [ ] [Optional] Open Google Tasks (calendar.google.com/calendar/u/0/r/tasks or the Gmail sidebar → Tasks icon). Task "[emAIl Sentinel] Test rule — E2E: SENTINEL_TEST…" exists in "My Tasks" (default list). Task notes contain plain-text content.
- [ ] [Optional] **Calendar per-rule override.** Same pattern — tick "Google Calendar — create an event" and a "Calendar ID for this rule" field appears. Blank uses the global Settings value (or `primary` if that's also blank).
- [ ] [Optional] **Docs ID — paste a URL.** In Settings, paste a full Google Docs URL (e.g. `https://docs.google.com/document/d/<ID>/edit`) into the Google Docs ID field and click Save settings. Same URL-vs-ID flexibility as Sheets — the ID is auto-extracted from a pasted URL on save.
- [ ] [Optional] **Docs per-rule override.** Edit "Test rule — E2E" → tick "Google Docs — append a log entry". A "Docs ID or URL for this rule" field appears below the checkbox. Leave blank to use the global Settings value, or paste a different Doc URL/ID to override per rule. Save.
- [ ] [Optional] Send another test email (subject: `SENTINEL_TEST Docs`), open it, and click **Evaluate this email**.
- [ ] [Optional] Activity log: "Docs entry appended." (or "Auto-created alert doc: [ID]" the first time, if no Docs ID was set anywhere).
- [ ] [Optional] Open the target doc. On a freshly auto-created doc, the top of the document has a TITLE-styled "emAIl Sentinel — Alert Log" heading and a one-line "Auto-created on …" subtitle. Each fired rule appends a horizontal-rule separator, a HEADING3 line `<timestamp>   |   Rule: <rule name>`, and plain paragraphs `From:`, `Subject:`, `Received:`, then the Gemini-formatted alert message. Multiple alerts accumulate at the bottom in chronological order.

---

## 13 · MCP Server Alert Channel Test (Asana)

*Optional — send alerts to Asana, creating a task in a chosen project for every match.*

> **Five Type-dropdown options.** The Type dropdown in the External integrations editor offers: Custom MCP, Custom webhook (HTTPS POST), Microsoft Teams, and two Asana entries. The "Custom *X*" labels signal user-provided endpoints; the rest are named-vendor presets. Slack was removed as a named MCP type because Slack does not host an MCP server; Slack users now pick **Custom webhook** with their incoming-webhook URL. Microsoft 365 was renamed to Microsoft Teams since Teams chat is the actual alert surface. The two Asana entries are:
>
> - **Asana (REST API — easier)** — `asana-rest`. Posts directly to Asana's REST API at `https://app.asana.com/api/1.0/tasks`. Works with a Personal Access Token (PAT) — no OAuth flow needed. This is the **recommended** path and what these instructions test by default. Endpoint auto-fills on Load defaults.
> - **Asana (MCP V2 — requires OAuth)** — `asana`. Posts JSON-RPC tools/call to `https://mcp.asana.com/v2/mcp`. PATs are rejected by V2 with `Invalid token signature - token was not issued by Asana OAuth`; you need an OAuth-issued access token from a registered Asana MCP client app. Most users should pick the REST path above.
>
> The Authorization header value field accepts the **full header value** for both — paste literally `Bearer <token>` (capital B, single space, then the token). The dispatcher does not auto-prepend `Bearer `; it sends whatever you typed.
>
> Asana V1 SSE at `https://mcp.asana.com/v1/sse` (which used to be the easy-PAT path) was shut down 2026-05-11; it is no longer available as a Type dropdown option and steps below have been migrated to the two surviving choices.

### 13a · Get your Asana credentials

- [ ] [Optional] Sign in to Asana at https://app.asana.com (the free tier is fine).
- [ ] [Optional] Pick or create a project where the test tasks should land. Open the project and copy its **project GID** from the browser URL — it's the long number between `/0/` and the next `/`. Example: in `https://app.asana.com/0/1209876543210000/list`, the GID is `1209876543210000`. Save it.
- [ ] [Optional] Open the Asana developer console at https://app.asana.com/0/my-apps. Under **Personal access tokens**, click **Create new token**, name it "emAIl Sentinel E2E", agree to the API terms, and **copy the token immediately** — Asana only shows it once.

### 13b · Configure the MCP server in emAIl Sentinel (REST API path — recommended)

- [ ] [Optional] In the add-on, open Settings → **External integrations** → **+ Add external integration**.
- [ ] [Optional] **Server name:** `E2E Asana`
- [ ] [Optional] **Type:** pick **Asana (REST API — easier)** from the dropdown, then click **Load defaults**. The Endpoint URL auto-fills to `https://app.asana.com/api/1.0/tasks`, the **Tool name field is hidden entirely** (asana-rest is a direct-post type that doesn't use it), and the **Request body (JSON)** field pre-fills with the Asana REST task body.
- [ ] [Optional] **Endpoint URL:** leave the auto-filled `https://app.asana.com/api/1.0/tasks`. Do not switch to the V1 SSE or V2 MCP endpoints — those are different paths.
- [ ] [Optional] **Authorization header value:** paste `Bearer ` followed by the PAT from step 13a, with no quotes. The full field should read like `Bearer 1/123456789abcdef…` (legacy PAT format) or `Bearer 2/<workspace>/<user>:<hash>` (current format). The capital B and the single space between `Bearer` and the token are required — the dispatcher sends this string verbatim as the `Authorization` header. Without the `Bearer ` prefix, Asana rejects with HTTP 401.
- [ ] [Optional] **Request body (JSON):** the Load-defaults click pre-fills this as `{"data":{"projects":["PROJECT_ID"],"name":"[emAIl Sentinel] {{subject}}","notes":"{{message}}"}}`. Replace the literal text `PROJECT_ID` with your actual project GID from step 13a. Leave `{{subject}}` and `{{message}}` placeholders intact.
- [ ] [Optional] Click **Save**. "E2E Asana" appears in the External integrations list.

### 13b-alt · Configure the MCP server (MCP V2 path — only if you have an OAuth-issued token)

*Skip this entire subsection unless you have an OAuth-issued access token from a registered Asana MCP client app. Personal Access Tokens are rejected by the V2 gateway.*

- [ ] [Optional] **Type:** pick **Asana (MCP V2 — requires OAuth)**. The Endpoint URL auto-fills to `https://mcp.asana.com/v2/mcp`. The Tool name auto-fills to `asana_create_task`.
- [ ] [Optional] **Authorization header value:** paste `Bearer ` followed by your OAuth-issued access token (typically starts with `ya29.` or similar — not the `1/` or `2/` PAT format). Same `Bearer ` prefix rule applies.
- [ ] [Optional] **Tool args template:** the Load-defaults click pre-fills this as `{"project_id":"PROJECT_ID","name":"[emAIl Sentinel] {{subject}}","notes":"{{message}}"}` — the V2 schema is flatter than REST. Replace `PROJECT_ID` with your project GID.
- [ ] [Optional] Save. The remainder of Section 13 (13c onward) works with either path.

### 13c · Wire it onto the test rule and fire an alert

- [ ] [Optional] Open Rules → edit `Test rule — E2E`. Under **External integrations**, tick `E2E Asana` → **Save**. Toast: "Rule saved.".
- [ ] [Optional] Send a test email to yourself with subject exactly `SENTINEL_TEST MCP` (any body).
- [ ] [Optional] Wait ~30 sec for delivery, then open the email in Gmail and click **Evaluate this email** in the add-on panel.
- [ ] [Optional] Evaluation result card shows "✅ Match — alerts sent" for the rule.
- [ ] [Optional] Open the Activity log. Newest entries include:
  - `MATCH! …`
  - `MCP alert sent to: E2E Asana`
- [ ] [Optional] Open Asana, navigate to the project from step 13a. A new task titled **"[emAIl Sentinel] SENTINEL_TEST MCP"** exists, with the alert message body in the task description/notes.

### 13d · Error paths

*The dispatcher must surface three error tiers from the MCP layer: HTTP non-2xx, JSON-RPC envelope errors, and tool-level errors (the last one was previously swallowed for SSE responses).*

- [ ] [Optional] **HTTP error.** Edit the `E2E Asana` MCP server in Settings. Change Endpoint to an invalid HTTPS URL (e.g. `https://invalid-asana-mcp.example.com/v2/mcp`) → **Save**. Send another email with subject `SENTINEL_TEST MCP fail`, open it, and click **Evaluate this email**. Activity log shows: `MCP alert to "E2E Asana" FAILED: MCP "E2E Asana" HTTP <code>: …`.
- [ ] [Optional] **Tool-level error (SSE response, real Asana endpoint).** Restore Endpoint to `https://mcp.asana.com/v2/mcp`. In the Tool args template, replace the project_id with a deliberately bogus GID (e.g. `999999999999999`). Save. Send `SENTINEL_TEST MCP tool-error`, open it, and Evaluate. Activity log shows: `MCP alert to "E2E Asana" FAILED: MCP "E2E Asana" tool error: …` — the detail text comes from Asana's MCP response and typically reads "Project not found" or similar. (Pre-fix versions silently logged `MCP alert sent to: E2E Asana` with no Asana task created — this regression test guards against that.)
- [ ] [Optional] **Auth error.** With endpoint restored and project_id correct, edit the server and replace the Authorization header with `Bearer bogus_token`. Save and re-fire. The error surfaces either as an HTTP 401 line or a tool-level "Forbidden" / "Unauthorized" line, depending on whether Asana rejects at the transport or tool layer.
- [ ] [Optional] Restore the server to a working configuration (real endpoint, valid `Bearer <PAT>`, real project_id) before continuing.

### 13e · Cleanup (optional)

- [ ] [Optional] Once verified, delete the `E2E Asana` MCP server from Settings (or untick it on the rule) so future test runs don't keep creating Asana tasks.
- [ ] [Optional] If you no longer need it, revoke the PAT at https://app.asana.com/0/my-apps for hygiene.

### 13f · MCP dispatcher self-test (server-side, no UI)

*Exercises every code-path branch in `McpServers.gs sendMcpAlert_` against the deliberately-misbehaving Cloudflare Worker loopback in `testing/mcp-loopback/`. Hermetic — constructs synthetic rule + email + server objects in memory, never touches saved rules / settings. Logs structured per-mode PASS / FAIL plus an aggregate summary to the activity log.*

**Prerequisite:** Cloudflare Worker loopback must be deployed (one-time, see `testing/mcp-loopback/README.md`). The `MCP_LOOPBACK_BASE_URL_` constant in `Diagnostics.gs` must point at the deployed worker URL.

- [ ] In the Apps Script editor (script.google.com), open `Diagnostics.gs`.
- [ ] In the function dropdown above the editor, pick **`runMcpLoopbackTests`**. Click **Run**. (First run prompts for OAuth consent — approve.)
- [ ] Wait ~5–10 seconds for the function to complete (one HTTPS round-trip per mode × 9 modes). The execution log at the bottom of the editor shows the function returning `{passed: 9, total: 9, allPassed: true, results: [...]}`.
- [ ] In the add-on, open **Activity log**. The newest entries should include:
  - `=== MCP loopback self-test ===` header line
  - One `[PASS]` line per mode: `[PASS] success — expected sent — actual sent`, `[PASS] sse — …`, etc. through all 9 modes.
  - Final summary: `MCP loopback self-test: 9/9 passed`.
- [ ] **Failure interpretation.** A `[FAIL]` line names the mode and shows expected vs. actual. Common failure causes:
  - Worker URL changed but `MCP_LOOPBACK_BASE_URL_` not updated → all 9 modes fail with HTTP / DNS error in `actual`.
  - SSE-related fail (`sse` or `isErrorSse`) → bug in the `text/event-stream` parser in `sendMcpAlert_`.
  - `isError` or `isErrorSse` log "sent" instead of "failed" → the `body.result.isError === true` check regressed (this was the original silent-success bug).
  - `jsonrpcError` logs "sent" → the `body.error` envelope check regressed.
  - `http401` / `http500` log "sent" → the HTTP non-2xx tier regressed.
  - `empty` / `malformedJson` log "failed" → the swallow-on-non-JSON path regressed in the wrong direction.
- [ ] **Optional — automate via scheduled remote agent.** The Asana V1 cutoff routine `trig_012bSXvsU2uyusQb2sSQS9Qf` was set up similarly. To run `runMcpLoopbackTests` on a recurring schedule (e.g. weekly), create a routine that uses the Apps Script API `scripts.run` method against this project, with the function name `runMcpLoopbackTests`, and posts a GitHub issue if `result.allPassed === false`.

---

## 14 · Help Card Navigation

*Verify the Ask-AI section, search, and all five help topics load and contain accurate content.*

- [ ] Click Help from the home card nav or the universal "⋮" menu.
- [ ] Help card header reads: "emAIl Sentinel Lite Help".
- [ ] **Ask emAIl Sentinel** section appears at the top: a grey "Ask a question in plain English — answered by your Gemini." hint, a "Your question" input (hint: "e.g. How do I send alerts to Google Chat?"), and a filled purple **Ask** button. Type a question and click Ask — an answer paragraph renders below the button.
- [ ] **Search help** section appears next with a "Search all topics" input (hint mentions "evaluate", "SMS", "Gemini pricing") and a filled purple **Search** button.
- [ ] Type `privacy` in the search box and click **Search**. A results card opens with header `Search: "privacy"`, a grey "N topic(s) matched." line, and matching topics listed with snippets that have "privacy" bolded. Click an **Open: …** button — the full topic loads.
- [ ] Tap back, then type `SMS` in the search box and click **Search**. Results card lists multiple topics matching, each with a snippet around the first occurrence.
- [ ] Tap back, then click **Search** with the box empty. Toast: "Enter a search term first." (no results card pushed).
- [ ] Tap back, then type `xyzzy123nonexistent` and click **Search**. Results card shows: "No matches in any help topic. Try a different keyword."
- [ ] Tap back to the Help card. Five topic buttons present under **Browse topics**: "Quick start & writing rules", "Rule examples by channel", "Alert channel setup", "Gemini pricing & models", "Settings & troubleshooting".
- [ ] Tap "Quick start & writing rules" — content loads with step-by-step setup instructions ending in the contextual flow (open an email, click **Evaluate this email**), the Starter rules shortcut (5 pre-built rules, created disabled), and the "Alert message content" field reference.
- [ ] Tap back, then "Rule examples by channel" — content shows SMS, Chat, Calendar, Sheets, Tasks, and External integrations examples (Custom MCP / Asana / Microsoft Teams).
- [ ] Tap back, then "Alert channel setup" — content covers SMS (including named recipients managed via add/edit/delete cards), Google Chat webhook setup, Calendar/Sheets/Tasks defaults, and MCP server configuration.
- [ ] Tap back, then "Gemini pricing & models" — model list (gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro, gemini-2.0-flash-001), free-tier limits, and pay-as-you-go rates shown.
- [ ] Tap back, then "Settings & troubleshooting" — content includes the privacy posture (emAIl Sentinel Lite reads only the email you have open, only when you click **Evaluate this email** — it cannot search, scan, or read any other mail; whole-mailbox monitoring is emAIl Sentinel Pro, self-hosted) and troubleshooting. It contains **no** Business hours / Scan schedule / Max email age / Reset baseline references. The "Still stuck?" section lists **two** support paths: a **Community discussions** link (`https://github.com/StephenRJohns/email_sentinel/discussions`) for usage questions and rule recipes, and an **Open a GitHub issue** link (`https://github.com/StephenRJohns/email_sentinel/issues`) for bugs and feature requests.
- [ ] The topic shows the **Contact** block with a three-email routing table:
  - Support: `support@jjjjjenterprises.com`
  - Legal / privacy: `legal@jjjjjenterprises.com`
  - Billing: `billing@jjjjjenterprises.com`
- [ ] Below the Contact block, a grey trademark-attribution paragraph names Google, Microsoft, and Asana as trademark owners and states the project is not affiliated with or endorsed by any of these companies. Slack is intentionally absent — it was removed as a named MCP type because Slack does not host an MCP server (Slack users now go via Custom webhook with their incoming-webhook URL).
- [ ] Bottom of the Help card shows the JJJJJ Enterprises logo and the grey line "emAIl Sentinel™ is a product of JJJJJ Enterprises, LLC."

---

## 15 · Contextual-Only Posture (no triggers, no scanning UI)

*Verify the add-on's privacy story holds end-to-end: it reads only the email you have open, only when you click **Evaluate this email** — never scans your mailbox in the background.*

- [ ] **No time-driven triggers.** In the Apps Script editor, open Triggers (left-rail clock icon). The Triggers table is empty — no `runMailCheck` or any other time-based trigger exists, and nothing in the UI can install one.
- [ ] **No scanning controls on the home card.** The home card has no "Start scheduled scans" / "Stop scheduled scans" buttons, no "Scan email every" dropdown, no "Scan email now" button, and no "Scanning" status row.
- [ ] **No scanning settings.** Settings has no Scan schedule, Business hours, Max email age, or Reset baseline (re-verifies the Section 2 assertion after all other sections have exercised the card).
- [ ] **Kebab menu contents.** The "⋮" menu contains exactly: Home, Rules, Settings, Activity Log, Help, Community discussions. There is no "Scan email now" entry.
- [ ] **Single Gmail scope.** In the OAuth consent (or myaccount.google.com → Security → Third-party access → the add-on), the only Gmail permission is the current-message one ("View your email messages when the add-on is running" — `gmail.addons.current.message.readonly`). The add-on does NOT request full mailbox read (`gmail.readonly`).
- [ ] **Evaluation requires an open message.** From the home card (no email open, e.g. from the inbox list view), there is no way to trigger an evaluation — the Evaluate button only exists on the contextual card that renders when a message is open.

---

## 16 · Confirmation Dialogs on Destructive Actions

*Every destructive action must show a confirm card with Cancel before executing.*

- [ ] Clear Activity Log: In Activity log, click "Clear". A confirmation card appears: "Clear the entire activity log? This cannot be undone."
- [ ] Click "Cancel". Log is NOT cleared; returned to activity log with entries intact.
- [ ] Click "Clear" again. On the confirmation card the **Clear** button is filled red with white text (matches Delete-button styling). Click "Clear". Toast: "Log cleared." Activity log shows "No activity yet."
- [ ] Delete Rule: In Rules, click "Delete" on "Test rule — E2E". Confirmation card shows the rule name and "This cannot be undone."
- [ ] Click "Cancel". Rule is NOT deleted; returned to Rules list with the rule still present.
- [ ] Click "Delete" again on the rule, then "Delete" on the confirmation card. Toast: "Rule deleted."
- [ ] Delete All Rules: In Rules (with at least one rule present), a red "Delete all rules" button sits beside "+ New rule". Click it. Confirmation card reads "Delete **all N rules**? This cannot be undone." with a red **Delete all** button and Cancel.
- [ ] Click "Cancel" — rules intact. Click through again and confirm — toast: "All rules deleted." (Re-create starter rules afterwards if later sections need them.)

---

## 17 · Unsaved-Changes Notice on Editor Cards

*CardService gives no event for the system back arrow, so an editor cannot prompt to save unsaved changes. Verify each editor card shows the amber "click Save before tapping the back arrow" notice as its first section.*

- [ ] **Rule editor.** Rules → "+ New rule". Top section is an amber notice reading roughly: "⚠ Click Save below before tapping the back arrow — the back arrow discards unsaved changes without warning." Same notice appears when editing an existing rule.
- [ ] **Settings card.** Open Settings. Same amber notice is the first section above the Gemini key block.
- [ ] **MCP server editor.** Settings → **External integrations** → "+ Add external integration". Same amber notice appears at the top. Repeat with an existing server via Edit.
- [ ] **SMS recipient editor.** Settings → SMS recipients → "Add recipient". Amber notice at the top. Repeat with Edit on an existing recipient.
- [ ] **Chat space editor.** Settings → Google alert channels → "Add Chat space". Amber notice at the top. Repeat with Edit on an existing space.
- [ ] **Behavior on back arrow (negative test).** In the rule editor for "Test rule — E2E", change the rule name to `Test rule — E2E (modified)` but do NOT click Save. Tap the system back arrow at the top-left of the card. Verify (a) no confirmation dialog appears, (b) the rule list shows the original name unchanged. (This is the documented limitation the notice exists to mitigate.)

---

## 18 · Kebab "Home" Item (escape hatch on every card)

*Root cards do not carry an in-card Home button. The kebab "⋮" menu's first universal action — **Home** → `actionShowHome` — is the sole escape hatch back to the home card from any state, including the no-back-arrow states (kebab-replaced nav, popToRoot after delete/clear, updateCard refreshes). Removing the in-card duplicate avoids cluttering the top of every root card; the kebab entry covers all the same paths.*

- [ ] **Via home-card buttons (stacked nav, back arrow visible).** From the home card, click each sub-card button in turn — Settings, Rules, Activity log, Help. Gmail's native back arrow (←) is visible at the top-left of each card. No in-card "Home" button is rendered. Open the "⋮" menu and pick **Home** — returns to the home card. The native back arrow also works as a one-step return. (The **Community** button is an exception — it opens an external GitHub Discussions page in a new browser tab rather than pushing a sub-card, so no back arrow or Home navigation is involved.)
- [ ] **Via kebab menu (replaced nav, no back arrow).** Click the "⋮" menu in the add-on header, then in turn pick Rules, Settings, Activity Log, Help. The Gmail back arrow at the top-left of the card is **NOT** shown — the stack was replaced rather than pushed. Re-open the "⋮" menu and pick **Home**; the home card replaces the current card. (This is the no-back-arrow case the Home item exists for.) Note: the kebab menu's remaining entry, **Community discussions**, opens an external URL and is covered in Section 21.
- [ ] **After delete-rule (popToRoot path).** Open Rules (via either entry), click Delete on any rule, confirm. The Rules card re-renders without a back arrow (popToRoot replaced the stack). Open the "⋮" menu and pick **Home** — returns to the home card.
- [ ] **After clear-activity-log (popToRoot path).** Open Activity log, click Clear, confirm. The card re-renders without a back arrow. Open the "⋮" menu and pick **Home** — returns to the home card.
- [ ] **After updateCard refreshes (rule toggle / settings save / log refresh).** On any root card, trigger an in-place update: tap a rule's On/Off toggle on the Rules card; click Save on Settings; click Refresh on Activity log. The kebab "⋮" menu still shows **Home** as its first item across the re-render, and clicking it returns to the home card. (This is the case that motivated keeping a single always-available Home entry — conditional rendering on a per-card basis would have been unreliable here because the navigation stack doesn't change on updateCard.)
- [ ] **Starter rules card.** Open Starter rules from the home card: Gmail's native back arrow is rendered (push, not replace) and no in-card Home button is present. The kebab "⋮" menu's **Home** item also returns to the home card from this state.
- [ ] **Evaluation result card.** After an evaluation (Section 6), the result card is pushed from the contextual card, so the back arrow is available; the kebab **Home** item also works from there.
- [ ] **No in-card Home button anywhere.** Spot-check Rules, Settings, Activity Log, Help, and Starter rules — none of them render a "Home" button as their first (or any) section. The single source of truth for "go home" is the kebab menu.

---

## 19 · "None Configured" Channel Warning & ⚠️ Malformed Count

*An ON rule with no alert channels will fire on matches but produce nothing useful. The Channels row in the Rules list flags this misconfiguration in bold dark red, and the rule counts as ⚠️ malformed in the home-card Rules row; OFF rules in the same state stay plain (they aren't acting on anything).*

*If "Test rule — E2E" was deleted in Section 16, recreate it here before running the warning-color checks.*

- [ ] Open the kebab "⋮" menu and pick **Rules**. Click **+ New rule**.
- [ ] Fill in the editor:
  - **Rule name:** `Test rule — E2E`
  - **Rule text:** `Any email with SENTINEL_TEST anywhere in the subject line.`
  - **Alert channels:** leave **all channels unchecked** (no SMS, External integrations, Chat, Calendar, Sheets, Tasks, Docs).
- [ ] Click **Save**. The Rules list shows "Test rule — E2E" as ✅ ON.
- [ ] Locate the "Test rule — E2E" summary section in the Rules list. The **Channels** row reads "None configured" in **bold** with **dark red** color (~`#b00020`).
- [ ] Navigate Home. The Rules status row and Rules nav button count this rule as **⚠️** (malformed: enabled with nowhere to send alerts), not ✅.
- [ ] Click the "Off" toggle on the same rule (status flips to ⏸ OFF; the toggle button now reads "On"). The Channels row now reads "None configured" in **plain** styling (no bold, no red). On the home card the rule now counts as ⚪ (inactive).
- [ ] Click "On" to re-enable the rule (status flips back to ✅ ON; the toggle button now reads "Off"). Tick at least one channel in the editor and Save. The Channels row now lists the configured channel(s), and the home-card count moves to ✅.

---

## 20 · Action Color Conventions on Buttons

*Destructive actions are color-coded so the user gets a visual warning before clicking. Codified in `Cards.gs` as `BRAND_RED_` (`#c62828`) for delete buttons and `BRAND_PURPLE_` (`#581c87`) for primary CTAs.*

- [ ] **Delete buttons are red with white text.** Verify on every Delete button across the UI:
  - Rules list — each rule's Delete button **and** the "Delete all rules" button beside "+ New rule".
  - Rule delete confirmation cards (single rule + delete-all confirmations) — the Delete (confirm) button.
  - MCP server editor (Settings → Add/Edit external integration) — the Delete button on the editor.
  - MCP server delete confirmation — the Delete (confirm) button.
  - SMS recipient editor (Settings → Add/Edit recipient) — the Delete button on the editor.
  - SMS recipient delete confirmation — the Delete (confirm) button.
  - Chat space editor (Settings → Add/Edit chat space) — the Delete button on the editor.
  - Chat space delete confirmation — the Delete (confirm) button.
  All render as filled red buttons with white text.
- [ ] **Toggle button reads "Off" / "On" in plain text.** Open Rules with at least one ON (✅) rule. The toggle button on that rule reads "Off" (the action — click to turn off) in plain text. Click it; the rule flips to OFF (⏸) and the toggle now reads "On". Both states are plain text in identical style; the rule's current state is visible from the section header (✅ ON / ⏸ OFF). Short labels chosen because CardService scales row widths down at higher card-section counts and longer labels (Disable/Enable) wrapped the Delete button onto a second row at 5+ rules.
- [ ] **Primary CTAs are filled brand purple.** "Evaluate this email" (contextual card), "Save" / "Save settings", "Generate", "+ New rule", "Create starter rules", "Ask", "Search", and "Redeem code" all render filled brand purple with white text. "Edit" stays plain text. No other buttons should have shifted color.

---

## 21 · Community Discussions Entry Points

*GitHub Discussions (`https://github.com/StephenRJohns/email_sentinel/discussions`) is exposed in three places inside the add-on. All three open the same URL in a new browser tab; none push a card.*

- [ ] **Kebab menu item.** Open the "⋮" menu — verify a **Community discussions** entry sits last, after **Help**. Click it; a new browser tab opens to the GitHub Discussions page. The add-on side panel stays on whatever card it was on (no card render, no navigation change inside the panel).
- [ ] **Home card button.** On the home card's nav row, a **Community** button sits at the end of the row after **Help**. Click it; new browser tab opens to the same Discussions URL.
- [ ] **Help card link.** Open Help → **Settings & troubleshooting**. Scroll to the "Still stuck?" subsection. Two distinct links present: **Community discussions** (Discussions URL) and **Open a GitHub issue** (Issues URL). Click each in turn — both open in new tabs.
- [ ] **Discussions page is real.** On any of the three entry points, verify the destination page renders the GitHub Discussions UI for `StephenRJohns/email_sentinel` with categories visible (Announcements, General, Ideas, Q&A, Show and tell, Polls). Discussions is enabled on the repo via `gh repo edit --enable-discussions`.

---

## 22 · Lite Plan & Pro Upsell (all features free)

*This add-on is the free **Lite** edition — fully featured, no caps. Both license tiers in `LicenseManager.gs` are identical (unlimited rules; Chat, External integrations, and AI assistance all enabled); the tier flag only controls the promo-redemption section's visibility. "Pro" as sold is the separate self-hosted product the Upgrade buttons link to.*

- [ ] Home card Plan row shows "Lite".
- [ ] **Pro upsell.** The "Want 24/7 automatic monitoring?" paragraph and plain-text **Upgrade to Pro** button are visible on the home card; the button opens the external upgrade page (`jjjjjenterprises.com/emailsentinel/pro`) in a new tab.
- [ ] **No feature gating.** Open the rule editor: the Google Chat and External integrations channel sections render their selection widgets (or the "configure in Settings" prompts) with no "upgrade to Pro to use this channel" text. The "Help me write the rule text" and "Help me write the alert text" AI buttons are present with no upgrade prompt, and clicking each produces a Gemini suggestion card with **Use this** / **Try again** buttons.
- [ ] **Unlimited rules.** With 5+ rules already present, "+ New rule" still opens the editor and a new rule saves successfully — no rule-limit toast.
- [ ] **No founding-member offer.** The home card shows no "Founding-member lifetime" scarcity paragraph (the lifetime add-on offer was retired; `foundingMembersRemaining()` returns 0).
- [ ] **No promo redemption UI.** The home card shows NO "Enter a promo code to upgrade to Pro" section, regardless of tier or the `PROMO_SERVICE_URL` Script Property — the section was removed when the last in-app feature gate (AI rule writing) went free. Automated check: the promo-section spec in `testing/playwright/tests/e2e.spec.js` asserts the input and Redeem button are absent. (The redemption back-end still exists and is exercised hermetically by Section 23.)
- [ ] **Tier flip helpers (pre-launch testing).** `setTierPro` / `setTierFree` in `LicenseManager.gs` still run from the Apps Script editor's function dropdown, but feature behavior is identical on both tiers — after either helper + a Gmail tab reload (F5), nothing user-visible changes.

---

## 23 · Promo Redemption Service Self-Test (server-side, no UI)

*Exercises every code-path branch in `scripts/PromoCodeService.gs` (`doPost` auth + parse, `redeemCode_` data-layer state machine, and the `normalizeCode_` helper) against a temporary scratch sheet that the test creates and deletes itself. Hermetic — production `Codes` rows are never touched. Logs structured per-test PASS / FAIL plus an aggregate summary, and returns a structured result object so scheduled remote agents can read pass count programmatically.*

**Prerequisite:** the standalone admin/service Apps Script project must already have `PROMO_SHEET_ID` and `SERVICE_TOKEN` set in Script Properties (i.e. `configureAdmin` and `configureService` have already been run once). The standalone project must also contain `PromoCodeServiceTests.gs` alongside `PromoCodeService.gs` and `PromoCodeAdmin.gs`.

- [ ] Open the **standalone admin/service Apps Script project** at script.google.com — NOT the add-on project. (The add-on only ever reads `PROMO_SERVICE_URL` from its own Script Properties; the redemption service and tests live in the developer's private project.)
- [ ] Open `PromoCodeServiceTests.gs`. In the function dropdown above the editor, pick **`runPromoServiceTests`**. Click **Run**. (First run prompts for OAuth consent on the Spreadsheets scope — approve.)
- [ ] Wait ~10–20 seconds for the function to complete (one Sheet round-trip per assertion). The Executions panel shows the function returning `{passed: 19, total: 19, allPassed: true, results: [...]}`.
- [ ] In the same editor, open **View → Logs**. The output should contain:
  - `=== Promo service self-test ===` header line.
  - One `[PASS]` line per assertion across three layers: 8 `redeemCode_` data-layer branches, 7 `doPost` auth/parse branches, 4 `normalizeCode_` pure-logic branches.
  - Final summary: `Promo service self-test: 19/19 passed`.
- [ ] Open the spreadsheet referenced by `PROMO_SHEET_ID` and confirm the `_PromoTest_` worksheet is no longer present (the test creates it at start and deletes it in `finally`). If a tab named `_PromoTest_` is still present, a previous run crashed mid-flight; delete it manually before re-running, or re-run the test (it auto-cleans orphan tabs at the start of every run).
- [ ] **Failure interpretation.** A `[FAIL]` line names the assertion and shows the offending JSON-RPC reply or row contents. Common failure causes:
  - `valid first redemption` fails with `"Service busy"` → another script execution holds `LockService.getScriptLock()`. Wait 30 s and re-run.
  - `redemption persists status, email, and timestamp` fails → the `setValue(...)` calls in `redeemCode_` regressed (column index drift, wrong sheet object, or a missing implicit flush before the read-back).
  - `second redemption of same code is blocked` fails (returns `ok=true`) → the `if (status === 'redeemed') return jsonError_(...)` guard regressed; this is the **single-use-code guarantee** the whole feature exists to enforce. Treat as a P0 bug.
  - `voided code is rejected` fails → the `voided` status branch regressed.
  - `unknown status is rejected` fails → the explicit `status !== 'unused'` guard regressed; without it, future status values added to the schema would default to allowing redemption.
  - Any of the three `doPost ... Unauthorized` lines fail → the token comparison in `doPost` regressed and the Web App is now redeemable without a valid token. **Treat this as a security incident** and rotate `SERVICE_TOKEN` immediately after fixing.
  - `doPost all-junk code strips to empty …` fails → `normalizeCode_` either does not strip aggressively enough (allowing punctuation injection) or strips too aggressively (breaking valid `SENT-XXXX-XXXX` codes); cross-check against the `normalizeCode_ preserves hyphens` line.
- [ ] **Optional — automate via scheduled remote agent.** Same playbook as Section 13f: create a routine that uses the Apps Script API `scripts.run` method against the standalone admin/service project, with the function name `runPromoServiceTests`, and posts a GitHub issue if `result.allPassed === false`. Recommended cadence: weekly. Do not exceed daily — each run holds the script-wide lock for ~10–20 seconds, blocking any real buyer redemption attempts that land in that window.

---

## 24 · Sign-Off & Cleanup

*Confirm all required flows passed and restore the add-on to production configuration.*

- [ ] All items in Sections 1–8 and 14–22 are checked (no skipped required items).
- [ ] Any optional sections attempted (9–13, 23): all checked items passed.
- [ ] Starter rules reviewed — edit and enable any you want active (remember: Lite is on-demand only; enabled rules fire when you click **Evaluate this email** on an open message).
- [ ] Test rules ("Test rule — E2E" and any others created during the run) deleted or disabled.
- [ ] Test alert channels (E2E Phone recipient, E2E Chat space, E2E Asana integration) removed if no longer wanted.

Tester name: ________________________________  Date: ______________

Known issues / notes:
