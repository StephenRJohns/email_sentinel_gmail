#!/usr/bin/env bash
# Validate SMS provider credentials and confirm end-to-end dispatch before
# assigning testers. Runs a credential check (no SMS) and then a live test
# SMS to DEV_PHONE_NUMBER for each configured provider.
#
# Usage:
#   bash tools/preflight/validate_sms_providers.sh
#   bash tools/preflight/validate_sms_providers.sh --check-only   # skip SMS sends
#
# Prerequisites:
#   Copy tools/preflight/sms_preflight.env.example to tools/preflight/sms_preflight.env
#   and fill in your credentials + DEV_PHONE_NUMBER before running.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/sms_preflight.env"
CHECK_ONLY=false

for arg in "$@"; do [[ "$arg" == "--check-only" ]] && CHECK_ONLY=true; done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found." >&2
  echo "  cp tools/preflight/sms_preflight.env.example tools/preflight/sms_preflight.env" >&2
  echo "  # fill in your credentials, then re-run" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

DEV_PHONE="${DEV_PHONE_COUNTRY:-+1}${DEV_PHONE_NUMBER:-}"
if [[ -z "${DEV_PHONE_NUMBER:-}" ]]; then
  echo "ERROR: DEV_PHONE_NUMBER not set in sms_preflight.env" >&2; exit 1
fi

# ── Result tracking ───────────────────────────────────────────────────────────

declare -A AUTH_RESULT=()
declare -A SMS_RESULT=()

pass() { echo "    ✅ $*"; }
fail() { echo "    ❌ $*"; }
skip() { echo "    —  $*"; }

# ── Helper: HTTP status check ─────────────────────────────────────────────────

http_get() {
  # Usage: http_get URL [extra curl args...]
  curl -s -o /tmp/_sms_check.json -w "%{http_code}" "$@"
}

# ── Twilio ────────────────────────────────────────────────────────────────────

validate_twilio() {
  echo ""
  echo "Twilio"
  echo "------"

  if [[ -z "${TWILIO_ACCOUNT_SID:-}" || -z "${TWILIO_AUTH_TOKEN:-}" ]]; then
    skip "No credentials set — skipping."; AUTH_RESULT[twilio]="skip"; SMS_RESULT[twilio]="skip"; return
  fi

  local status
  status=$(http_get \
    "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json" \
    -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}")

  if [[ "$status" == "200" ]]; then
    pass "Credentials valid (HTTP 200)"
    AUTH_RESULT[twilio]="pass"
  else
    fail "Auth failed (HTTP $status) — check Account SID and Auth Token"
    AUTH_RESULT[twilio]="fail"; SMS_RESULT[twilio]="skip"; return
  fi

  if $CHECK_ONLY; then SMS_RESULT[twilio]="skipped (--check-only)"; return; fi
  if [[ -z "${TWILIO_FROM_NUMBER:-}" ]]; then
    skip "TWILIO_FROM_NUMBER not set — skipping SMS send"; SMS_RESULT[twilio]="skip"; return
  fi

  local from="${TWILIO_FROM_COUNTRY:-+1}${TWILIO_FROM_NUMBER}"
  local sms_status
  sms_status=$(curl -s -o /tmp/_sms_check.json -w "%{http_code}" \
    "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json" \
    -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}" \
    --data-urlencode "To=${DEV_PHONE}" \
    --data-urlencode "From=${from}" \
    --data-urlencode "Body=[emAIl Sentinel preflight] Twilio test")

  if [[ "$sms_status" =~ ^2 ]]; then
    pass "Test SMS queued — check your phone"
    SMS_RESULT[twilio]="pass"
  else
    fail "SMS send failed (HTTP $sms_status): $(cat /tmp/_sms_check.json)"
    SMS_RESULT[twilio]="fail"
  fi
}

# ── Telnyx ────────────────────────────────────────────────────────────────────

validate_telnyx() {
  echo ""
  echo "Telnyx"
  echo "------"

  if [[ -z "${TELNYX_API_KEY:-}" ]]; then
    skip "No credentials set — skipping."; AUTH_RESULT[telnyx]="skip"; SMS_RESULT[telnyx]="skip"; return
  fi

  local status
  status=$(http_get \
    "https://api.telnyx.com/v2/messaging_profiles" \
    -H "Authorization: Bearer ${TELNYX_API_KEY}")

  if [[ "$status" == "200" ]]; then
    pass "Credentials valid (HTTP 200)"
    AUTH_RESULT[telnyx]="pass"
  else
    fail "Auth failed (HTTP $status) — check API key"
    AUTH_RESULT[telnyx]="fail"; SMS_RESULT[telnyx]="skip"; return
  fi

  if $CHECK_ONLY; then SMS_RESULT[telnyx]="skipped (--check-only)"; return; fi
  if [[ -z "${TELNYX_FROM_NUMBER:-}" ]]; then
    skip "TELNYX_FROM_NUMBER not set — skipping SMS send"; SMS_RESULT[telnyx]="skip"; return
  fi

  local from="${TELNYX_FROM_COUNTRY:-+1}${TELNYX_FROM_NUMBER}"
  local sms_status
  sms_status=$(curl -s -o /tmp/_sms_check.json -w "%{http_code}" \
    -X POST "https://api.telnyx.com/v2/messages" \
    -H "Authorization: Bearer ${TELNYX_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"from\":\"${from}\",\"to\":\"${DEV_PHONE}\",\"text\":\"[emAIl Sentinel preflight] Telnyx test\"}")

  if [[ "$sms_status" =~ ^2 ]]; then
    pass "Test SMS queued — check your phone"
    SMS_RESULT[telnyx]="pass"
  else
    fail "SMS send failed (HTTP $sms_status): $(cat /tmp/_sms_check.json)"
    SMS_RESULT[telnyx]="fail"
  fi
}

