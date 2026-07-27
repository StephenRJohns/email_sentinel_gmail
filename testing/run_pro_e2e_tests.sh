#!/usr/bin/env bash
# Pro-tier wrapper around run_free_e2e_tests.sh.
#
# Sets TEST_TIER=pro so any Pro-gated describe blocks run instead of skipping.
# (Currently the Lite edition's tiers are functionally identical — the flag
# only matters if tier-gated tests are re-added.)
#
# Usage:
#   ./testing/run_pro_e2e_tests.sh                 # full Pro suite
#   ./testing/run_pro_e2e_tests.sh --last-failed   # re-run failures only (skips setup prompts)
#   ./testing/run_pro_e2e_tests.sh --grep "S21"    # one section; args pass through
#
# No Apps Script tier flip is needed — all features are free and the tiers
# are identical; TEST_TIER only changes which spec skips fire.

LAST_FAILED=false
for _arg in "$@"; do [ "$_arg" = "--last-failed" ] && LAST_FAILED=true && break; done

if ! $LAST_FAILED; then
  echo "============================================================"
  echo "  PRO-TIER TEST RUN"
  echo "============================================================"
  echo "  No tier flip needed — all features are free; TEST_TIER only"
  echo "  changes which spec skips fire."
  echo "============================================================"
  echo ""
fi

export TEST_TIER=pro
exec "$(dirname "$0")/run_free_e2e_tests.sh" "$@"
