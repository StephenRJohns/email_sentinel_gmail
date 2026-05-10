#!/usr/bin/env bash
# Step 4c — Fill script_c_sms_providers.md for each tester/provider assignment.
#
# Usage (all args can be omitted — script prompts for anything missing):
#   bash tools/preflight/step4c_fill_sms_scripts.sh ROUND GEMINI_KEY DEPLOY_URL
#
# The script interactively assigns one provider per tester slot (up to 2 per
# provider) and writes a filled script for each.
#
# Output: usertesting/outgoing/round_<NNN>/script_c_sms_tester_<NNN>_<provider>.md
#         (round number always written as 3-digit zero-padded — round_001, round_010, etc.)
# These files are gitignored — do not commit them.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE="$REPO_ROOT/usertesting/docs/script_c_sms_providers.md"

ROUND="${1:-}"
GEMINI_KEY="${2:-}"
DEPLOY_URL="${3:-}"

# ── Prompt for missing args ───────────────────────────────────────────────────

if [[ -z "$ROUND" ]]; then
  read -rp "Round number (e.g. 1): " ROUND
fi
ROUND=$(printf '%d' "$ROUND" 2>/dev/null) || { echo "ERROR: Round must be a number." >&2; exit 1; }
ROUND_PAD=$(printf '%03d' "$ROUND")

if [[ -z "$GEMINI_KEY" ]]; then
  read -rp "Gemini API key (from step 1): " GEMINI_KEY
fi

if [[ -z "$DEPLOY_URL" ]]; then
  read -rp "Marketplace install URL (from step 2e): " DEPLOY_URL
fi

if [[ ! -f "$TEMPLATE" ]]; then
  echo "ERROR: Template not found: $TEMPLATE" >&2; exit 1
fi

# ── Provider setup blocks ─────────────────────────────────────────────────────
# Each block is the literal text that replaces <PROVIDER_SETUP_BLOCK> in the
# template. Keep markdown formatting consistent across providers.

