#!/usr/bin/env bash
# Step 4b — Fill script_a_core.md placeholders for every tester in a round.
#
# Usage (all args can be omitted — script prompts for anything missing):
#   bash tools/preflight/step4b_fill_scripts.sh ROUND GEMINI_KEY DEPLOY_URL BATCH_FILE
#
#   ROUND       — round number, e.g. 1
#   GEMINI_KEY  — the API key from step 1 output
#   DEPLOY_URL  — the Marketplace install URL from step 2e
#   BATCH_FILE  — path to the promo_codes/<batch>.txt file from the promo mint step
#                 (e.g. promo_codes/usertest-round-001.txt)
#
# Output: usertesting/outgoing/round_<N>/script_a_filled_tester_<NNN>.md
#         One file per tester, one unique promo code per file.
# These files are gitignored — do not commit them.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE="$REPO_ROOT/usertesting/docs/script_a_core.md"

ROUND="${1:-}"
GEMINI_KEY="${2:-}"
DEPLOY_URL="${3:-}"
BATCH_FILE="${4:-}"

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

if [[ -z "$BATCH_FILE" ]]; then
  DETECTED=$(ls -t "$REPO_ROOT/promo_codes/"*.txt 2>/dev/null | head -1 || true)
  if [[ -n "$DETECTED" ]]; then
    read -rp "Promo batch file [${DETECTED##"$REPO_ROOT"/}]: " BATCH_FILE
    BATCH_FILE="${BATCH_FILE:-$DETECTED}"
  else
    read -rp "Promo batch file path (e.g. promo_codes/usertest-round-001.txt): " BATCH_FILE
  fi
fi

# Resolve relative paths from repo root
[[ "$BATCH_FILE" != /* ]] && BATCH_FILE="$REPO_ROOT/$BATCH_FILE"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "ERROR: Template not found: $TEMPLATE" >&2; exit 1
fi
if [[ ! -f "$BATCH_FILE" ]]; then
  echo "ERROR: Batch file not found: $BATCH_FILE" >&2; exit 1
fi

# ── Parse promo codes from batch file ────────────────────────────────────────
# Format: Slot | Code | Tester Name | ... (pipes, skip comment/header/sep lines)

mapfile -t CODES < <(
  grep -v '^#' "$BATCH_FILE" \
  | awk -F'|' '
      /^---/ { next }
      /Slot/  { next }
      NF >= 2 {
        gsub(/[[:space:]]/, "", $2)
        if ($2 != "") print $2
      }
  '
)

if [[ ${#CODES[@]} -eq 0 ]]; then
  echo "ERROR: No promo codes found in $BATCH_FILE" >&2
  echo "       Run: python -m tools.promo.cli mint <batch-name> <count>" >&2
  exit 1
fi

# ── Create output directory ───────────────────────────────────────────────────

OUT_DIR="$REPO_ROOT/usertesting/outgoing/round_${ROUND_PAD}"
mkdir -p "$OUT_DIR"

# ── Fill one file per code ────────────────────────────────────────────────────

echo "============================================================"
echo "  Step 4b — Filling tester scripts"
echo "  Round    : $ROUND"
echo "  Template : usertesting/docs/script_a_core.md"
echo "  Batch    : ${BATCH_FILE##"$REPO_ROOT"/}"
echo "  Output   : usertesting/outgoing/round_${ROUND_PAD}/"
echo "  Testers  : ${#CODES[@]}"
echo "============================================================"
echo ""

COUNT=0
for CODE in "${CODES[@]}"; do
  COUNT=$(( COUNT + 1 ))
  TESTER=$(printf '%03d' "$COUNT")
  OUT_FILE="$OUT_DIR/script_a_filled_tester_${TESTER}.md"

  sed \
    -e "s|<DEV_GEMINI_KEY>|${GEMINI_KEY}|g" \
    -e "s|<TEST_DEPLOYMENT_URL>|${DEPLOY_URL}|g" \
    -e "s|<TESTER_PROMO_CODE>|${CODE}|g" \
    "$TEMPLATE" > "$OUT_FILE"

  echo "  Tester $TESTER — $CODE"
done

echo ""
echo "============================================================"
echo "  $COUNT files written to usertesting/outgoing/round_${ROUND_PAD}/"
echo ""
echo "  Each file = one UserTesting session. Open each in turn and"
echo "  paste the task text (Tasks 1–5) into UserTesting's task editor."
echo "  Clone the test $COUNT times, editing only the TESTER_PROMO_CODE"
echo "  line per session — never reuse a code across two testers."
echo ""
echo "  After the round closes, rotate credentials:"
echo "    Gemini key  : revoke in GCP Console → emailsentinel-usertesting-r${ROUND_PAD}"
echo "    Promo codes : python -m tools.promo.cli void-batch <batch-name>"
echo "    Deploy URL  : create a new Marketplace SDK deployment for next round"
echo "============================================================"
