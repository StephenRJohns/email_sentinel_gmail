// Copyright (c) 2026 JJJJJ Enterprises, LLC. All rights reserved.
// Proprietary — see LICENSE for terms.

/**
 * SettingsManager.gs — Read/write per-user settings backed by UserProperties.
 *
 * UserProperties stores strings only and is private to the running user.
 * Each value has a 9 KB limit, so we keep settings as small JSON or scalars.
 */

const SETTINGS_KEY = 'mailsentinel.settings';

const DEFAULT_SETTINGS = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  smsProvider: 'none',
  // Textbelt
  textbeltApiKey: '',
  // Telnyx
  telnyxApiKey: '',
  telnyxFromNumber: '',
  // Plivo
  plivoAuthId: '',
  plivoAuthToken: '',
  plivoFromNumber: '',
  // Twilio
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioFromNumber: '',
  // ClickSend
  clicksendUsername: '',
  clicksendApiKey: '',
  // Vonage
  vonageApiKey: '',
  vonageApiSecret: '',
  // Generic webhook
  smsWebhookUrl: '',
  // SMS test number
  smsTestNumber: '',
  // Google Chat
  chatSpaces: '[]',
  // Google Calendar
  calendarId: '',
  // Google Sheets
  sheetsId: '',
  // Google Tasks
  tasksListId: '',
  // SMS recipients (named contacts to select in rules)
  smsRecipients: '[]',
  // License tier (Free by default; 'pro' unlocks higher limits and premium channels)
  license: { tier: 'free' }
};

function loadSettings() {
  const raw = PropertiesService.getUserProperties().getProperty(SETTINGS_KEY);
  if (!raw) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
  try {
    const parsed = JSON.parse(raw);
    return Object.assign({}, DEFAULT_SETTINGS, parsed);
  } catch (e) {
    activityLog('Settings corrupt, resetting: ' + e);
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings(settings) {
  const merged = Object.assign({}, DEFAULT_SETTINGS, settings);
  PropertiesService.getUserProperties()
    .setProperty(SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}

