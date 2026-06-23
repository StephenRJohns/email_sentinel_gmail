// Copyright (c) 2026 JJJJJ Enterprises, LLC. All rights reserved.
// Proprietary — see LICENSE for terms.

/**
 * LicenseManager.gs — Tier limits and feature gating for the Free/Pro plans.
 *
 * Tier is persisted in settings.license.tier ('free' | 'pro'). For now, Pro is
 * assigned manually via setTier_('pro'); in a later pass this will be wired to
 * the Google Workspace Marketplace subscription API.
 */

// This add-on is now the free **Lite** edition: fully featured, no caps. It scans
// as fast as the Google add-on platform allows — time-based triggers can't fire
// more than once an hour (a platform limit, not ours), so minPollMinutes is the
// 60-minute floor for everyone. The thing Lite can't do is run continuously / in
// real time — that automation is the self-hosted **Pro** product. Every limit
// here is wide open; both tiers are identical (kept as a pair so the rest of the
// code that reads getTierLimits()/isPro() keeps working).
const TIERS = {
  free: {
    maxRules: Infinity,
    minPollMinutes: 60,
    allowChat: true,
    allowMcp: true,
    allowAiSuggest: true,
    logRetentionDays: Infinity
  },
  pro: {
    maxRules: Infinity,
    minPollMinutes: 60,
    allowChat: true,
    allowMcp: true,
    allowAiSuggest: true,
    logRetentionDays: Infinity
  }
};

// Where the in-app "Upgrade to Pro" buttons send people: the self-hosted Pro
// product (24/7 automation + real-time push). Update to the final landing page.
const UPGRADE_URL = 'https://jjjjjenterprises.com/emailsentinel/pro';

// Founding-member lifetime add-on offer — retired. Pro is now a separate
// self-hosted subscription product, so there's no in-add-on lifetime unlock.
function foundingMembersRemaining() {
  return 0;
}

function isFoundingMemberOfferActive() {
  return false;
}

function getTier() {
  const s = loadSettings();
  const tier = (s.license && s.license.tier) || 'free';
  return TIERS[tier] ? tier : 'free';
}

function getTierLimits() {
  return TIERS[getTier()];
}

function isPro() {
  return getTier() === 'pro';
}

function setTier_(tier) {
  if (tier !== 'free' && tier !== 'pro') {
    throw new Error('Invalid tier: ' + tier);
  }
  const s = loadSettings();
  s.license = Object.assign({}, s.license || {}, { tier: tier });
  saveSettings(s);
  activityLog('License tier changed to: ' + tier);
  return tier;
}

// ── Pre-launch testing helpers ──────────────────────────────────────────────
// These no-argument wrappers are visible in the Apps Script editor's function
// dropdown (setTier_ is private and takes an argument, so the Run button
// cannot invoke it directly). Select one of these from the dropdown and click
// Run to flip the live tier between Free and Pro for E2E testing.

function setTierPro() {
  return setTier_('pro');
}

function setTierFree() {
  return setTier_('free');
}

/**
 * Validate and normalize a requested poll interval. Gmail / Workspace add-on
 * time-based triggers must fire >= 60 minutes apart (Google platform limit,
 * not a tier policy). On top of that platform floor, tiers set their own
 * minimum: Free = 180 (every 3 hours), Pro = 60 (every 1 hour). pollMinutes
 * snaps up to the next multiple of 60 and is clamped to the active tier's
 * minimum. For sub-hour responsiveness, users click "Scan email now" — that
 * calls runMailCheck({force: true}) and runs immediately regardless of cadence.
 *
 * Returns { value, clamped, raisedToTierMin, snappedToGrid, quotaWarning,
 *           invalid, requested }.
 */
function enforcePollFloor(requestedMinutes) {
  const tier = getTier();
  const tierMin = getTierLimits().minPollMinutes;
  const parsed = parseInt(requestedMinutes, 10);
  const invalid = isNaN(parsed) || parsed < 1;
  const requested = invalid ? tierMin : parsed;
  var value = Math.max(requested, tierMin);
  // Gmail/Workspace add-ons require time-based triggers to be at least 60
  // minutes, so the polling grid is multiples of 60.
  var snappedToGrid = false;
  if (value % 60 !== 0) {
    value = Math.ceil(value / 60) * 60;
    snappedToGrid = true;
  }
  return {
    value: value,
    clamped: value !== requested,
    raisedToTierMin: !invalid && parsed < tierMin,
    snappedToGrid: snappedToGrid,
    quotaWarning: false,
    invalid: invalid,
    requested: requested
  };
}

/**
 * True if the current tier may create one more rule.
 */
function canAddRule() {
  const rules = loadRules();
  return rules.length < getTierLimits().maxRules;
}

/**
 * Return an upgrade-required message for a given gated feature.
 */
function upgradeRequiredMessage(feature) {
  return 'Upgrade to Pro to use ' + feature + '.';
}
