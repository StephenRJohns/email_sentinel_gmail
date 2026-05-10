#!/usr/bin/env bash
#
# walk_script_a.sh — Interactive observation walk-through for a UserTesting
# Round 1 Script A session (five Google channels path).
#
# Creates a fresh per-tester checklist and walks every item using the same
# p/f/s/q interface as walk_test_run.sh. Run while watching a session
# recording or live during the session.
#
# Usage:
#   bash testing/walk_script_a.sh            # prompts for tester number
#   bash testing/walk_script_a.sh 3          # tester 3, no prompt
#   bash testing/walk_script_a.sh --resume   # resume the most recent session file
#
# Answer key:
#   p  pass    — tester completed step / observation confirmed
#   f  fail    — issue observed; prompts for a one-line description
#   s  skip    — step not observable / not applicable; auto-skips rest of section
#   q  quit    — exits early; all answers so far are saved
#
# Output: usertesting/findings/<YYYY-MM-DD_HH:MM:SS>_tester<N>_script_a.md
# Mirrors: usertesting/docs/script_a_core.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
FINDINGS_DIR="$REPO_ROOT/usertesting/findings"

CHECKBOX_RE='^([[:space:]]*)-[[:space:]]\[[[:space:]]\][[:space:]](.*)$'
SECTION_RE='^## ([0-9]+[a-z]?) · (.*)$'

# ── File helpers ─────────────────────────────────────────────────────────────

replace_line() {
  local file="$1" lineno="$2" newline="$3"
  awk -v n="$lineno" -v r="$newline" \
    'NR==n{print r; next} {print}' "$file" > "${file}.tmp" \
    && mv "${file}.tmp" "$file"
}

insert_after() {
  local file="$1" lineno="$2" insert="$3"
  awk -v n="$lineno" -v ins="$insert" \
    'NR==n{print; print ins; next} {print}' "$file" > "${file}.tmp" \
    && mv "${file}.tmp" "$file"
}

save_checkpoint() {
  awk '{print}' "$1" > "${1}.tmp" && mv "${1}.tmp" "$1"
}

count_unchecked() {
  grep -c '^[[:space:]]*- \[ \] ' "$1" 2>/dev/null || true
}

# ── Template ─────────────────────────────────────────────────────────────────

write_template() {
  local file="$1" tester="$2" ts="$3"
  cat > "$file" <<EOF
# UserTesting — Script A session observation
# Tester: ${tester}
# Date: ${ts}
# Mirrors: usertesting/docs/script_a_core.md

## 1 · Task 1 — Install the add-on

- [ ] Tester completed the "unverified app" OAuth consent without coaching
- [ ] emAIl Sentinel icon appeared in the Gmail sidebar after install
- [ ] Home card loaded with plan indicator, status rows, and nav buttons visible
- [ ] Tester described what the product does from the home card alone (unprompted, within ~30 seconds)

## 2a · Task 2a — Gemini API key

- [ ] Tester found Settings without assistance
- [ ] Tester understood what "Gemini API key" is from the on-card text alone
- [ ] Key pasted; Save settings toast confirmed
- [ ] Test Gemini returned "Gemini OK" toast

## 2b · Task 2b — Redeem Pro promo code

- [ ] Promo code section visible at bottom of home card
- [ ] Tester entered the code and clicked Redeem without confusion
- [ ] "Pro plan activated" toast appeared
- [ ] Home card refreshed: Plan row reads "Pro", promo section no longer visible

## 2c · Task 2c — Add a Google Chat space

- [ ] Tester navigated to chat.google.com without losing context
- [ ] Tester found Apps & integrations → Webhooks in Google Chat
- [ ] Webhook URL copied and pasted into emAIl Sentinel Settings → Add Chat space
- [ ] Chat space saved; toast confirmed

## 3 · Task 3 — Create rule with all five channels

- [ ] Tester found Rules → + New rule without assistance
- [ ] Tester wrote their own rule text (not copied verbatim from task instructions)
- [ ] "Help me write the rule text" button noticed or remarked on
- [ ] Google Calendar channel ticked
- [ ] Google Sheets channel ticked
- [ ] Google Tasks channel ticked
- [ ] Google Docs channel ticked
- [ ] Google Chat space ticked (or noted skipped per Task 2c outcome)
- [ ] Rule saved; toast confirmed

## 4 · Task 4 — Send test email and verify all five alerts

- [ ] Test email composed and sent in Gmail
- [ ] Scan triggered via kebab → Scan email now → Run scan now (not home-card button)
- [ ] Result card showed "Scan complete — 1 match" in green
- [ ] Calendar: new event verified
- [ ] Sheets: new row in emAIl Sentinel Log verified
- [ ] Tasks: new task verified
- [ ] Docs: new entry in emAIl Sentinel Log verified
- [ ] Chat: new message in configured space verified (or noted skipped per Task 2c)

## 5 · Task 5 — Wrap-up questions

- [ ] Tester explained product purpose in own words coherently
- [ ] Tester identified at least one specific confusion point
- [ ] Purchase intent recorded (would pay \$4.99/month / free tier enough / no)
- [ ] Session produced usable signal for Tasks 1–4
EOF
}

# ── Session management ────────────────────────────────────────────────────────

create_session_file() {
  local tester="$1"
  local ts
  ts=$(date '+%Y-%m-%d_%H:%M:%S')
  local filepath="$FINDINGS_DIR/${ts}_tester${tester}_script_a.md"
  mkdir -p "$FINDINGS_DIR"
  write_template "$filepath" "$tester" "$(date '+%Y-%m-%d %H:%M:%S')"
  echo "$filepath"
}