provider_block_textbelt() {
cat <<'BLOCK'
**Provider assigned: Textbelt**

Credentials to have ready:
- **API key:** the literal string `textbelt` (Textbelt's shared free token — 1 SMS/day, no sign-up needed). If you have a paid Textbelt account, use your paid API token instead.

Provider setup steps in Settings:
1. Find the **Provider** dropdown → select **Textbelt**.
2. A single **Textbelt API key** field appears. Paste `textbelt` (or your paid token).

> Note: the free `textbelt` token is rate-limited to one SMS per 24 hours per IP address. If you need to re-run a test step, use a paid token to avoid the limit.
BLOCK
}

provider_block_clicksend() {
cat <<'BLOCK'
**Provider assigned: ClickSend**

Credentials to have ready (from your ClickSend dashboard → **Developers → API Credentials**):
- **Username** — your ClickSend account email address
- **API key** — shown under API Credentials (click "View" to reveal)

Provider setup steps in Settings:
1. Find the **Provider** dropdown → select **ClickSend**.
2. Enter your **username** (your account email) and **API key** in the fields that appear.

> Note: ClickSend does not require a dedicated "From" phone number — your username is used as the sender. New accounts have free trial credits; verify your account has remaining credit before the session.
BLOCK
}

provider_block_vonage() {
cat <<'BLOCK'
**Provider assigned: Vonage**

Credentials to have ready (from your Vonage dashboard → **API Settings**):
- **API key** — the short alphanumeric key at the top of API Settings
- **API secret** — beside it (click the eye icon to reveal)

Provider setup steps in Settings:
1. Find the **Provider** dropdown → select **Vonage**.
2. Enter your **API key** and **API secret** in the fields that appear.

> Note: Vonage free-trial accounts start in sandbox mode where only pre-verified numbers can receive messages. If delivery fails in Task 3 or 5, go to your Vonage dashboard → **Test numbers** and add your mobile number as a test destination. Note whether the add-on's error message (if any) made this clear.
BLOCK
}

provider_block_telnyx() {
cat <<'BLOCK'
**Provider assigned: Telnyx**

Credentials to have ready (from your Telnyx portal):
- **API key** — Telnyx portal → **API Keys** → create or copy a V2 key
- **"From" phone number** — an active number on your Telnyx account that has a Messaging Profile assigned (Telnyx portal → **Phone Numbers** → click the number → confirm Messaging Profile is set)

Provider setup steps in Settings:
1. Find the **Provider** dropdown → select **Telnyx**.
2. Enter your **API key**.
3. For the "From" number: select the country code from the **Telnyx "From" number country code** dropdown, then enter the **digits only** — no `+`, no country code, no spaces or dashes. Example: for `+1 212 555 1234` select `+1 (US/Canada)` and type `2125551234`.

> Note: if the tester's number is not linked to a Messaging Profile in Telnyx, delivery will fail silently. Verify the Messaging Profile assignment before the session.
BLOCK
}

provider_block_plivo() {
cat <<'BLOCK'
**Provider assigned: Plivo**

Credentials to have ready (from your Plivo console → **Overview**):
- **Auth ID** — the identifier at the top of the Overview page
- **Auth Token** — beside it (click the eye icon to reveal)
- **"From" phone number** — an active number on your Plivo account (Plivo console → **Phone Numbers**)

Provider setup steps in Settings:
1. Find the **Provider** dropdown → select **Plivo**.
2. Enter your **Auth ID** and **Auth Token**.
3. For the "From" number: select the country code from the **Plivo "From" number country code** dropdown, then enter the **digits only** — no `+`, no country code, no spaces or dashes. Example: for `+1 210 555 1234` select `+1 (US/Canada)` and type `2105551234`.
BLOCK
}

provider_block_twilio() {
cat <<'BLOCK'
**Provider assigned: Twilio**

Credentials to have ready (from your Twilio Console → **Account Info** panel on the dashboard):
- **Account SID** — starts with `AC`
- **Auth Token** — click to reveal
- **"From" phone number** — an active Twilio number on your account (**Phone Numbers → Manage → Active numbers**)

Provider setup steps in Settings:
1. Find the **Provider** dropdown → select **Twilio**.
2. Enter your **Account SID** and **Auth Token**.
3. For the "From" number: select the country code from the **Twilio "From" number country code** dropdown, then enter the **digits only** — no `+`, no country code, no spaces or dashes. Example: for `+1 210 555 1234` select `+1 (US/Canada)` and type `2105551234`.

> Note: US-to-US SMS delivery requires A2P 10DLC registration. If delivery fails silently, check Twilio Console → **Monitor → Logs → Messaging** for error code 30034 (unregistered campaign). The campaign registration must be approved before this session produces valid delivery results.
BLOCK
}

# ── Provider list (key → display name → block function) ──────────────────────

declare -a PROVIDER_KEYS=( textbelt clicksend vonage telnyx plivo twilio )
declare -A PROVIDER_NAMES=(
  [textbelt]="Textbelt"
  [clicksend]="ClickSend"
  [vonage]="Vonage"
  [telnyx]="Telnyx"
  [plivo]="Plivo"
  [twilio]="Twilio"
)

# Track how many sessions have been assigned per provider (max 2 each)
declare -A PROVIDER_COUNT=(
  [textbelt]=0 [clicksend]=0 [vonage]=0
  [telnyx]=0   [plivo]=0     [twilio]=0
)

# ── Interactive assignment loop ───────────────────────────────────────────────

OUT_DIR="$REPO_ROOT/usertesting/outgoing/round_${ROUND_PAD}"
mkdir -p "$OUT_DIR"

echo "============================================================"
echo "  Step 4c — Filling Script C (SMS provider) tester scripts"
echo "  Round   : $ROUND"
echo "  Output  : usertesting/outgoing/round_${ROUND_PAD}/"
echo "  Max     : 2 testers per provider"
echo "============================================================"
echo ""
echo "For each tester slot, pick a provider. Enter 'done' when finished."
echo ""

COUNT=0

while true; do
  # Show remaining capacity
  echo "Provider availability:"
  for key in "${PROVIDER_KEYS[@]}"; do
    remaining=$(( 2 - PROVIDER_COUNT[$key] ))
    if [[ $remaining -gt 0 ]]; then
      printf "  %-12s  %d slot(s) remaining\n" "${PROVIDER_NAMES[$key]}" "$remaining"
    else
      printf "  %-12s  FULL\n" "${PROVIDER_NAMES[$key]}"
    fi
  done
  echo ""

  read -rp "Assign tester $((COUNT + 1)) to provider (textbelt/clicksend/vonage/telnyx/plivo/twilio/done): " CHOICE
  CHOICE="${CHOICE,,}"
  [[ "$CHOICE" == "done" ]] && break

  if [[ -z "${PROVIDER_NAMES[$CHOICE]+_}" ]]; then
    echo "  Unknown provider '$CHOICE' — try again."
    echo ""
    continue
  fi

  if [[ ${PROVIDER_COUNT[$CHOICE]} -ge 2 ]]; then
    echo "  ${PROVIDER_NAMES[$CHOICE]} is already at 2 testers — pick another."
    echo ""
    continue
  fi

  PROVIDER_COUNT[$CHOICE]=$(( PROVIDER_COUNT[$CHOICE] + 1 ))
  COUNT=$(( COUNT + 1 ))
  TESTER=$(printf '%03d' "$COUNT")
  PROVIDER_NAME="${PROVIDER_NAMES[$CHOICE]}"
  OUT_FILE="$OUT_DIR/script_c_sms_tester_${TESTER}_${CHOICE}.md"

  # Generate the provider block
  PROVIDER_BLOCK=$("provider_block_${CHOICE}")

  # Write the filled script using awk to handle multi-line placeholder replacement
  awk -v block="$PROVIDER_BLOCK" '
    /<PROVIDER_SETUP_BLOCK>/ { print block; next }
    { print }
  ' "$TEMPLATE" \
  | sed \
      -e "s|<PROVIDER_NAME>|${PROVIDER_NAME}|g" \
      -e "s|<DEV_GEMINI_KEY>|${GEMINI_KEY}|g" \
      -e "s|<TEST_DEPLOYMENT_URL>|${DEPLOY_URL}|g" \
  > "$OUT_FILE"

  echo "  Written: $(basename "$OUT_FILE")"
  echo ""
done

if [[ $COUNT -eq 0 ]]; then
  echo "No testers assigned — nothing written."
  exit 0
fi

echo ""
echo "============================================================"
echo "  $COUNT file(s) written to usertesting/outgoing/round_${ROUND_PAD}/"
echo ""

# Coverage summary
echo "  Coverage summary:"
for key in "${PROVIDER_KEYS[@]}"; do
  n=${PROVIDER_COUNT[$key]}
  [[ $n -gt 0 ]] && printf "    %-12s  %d tester(s)\n" "${PROVIDER_NAMES[$key]}" "$n"
done

echo ""
echo "  Each file = one tester session. Share the file content with"
echo "  the tester directly (email, Notion, Google Doc). These sessions"
echo "  are direct-recruited — not submitted through UserTesting.com."
echo ""
echo "  After the round: rotate the Gemini key for this round."
echo "    GCP Console → emailsentinel-usertesting-r${ROUND_PAD} → Credentials"
echo "============================================================"