# ── Plivo ─────────────────────────────────────────────────────────────────────

validate_plivo() {
  echo ""
  echo "Plivo"
  echo "-----"

  if [[ -z "${PLIVO_AUTH_ID:-}" || -z "${PLIVO_AUTH_TOKEN:-}" ]]; then
    skip "No credentials set — skipping."; AUTH_RESULT[plivo]="skip"; SMS_RESULT[plivo]="skip"; return
  fi

  local status
  status=$(http_get \
    "https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/" \
    -u "${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}")

  if [[ "$status" == "200" ]]; then
    pass "Credentials valid (HTTP 200)"
    AUTH_RESULT[plivo]="pass"
  else
    fail "Auth failed (HTTP $status) — check Auth ID and Auth Token"
    AUTH_RESULT[plivo]="fail"; SMS_RESULT[plivo]="skip"; return
  fi

  if $CHECK_ONLY; then SMS_RESULT[plivo]="skipped (--check-only)"; return; fi
  if [[ -z "${PLIVO_FROM_NUMBER:-}" ]]; then
    skip "PLIVO_FROM_NUMBER not set — skipping SMS send"; SMS_RESULT[plivo]="skip"; return
  fi

  local from="${PLIVO_FROM_COUNTRY:-+1}${PLIVO_FROM_NUMBER}"
  local sms_status
  sms_status=$(curl -s -o /tmp/_sms_check.json -w "%{http_code}" \
    -X POST "https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Message/" \
    -u "${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"src\":\"${from}\",\"dst\":\"${DEV_PHONE}\",\"text\":\"[emAIl Sentinel preflight] Plivo test\"}")

  if [[ "$sms_status" =~ ^2 ]]; then
    pass "Test SMS queued — check your phone"
    SMS_RESULT[plivo]="pass"
  else
    fail "SMS send failed (HTTP $sms_status): $(cat /tmp/_sms_check.json)"
    SMS_RESULT[plivo]="fail"
  fi
}

# ── ClickSend ─────────────────────────────────────────────────────────────────

validate_clicksend() {
  echo ""
  echo "ClickSend"
  echo "---------"

  if [[ -z "${CLICKSEND_USERNAME:-}" || -z "${CLICKSEND_API_KEY:-}" ]]; then
    skip "No credentials set — skipping."; AUTH_RESULT[clicksend]="skip"; SMS_RESULT[clicksend]="skip"; return
  fi

  local status
  status=$(http_get \
    "https://rest.clicksend.com/v3/account" \
    -u "${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}")

  if [[ "$status" == "200" ]]; then
    pass "Credentials valid (HTTP 200)"
    AUTH_RESULT[clicksend]="pass"
  else
    fail "Auth failed (HTTP $status) — check username and API key"
    AUTH_RESULT[clicksend]="fail"; SMS_RESULT[clicksend]="skip"; return
  fi

  if $CHECK_ONLY; then SMS_RESULT[clicksend]="skipped (--check-only)"; return; fi

  local sms_status
  sms_status=$(curl -s -o /tmp/_sms_check.json -w "%{http_code}" \
    -X POST "https://rest.clicksend.com/v3/sms/send" \
    -u "${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"messages\":[{\"to\":\"${DEV_PHONE}\",\"body\":\"[emAIl Sentinel preflight] ClickSend test\"}]}")

  if [[ "$sms_status" =~ ^2 ]]; then
    pass "Test SMS queued — check your phone"
    SMS_RESULT[clicksend]="pass"
  else
    fail "SMS send failed (HTTP $sms_status): $(cat /tmp/_sms_check.json)"
    SMS_RESULT[clicksend]="fail"
  fi
}

# ── Vonage ────────────────────────────────────────────────────────────────────

