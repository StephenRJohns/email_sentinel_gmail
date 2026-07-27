// Copyright (c) 2026 JJJJJ Enterprises, LLC. All rights reserved.
// Proprietary — see LICENSE for terms.

/**
 * ContextualEvaluator.gs — On-demand evaluation of the email the user has open.
 *
 * emAIl Sentinel Lite is a contextual Gmail add-on: the user opens a message,
 * opens the add-on panel, and clicks "Evaluate this email". Every enabled rule
 * is evaluated against that one message via Gemini, and matches dispatch
 * alerts through the configured channels.
 *
 * There is no background scanning. The add-on holds only the
 * gmail.addons.current.message.readonly scope, which grants access to the
 * currently open message while the user is interacting with the add-on —
 * it cannot search labels or read any other mail. This is deliberate:
 * gmail.readonly is a Google "restricted" scope requiring an annual paid
 * CASA security assessment; the contextual scope is sensitive-tier and
 * needs only standard OAuth verification. Whole-mailbox automation is the
 * self-hosted Pro product.
 */

// Stop evaluating further rules once this much wall-clock time has elapsed —
// Apps Script hard-kills executions at 6 minutes, and each rule costs up to
// two Gemini calls (evaluate + alert format) plus channel dispatch.
const EVAL_MAX_RUN_MS = 240000;

/**
 * Contextual trigger (appsscript.json → contextualTriggers). Fires when the
 * user opens a message with the add-on panel open. Kept deliberately cheap:
 * no Gmail read, no Gemini call — just a card offering the evaluation.
 */
function onGmailMessageOpen(e) {
  const rules = loadRules().filter(function(r) { return r.enabled; });
  const settings = loadSettings();

  const section = CardService.newCardSection();
  if (!settings.geminiApiKey) {
    section.addWidget(CardService.newTextParagraph().setText(
      '<font color="#b00020"><b>No Gemini API key configured.</b></font><br>' +
      'Open <b>Settings</b> and paste a key first — rule evaluation runs on your own Gemini.'));
    section.addWidget(CardService.newTextButton()
      .setText('Open Settings')
      .setOnClickAction(navAction_('buildSettingsCard')));
  } else if (!rules.length) {
    section.addWidget(CardService.newTextParagraph().setText(
      'No enabled rules yet. Create one (or enable an existing rule), then ' +
      'come back to any open email and evaluate it.'));
    section.addWidget(CardService.newTextButton()
      .setText('Open Rules')
      .setOnClickAction(navAction_('buildRulesCard')));
  } else {
    section.addWidget(CardService.newTextParagraph().setText(
      'Check this email against your ' + plural_(rules.length, 'enabled rule') +
      '. Matches send alerts to the channels each rule specifies.<br><br>' +
      '<font color="#888888">Evaluation typically takes a few seconds per rule ' +
      '(your Gemini does the reading).</font>'));
    section.addWidget(CardService.newTextButton()
      .setText(whiteText_('Evaluate this email'))
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(BRAND_PURPLE_)
      .setOnClickAction(action_('handleEvaluateOpenMessage')));
  }

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('emAIl Sentinel Lite'))
    .addSection(section)
    .build();
}

/**
 * Action handler for the "Evaluate this email" button. The event carries
 * e.gmail.messageId + e.gmail.accessToken because the button lives on a
 * contextual card; setCurrentMessageAccessToken authorizes the one-message
 * read under gmail.addons.current.message.readonly.
 */
function handleEvaluateOpenMessage(e) {
  try {
    const summary = evaluateOpenMessage_(e);
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().pushCard(buildEvaluationResultCard_(summary)))
      .build();
  } catch (err) {
    activityLog('Evaluation failed: ' + err);
    return notificationResponse_('Evaluation failed: ' + (err.message || err));
  }
}