find_latest_session() {
  [[ ! -d "$FINDINGS_DIR" ]] && { echo ""; return; }
  local file
  file=$(ls "$FINDINGS_DIR" 2>/dev/null \
    | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}:[0-9]{2}:[0-9]{2}_tester[0-9]+_script_a\.md$' \
    | sort | tail -1) || true
  [[ -n "$file" ]] && echo "$FINDINGS_DIR/$file" || echo ""
}

# ── Walk ─────────────────────────────────────────────────────────────────────

walk() {
  local filepath="$1"
  local total
  total=$(count_unchecked "$filepath")

  if [[ "$total" -eq 0 ]]; then
    echo "No unchecked items remaining in this session — nothing to walk."
    return
  fi

  local relpath
  relpath=$(realpath --relative-to="$(pwd)" "$filepath")
  echo "Walking $relpath"
  echo "$total item(s) remaining. Answer p(ass) / f(ail) / s(kip) / q(uit) for each."
  echo ""

  local last_section="" skip_section="" answered=0 since_save=0 lineno=0

  while true; do
    mapfile -t lines < "$filepath"
    local nlines=${#lines[@]}

    local found=0 i indent="" text=""
    for (( i=lineno; i<nlines; i++ )); do
      if [[ "${lines[$i]}" =~ $CHECKBOX_RE ]]; then
        found=1
        lineno=$i
        indent="${BASH_REMATCH[1]}"
        text="${BASH_REMATCH[2]}"
        break
      fi
    done
    [[ $found -eq 0 ]] && break

    local current_section=""
    for (( j=lineno; j>=0; j-- )); do
      if [[ "${lines[$j]}" =~ $SECTION_RE ]]; then
        current_section="## ${BASH_REMATCH[1]} · ${BASH_REMATCH[2]}"
        break
      fi
    done

    if [[ -n "$current_section" && "$current_section" != "$last_section" ]]; then
      skip_section=""
      echo ""
      echo "$current_section"
      local sep_len=$(( ${#current_section} < 78 ? ${#current_section} : 78 ))
      printf '%*s\n' "$sep_len" '' | tr ' ' '-'
      last_section="$current_section"
    fi

    if [[ -n "$skip_section" && "$skip_section" == "$current_section" ]]; then
      echo ""
      echo "  $text"
      echo "  → skipped"
      replace_line "$filepath" "$(( lineno + 1 ))" "${indent}- [⏭] ${text}"
      answered=$(( answered + 1 ))
      since_save=$(( since_save + 1 ))
      if (( since_save >= 5 )); then
        save_checkpoint "$filepath"
        since_save=0
        echo "  Checkpoint saved."
      fi
      lineno=$(( lineno + 1 ))
      continue
    fi

    echo ""
    echo "  $text"

    local ans=""
    while true; do
      read -rp "  [$((answered + 1))/$total] → p/f/s/q: " ans
      ans="${ans,,}"
      [[ "$ans" == p || "$ans" == f || "$ans" == s || "$ans" == q ]] && break
      echo "  please answer p, f, s, or q"
    done
    [[ "$ans" == q ]] && break

    local sed_lineno=$(( lineno + 1 ))

    case "$ans" in
      s)
        skip_section="$current_section"
        replace_line "$filepath" "$sed_lineno" "${indent}- [⏭] ${text}"
        since_save=0
        answered=$(( answered + 1 ))
        lineno=$(( lineno + 1 ))
        ;;
      p)
        replace_line "$filepath" "$sed_lineno" "${indent}- [✅] ${text}"
        answered=$(( answered + 1 ))
        lineno=$(( lineno + 1 ))
        ;;
      f)
        local desc=""
        read -rp "  Observation (one line, blank to skip): " desc || true
        replace_line "$filepath" "$sed_lineno" "${indent}- [❌] ${text}"
        if [[ -n "$desc" ]]; then
          insert_after "$filepath" "$sed_lineno" \
            "${indent}  <span style=\"color:darkred\">${desc}</span>"
          lineno=$(( lineno + 2 ))
        else
          lineno=$(( lineno + 1 ))
        fi
        answered=$(( answered + 1 ))
        ;;
    esac

    since_save=$(( since_save + 1 ))
    if (( since_save >= 5 )); then
      save_checkpoint "$filepath"
      since_save=0
      echo "  Checkpoint saved."
    fi
  done

  save_checkpoint "$filepath"
  echo ""
  echo "Answered $answered/$total. Saved to $relpath."
}

# ── Main ─────────────────────────────────────────────────────────────────────

main() {
  local tester="" resume=false

  for arg in "$@"; do
    case "$arg" in
      --resume) resume=true ;;
      [0-9]*) tester="$arg" ;;
    esac
  done

  if $resume; then
    local latest
    latest=$(find_latest_session)
    if [[ -z "$latest" ]]; then
      echo "No previous Script A session found in $FINDINGS_DIR." >&2
      exit 1
    fi
    echo "Resuming: $(basename "$latest")"
    walk "$latest"
    return
  fi

  if [[ -z "$tester" ]]; then
    read -rp "Tester number (e.g. 1 → saved as 001): " tester
    tester="${tester// /}"
    if [[ -z "$tester" ]]; then
      echo "Tester number required." >&2
      exit 1
    fi
  fi

  tester=$(printf '%03d' "$tester")

  local filepath
  filepath=$(create_session_file "$tester")
  local relpath
  relpath=$(realpath --relative-to="$(pwd)" "$filepath")
  echo ""
  echo "Created $relpath"
  walk "$filepath"
}

main "$@"
