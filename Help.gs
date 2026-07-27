// Copyright (c) 2026 JJJJJ Enterprises, LLC. All rights reserved.
// Proprietary — see LICENSE for terms.

/**
 * Help.gs — in-add-on help assistant. Answers questions about emAIl Sentinel
 * using the user's own Gemini key (callGemini_), grounded in the knowledge
 * corpus below so answers stay accurate to this product (the free Lite add-on).
 */

const HELP_SYSTEM_ =
  'You are the in-app help assistant for emAIl Sentinel Lite, a free Gmail add-on. ' +
  'Answer the user\'s question using ONLY the reference below. Be concise and specific to ' +
  'this product. If the answer is not in the reference, say so plainly and suggest contacting ' +
  'support@jjjjjenterprises.com rather than guessing. Do not invent features, settings, or pricing.';

const ES_HELP_KNOWLEDGE = [
  '# emAIl Sentinel Lite (Gmail add-on) — reference',
  '',
  '## What it is',
  'emAIl Sentinel checks the email you have open against rules you wrote in plain English.',
  'An AI (your Gemini) evaluates the open message against your rules; on a match it writes a',
  'short alert and sends it to the channels you chose.',
  '',
  'This is the free **Lite** edition. It is on-demand only: it can read ONLY the email you',
  'currently have open, and only when you click "Evaluate this email" in the add-on panel.',
  'It never scans your mailbox in the background — by design, for privacy. For continuous,',
  'real-time whole-mailbox monitoring there is a paid **Pro** edition (a self-hosted service',
  'that runs 24/7 across Gmail and Outlook) — the "Upgrade to Pro" button opens its page.',
  '',
  '## How evaluation works (Lite)',
  '- Open any email in Gmail, open the emAIl Sentinel panel, click "Evaluate this email".',
  '- Every enabled rule is checked against that one message; matches alert your channels.',
  '- From the inbox list view (no email open) the add-on shows the home card instead.',
  '',
  '## Setup',
  '1. Settings -> add your **Gemini API key** (and pick a Gemini model). The add-on uses your own',
  '   Gemini; AI usage is billed to your Google AI account.',
  '2. Optionally configure SMS, Google Chat, and external integrations (MCP servers / webhooks).',
  '3. Rules -> add a rule (or create starter rules).',
  '',
  '## Rules',
  'Plain-English criteria, e.g. "Any email from a customer who wants to cancel." Each rule has a',
  'name, the criteria, an optional alert-message format, and the channels to alert.',
  '"Help me write the rule text" drafts a rule via Gemini.',
  'You can edit, enable/disable, or delete rules anytime.',
  '',
  '## Alert channels',
  'SMS (Twilio, Telnyx, Plivo, ClickSend, Vonage, Textbelt), Google Chat, Google Calendar,',
  'Google Sheets, Google Tasks, Google Docs, and external integrations (MCP servers + custom',
  'HTTPS webhooks). There is **no email alert channel — by design**, so an alert never gets',
  'buried in the inbox you are watching.',
  '',
  '## Lite vs Pro',
  'Lite (this add-on): free, full features, evaluates the open email on demand only. Pro: a',
  'self-hosted service that runs 24/7 with real-time push across Gmail and Outlook, $15/month or',
  '$150/year. Same rules and channels — the difference is automation.',
  '',
  '## Troubleshooting',
  '- No alerts: confirm your Gemini API key is set in Settings; check the rule is enabled; make',
  '  sure the rule has at least one alert channel ticked.',
  '- No "Evaluate this email" button: open a specific email first — the button only appears when',
  '  a message is open.',
  '- Not automatic: Lite only evaluates when you click Evaluate. For automatic monitoring, that is Pro.',
  '- Use the Activity log to see what each evaluation did.',
].join('\n');

/**
 * Answer a help question via the user's Gemini key. Returns
 * { ok: true, text } or { ok: false, error }.
 */
function askHelpAI_(question) {
  const s = loadSettings();
  if (!s.geminiApiKey) {
    return { ok: false, error: 'Add your Gemini API key in Settings first.' };
  }
  const prompt = HELP_SYSTEM_ +
    '\n\n=== emAIl Sentinel reference ===\n' + ES_HELP_KNOWLEDGE +
    '\n=== end reference ===\n\nUser question: ' + String(question || '').trim() + '\n\nAnswer:';
  const text = callGemini_(s.geminiApiKey, s.geminiModel, prompt, 800);
  if (text === null) {
    return { ok: false, error: "Couldn't get an answer — check your Gemini key and quota." };
  }
  return { ok: true, text: text };
}

/**
 * Action handler for the "Ask" button on the Help card. Reads the question,
 * asks Gemini, and re-renders the Help card with the answer.
 */
function handleHelpAsk(e) {
  var q = '';
  if (e && e.formInput && e.formInput.helpAskQuestion) {
    q = e.formInput.helpAskQuestion;
  } else if (e && e.commonEventObject && e.commonEventObject.formInputs &&
             e.commonEventObject.formInputs.helpAskQuestion) {
    var fi = e.commonEventObject.formInputs.helpAskQuestion;
    q = (fi.stringInputs && fi.stringInputs.value && fi.stringInputs.value[0]) || '';
  }
  q = String(q).trim();
  if (!q) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Type a question first.'))
      .build();
  }
  var res = askHelpAI_(q);
  var answer = res.ok ? res.text : ('⚠ ' + res.error);
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(buildHelpCard(answer, q)))
    .build();
}

/** Escape an AI answer for a CardService TextParagraph (limited HTML subset). */
function formatHelpAnswer_(text) {
  var escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\n/g, '<br>');
}
