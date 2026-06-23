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
  'emAIl Sentinel watches your Gmail and alerts you when a message matches a rule you wrote in',
  'plain English. An AI (your Gemini) evaluates each new message against your rules; on a match',
  'it writes a short alert and sends it to the channels you chose.',
  '',
  'This is the free **Lite** edition. The Google add-on platform only lets it scan on a schedule',
  '(time-based triggers fire at most once an hour) plus on demand — it is not real-time. For',
  'continuous, real-time monitoring there is a paid **Pro** edition (a self-hosted service that',
  'runs 24/7 across Gmail and Outlook) — the "Upgrade to Pro" button opens its page.',
  '',
  '## How scanning works (Lite)',
  '- Turn on scheduled scans from the home card and pick an interval (1 hour is the fastest the',
  '  Google platform allows). Use "Scan email now" for an immediate check at any time.',
  '- The first scan baselines existing mail (no alerts for your back-catalog); only mail arriving',
  '  afterward is evaluated. Messages are de-duplicated, so no repeat alerts.',
  '- Optional business hours: off-hours mail is caught up on the next in-hours scan.',
  '',
  '## Setup',
  '1. Settings -> add your **Gemini API key** (and pick a Gemini model). The add-on uses your own',
  '   Gemini; AI usage is billed to your Google AI account.',
  '2. Optionally configure SMS, Google Chat, and external integrations (MCP servers / webhooks).',
  '3. Rules -> add a rule (or create starter rules).',
  '',
  '## Rules',
  'Plain-English criteria, e.g. "Any email from a customer who wants to cancel." Each rule has a',
  'name, the criteria, an optional alert-message format, the Gmail labels to watch (default:',
  'Inbox), and the channels to alert. "Help me write the rule text" drafts a rule via Gemini.',
  'You can edit, enable/disable, or delete rules anytime.',
  '',
  '## Alert channels',
  'SMS (Twilio, Telnyx, Plivo, ClickSend, Vonage, Textbelt), Google Chat, Google Calendar,',
  'Google Sheets, Google Tasks, Google Docs, and external integrations (MCP servers + custom',
  'HTTPS webhooks). There is **no email alert channel — by design**, so an alert never gets',
  'buried in the inbox you are watching.',
  '',
  '## Lite vs Pro',
  'Lite (this add-on): free, full features, scheduled/manual scans only (hourly at best). Pro: a',
  'self-hosted service that runs 24/7 with real-time push across Gmail and Outlook, $15/month or',
  '$150/year. Same rules and channels — the difference is automation.',
  '',
  '## Troubleshooting',
  '- No alerts: confirm your Gemini API key is set in Settings; make sure scheduled scans are on',
  '  (or use "Scan email now"); check the rule is enabled and watches the right label.',
  '- Not instant: Lite scans at most hourly (a Google platform limit). For real-time, that is Pro.',
  '- Use the Activity log to see what each scan did.',
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
