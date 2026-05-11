#!/usr/bin/env bash
# Step 1 — Ensure shared GCP sandbox project exists and create a capped Gemini API key
#           for a UserTesting round. One project is reused across all rounds; each round
#           gets its own named API key (and its own quota hard-cap set manually).
#
# Usage:
#   bash tools/preflight/step1_create_sandbox.sh          # prompts for round number
#   bash tools/preflight/step1_create_sandbox.sh 1        # Round 1
#
# Prerequisites: gcloud CLI installed and authenticated.
#   gcloud auth login
#   gcloud auth application-default login
#
# Output: prints the Gemini API key — save it to your password manager immediately.

set -euo pipefail

ROUND="${1:-}"
if [[ -z "$ROUND" ]]; then
  read -rp "Round number (e.g. 1): " ROUND
fi
ROUND=$(printf '%d' "$ROUND" 2>/dev/null) || { echo "ERROR: Round must be a number." >&2; exit 1; }
ROUND_PAD=$(printf '%03d' "$ROUND")

PROJECT_ID="emailsentinel-usertesting-r001"
KEY_DISPLAY_NAME="UserTesting Round ${ROUND_PAD} — Gemini key"

echo "============================================================"
echo "  Step 1 — Shared GCP sandbox project + capped Gemini key"
echo "  Project : $PROJECT_ID (shared across all rounds)"
echo "  Round   : $ROUND_PAD"
echo "============================================================"
echo ""

# ── 1a. Create project (idempotent) ──────────────────────────────────────────

echo "1a. GCP project..."
if gcloud projects describe "$PROJECT_ID" --format="value(projectId)" &>/dev/null; then
  echo "    Already exists — skipping create."
else
  gcloud projects create "$PROJECT_ID" \
    --name="emAIl Sentinel UserTesting"
  echo "    Created."
fi

# ── Link billing account ──────────────────────────────────────────────────────

echo "    Linking billing..."
BILLING_ACCOUNT=$(gcloud billing accounts list \
  --filter="open=true" \
  --format="value(name)" \
  --limit=1)
if [[ -z "$BILLING_ACCOUNT" ]]; then
  echo "ERROR: No open billing account found." >&2
  echo "       Visit https://console.cloud.google.com/billing to create one, then re-run." >&2
  exit 1
fi
CURRENT_BILLING=$(gcloud billing projects describe "$PROJECT_ID" \
  --format="value(billingAccountName)" 2>/dev/null || true)
if [[ "$CURRENT_BILLING" == *"$BILLING_ACCOUNT"* ]]; then
  echo "    Already linked."
else
  gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
  echo "    Linked: $BILLING_ACCOUNT"
fi

# ── 1b. Enable API (idempotent) ───────────────────────────────────────────────

echo ""
echo "1b. Enabling Generative Language API..."
gcloud services enable generativelanguage.googleapis.com --project="$PROJECT_ID"
echo "    Enabled."

# ── Budget alert ($5 cap — one-time, skipped if already exists) ──────────────

echo "    Checking budget alert..."
gcloud billing budgets create \
  --billing-account="$BILLING_ACCOUNT" \
  --display-name="emAIl Sentinel UserTesting" \
  --budget-amount=5USD \
  --filter-projects="projects/$PROJECT_ID" \
  --threshold-rules=percent=0.5 \
  --threshold-rules=percent=0.9 \
  --threshold-rules=percent=1.0 2>/dev/null \
  && echo "    Budget alert set." \
  || echo "    Budget already exists or Billing Budget API not enabled — skipping."
echo ""
echo "    NOTE: Budget alerts notify but do NOT hard-cap spending."
echo "    Other safety layers (code-level MAX_EVALS_PER_RUN + 60-min polling"
echo "    floor + token-based daily limits) keep worst-case spend under \$5."

# ── 1c. Create per-round API key ─────────────────────────────────────────────

echo ""
echo "1c. Creating Gemini API key for Round ${ROUND_PAD}..."
EXISTING_KEY=$(gcloud services api-keys list \
  --project="$PROJECT_ID" \
  --filter="displayName='$KEY_DISPLAY_NAME'" \
  --format="value(name)" \
  --limit=1 2>/dev/null || true)

if [[ -n "$EXISTING_KEY" ]]; then
  echo "    Key already exists — retrieving."
  KEY_NAME="$EXISTING_KEY"
else
  gcloud services api-keys create \
    --project="$PROJECT_ID" \
    --display-name="$KEY_DISPLAY_NAME" \
    --api-target=service=generativelanguage.googleapis.com
  KEY_NAME=$(gcloud services api-keys list \
    --project="$PROJECT_ID" \
    --filter="displayName='$KEY_DISPLAY_NAME'" \
    --format="value(name)" \
    --limit=1)
  echo "    Key created."
fi

KEY_STRING=$(gcloud services api-keys get-key-string "$KEY_NAME" \
  --format="value(keyString)")

# ── 1d. Validate ──────────────────────────────────────────────────────────────

echo ""
echo "1d. Validating key against Gemini API..."
HTTP_CODE=$(curl -s -o /tmp/_preflight_gemini.json -w "%{http_code}" \
  "https://generativelanguage.googleapis.com/v1beta/models?key=${KEY_STRING}")
if [[ "$HTTP_CODE" == "200" ]]; then
  echo "    OK (HTTP 200)."
else
  echo "    WARNING: HTTP $HTTP_CODE — key may take up to 5 minutes to propagate. Re-run to check."
  cat /tmp/_preflight_gemini.json 2>/dev/null || true
fi

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo "============================================================"
echo "  DONE — save this key to your password manager NOW:"
echo ""
echo "  Key    : $KEY_STRING"
echo "  Label  : $KEY_DISPLAY_NAME — $(date +%Y-%m-%d)"
echo "  Project: $PROJECT_ID"
echo "============================================================"