function evaluateOpenMessage_(e) {
  const settings = loadSettings();
  if (!settings.geminiApiKey) {
    throw new Error('No Gemini API key configured — open Settings to add one.');
  }
  const rules = loadRules().filter(function(r) { return r.enabled; });
  if (!rules.length) {
    throw new Error('No enabled rules — open Rules to create or enable one.');
  }

  const gmailMeta = (e && e.gmail) || {};
  if (!gmailMeta.messageId || !gmailMeta.accessToken) {
    throw new Error('No open message in context — open an email and try again.');
  }
  GmailApp.setCurrentMessageAccessToken(gmailMeta.accessToken);
  const msg = normalizeMessage_(GmailApp.getMessageById(gmailMeta.messageId));

  const logMsg = applyScreenshotEmailData_(msg);
  activityLog('Evaluating open email — From: ' + logMsg.from +
    '  |  Subject: ' + (logMsg.subject || '').substring(0, 60));

  const runStart = Date.now();
  const results = [];
  rules.forEach(function(rule) {
    if ((Date.now() - runStart) > EVAL_MAX_RUN_MS) {
      results.push({ ruleName: rule.name, skipped: true,
        reason: 'Skipped — evaluation time limit reached. Re-run to evaluate this rule.' });
      activityLog('  Rule "' + rule.name + '" skipped — time limit reached.');
      return;
    }
    activityLog('  Evaluating against rule "' + rule.name + '" ...');
    const evalResult = evaluateEmailAgainstRule(
      msg, rule, settings.geminiApiKey, settings.geminiModel);
    if (evalResult.failed) {
      activityLog('  Evaluation failed for rule "' + rule.name + '".');
      results.push({ ruleName: rule.name, failed: true, reason: evalResult.reason || 'Gemini call failed.' });
    } else if (evalResult.matched) {
      activityLog('  MATCH! ' + evalResult.reason);
      const alertEmail = applyScreenshotEmailData_(msg);
      const alertContent = generateAlertMessage(
        alertEmail, rule, settings.geminiApiKey, settings.geminiModel);
      dispatchAlerts(rule, alertEmail, alertContent, evalResult.reason, settings);
      results.push({ ruleName: rule.name, matched: true, reason: evalResult.reason });
    } else {
      activityLog('  No match. ' + evalResult.reason);
      results.push({ ruleName: rule.name, matched: false, reason: evalResult.reason });
    }
  });

  return { subject: logMsg.subject || '(no subject)', results: results };
}

/**
 * Result card for a completed evaluation: banner with the match count, then
 * one row per rule (matched / no match / failed / skipped) with Gemini's
 * reason. Mirrors the old scan-result card's ✅/⚠ visual language.
 */
function buildEvaluationResultCard_(summary) {
  const results = summary.results || [];
  const matches = results.filter(function(r) { return r.matched; }).length;
  const failures = results.filter(function(r) { return r.failed || r.skipped; }).length;

  const accent = failures ? '#b00020' : (matches ? '#1e7e34' : '#555555');
  const icon = failures ? '⚠️' : (matches ? '✅' : '➖');
  const banner = matches + ' of ' + plural_(results.length, 'rule') + ' matched' +
    (failures ? ' (' + failures + ' not evaluated)' : '') + '.';

  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Evaluation result'));
  card.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(
      '<font color="' + accent + '"><b>' + icon + '&nbsp; ' + escapeHtml_(banner) + '</b></font><br>' +
      '<font color="#888888">' + escapeHtml_(summary.subject) + '</font>')));

  results.forEach(function(r) {
    var status;
    if (r.matched) status = '<font color="#1e7e34"><b>✅ Match — alerts sent</b></font>';
    else if (r.failed) status = '<font color="#b00020"><b>⚠️ Evaluation failed</b></font>';
    else if (r.skipped) status = '<font color="#b00020"><b>⚠️ Skipped</b></font>';
    else status = '<font color="#555555">➖ No match</font>';
    card.addSection(CardService.newCardSection()
      .setHeader('<b>' + escapeHtml_(r.ruleName) + '</b>')
      .addWidget(CardService.newTextParagraph().setText(
        status + '<br>' + escapeHtml_(r.reason || ''))));
  });

  card.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextButton()
      .setText('View activity log')
      .setOnClickAction(navAction_('buildActivityCard'))));
  return card.build();
}

/**
 * Normalize a GmailMessage into the plain object shape consumed by
 * RuleEvaluator (Gemini prompts) and AlertDispatcher (all channels).
 */
function normalizeMessage_(m) {
  let body = '';
  try { body = m.getPlainBody() || ''; }
  catch (e) { body = m.getBody() || ''; }

  let attachmentNames = [];
  try {
    attachmentNames = m.getAttachments({
      includeInlineImages: false,
      includeAttachments: true
    }).map(a => a.getName()).filter(Boolean);
  } catch (e) { /* malformed MIME */ }

  return {
    id: m.getId(),
    from: m.getFrom(),
    subject: m.getSubject() || '(no subject)',
    body: body,
    // Formatted in the user's local timezone (e.g. "2026-04-27 5:29:58 PM
    // CDT") so all downstream presentation contexts — Calendar event
    // descriptions, Tasks notes, Sheets rows, the Gemini evaluation prompt,
    // and the alert message Gemini generates — render in the user's local
    // time. receivedMillis stays as the raw epoch for any code that needs
    // sortable/comparable timestamps.
    receivedDateTime: formatLocalDateTime_(m.getDate()),
    receivedMillis: m.getDate().getTime(),
    attachmentNames: attachmentNames,
    hasAttachments: attachmentNames.length > 0
  };
}