validate_vonage() {
  echo ""
  echo "Vonage"
  echo "------"

  if [[ -z "${VONAGE_API_KEY:-}" || -z "${VONAGE_API_SECRET:-}" ]]; then
    skip "No credentials set — skipping."; AUTH_RESULT[vonage]="skip"; SMS_RESULT[vonage]="skip"; return
  fi

  local status
  status=$(http_get \
    "https://rest.nexmo.com/account/get-balance?api_key=${VONAGE_API_KEY}&api_secret=${VONAGE_API_SECRET}")

  if [[ "$status" == "200" ]]; then
    local balance
    balance=$(python3 -c "import json,sys; d=json.load(open('/tmp/_sms_check.json')); print(d.get('value','?'))" 2>/dev/null || echo "?")
    pass "Credentials valid — account balance: \$${balance}"
    AUTH_RESULT[vonage]="pass"
  else
    fail "Auth failed (HTTP $status) — check API key and secret"
    AUTH_RESULT[vonage]="fail"; SMS_RESULT[vonage]="skip"; return
  fi

  if $CHECK_ONLY; then SMS_RESULT[vonage]="skipped (--check-only)"; return; fi

  local sms_status
  sms_status=$(curl -s -o /tmp/_sms_check.json -w "%{http_code}" \
    -X POST "https://rest.nexmo.com/sms/json" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "api_key=${VONAGE_API_KEY}" \
    --data-urlencode "api_secret=${VONAGE_API_SECRET}" \
    --data-urlencode "to=${DEV_PHONE}" \
    --data-urlencode "from=emAIlSentinel" \
    --data-urlencode "text=[emAIl Sentinel preflight] Vonage test")

  # Vonage returns 200 even for delivery failures — check message status
  local msg_status
  msg_status=$(python3 -c "
import json,sys
d=json.load(open('/tmp/_sms_check.json'))
msgs=d.get('messages',[{}])
print(msgs[0].get('status','?'))
" 2>/dev/null || echo "?")

  if [[ "$sms_status" == "200" && "$msg_status" == "0" ]]; then
    pass "Test SMS accepted — check your phone"
    SMS_RESULT[vonage]="pass"
  else
    fail "SMS send failed (HTTP $sms_status, message status $msg_status): $(cat /tmp/_sms_check.json)"
    SMS_RESULT[vonage]="fail"
    echo "    NOTE: Vonage free-trial accounts require the destination number to be"
    echo "    added as a test number (Vonage dashboard → Test numbers) before SMS works."
  fi
}

# ── Textbelt ──────────────────────────────────────────────────────────────────

validate_textbelt() {
  echo ""
  echo "Textbelt"
  echo "--------"

  local key="${TEXTBELT_API_KEY:-textbelt}"

  # Check quota for this key
  local quota_status
  quota_status=$(http_get "https://textbelt.com/quota/${key}")
  if [[ "$quota_status" == "200" ]]; then
    local remaining
    remaining=$(python3 -c "import json,sys; d=json.load(open('/tmp/_sms_check.json')); print(d.get('quotaRemaining','?'))" 2>/dev/null || echo "?")
    pass "Key valid — quota remaining: ${remaining}"
    AUTH_RESULT[textbelt]="pass"
  else
    fail "Key check failed (HTTP $quota_status)"
    AUTH_RESULT[textbelt]="fail"; SMS_RESULT[textbelt]="skip"; return
  fi

  if $CHECK_ONLY; then SMS_RESULT[textbelt]="skipped (--check-only)"; return; fi

  local sms_status body
  body=$(curl -s -X POST "https://textbelt.com/text" \
    --data-urlencode "phone=${DEV_PHONE}" \
    --data-urlencode "message=[emAIl Sentinel preflight] Textbelt test" \
    --data-urlencode "key=${key}")
  local success
  success=$(echo "$body" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success','false'))" 2>/dev/null || echo "false")

  if [[ "$success" == "True" || "$success" == "true" ]]; then
    pass "Test SMS sent — check your phone"
    SMS_RESULT[textbelt]="pass"
  else
    fail "SMS send failed: $body"
    SMS_RESULT[textbelt]="fail"
  fi
}

# ── Run all providers ─────────────────────────────────────────────────────────

echo "============================================================"
echo "  SMS Provider Preflight Validation"
echo "  Target phone: ${DEV_PHONE_COUNTRY:-+1} ${DEV_PHONE_NUMBER}"
if $CHECK_ONLY; then
  echo "  Mode: credential check only (no SMS sent)"
else
  echo "  Mode: credential check + live test SMS per provider"
fi
echo "============================================================"

validate_twilio
validate_telnyx
validate_plivo
validate_clicksend
validate_vonage
validate_textbelt

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
echo "============================================================"
echo "  Summary"
echo "============================================================"
printf "  %-12s  %-10s  %s\n" "Provider" "Auth" "SMS"
printf "  %-12s  %-10s  %s\n" "--------" "----" "---"
for p in twilio telnyx plivo clicksend vonage textbelt; do
  auth="${AUTH_RESULT[$p]:-skip}"
  sms="${SMS_RESULT[$p]:-skip}"
  auth_icon="—"; sms_icon="—"
  [[ "$auth" == "pass" ]] && auth_icon="✅"
  [[ "$auth" == "fail" ]] && auth_icon="❌"
  [[ "$sms"  == "pass" ]] && sms_icon="✅"
  [[ "$sms"  == "fail" ]] && sms_icon="❌"
  printf "  %-12s  %-10s  %s\n" "$p" "$auth_icon $auth" "$sms_icon $sms"
done
echo "============================================================"
echo ""
echo "  Fix any ❌ rows before running step4c_fill_sms_scripts.sh."
echo "  Providers with auth=skip were not configured in sms_preflight.env."
