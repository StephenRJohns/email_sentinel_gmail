# findings/ — per-round triage docs and summaries

**Committed.** This directory and its contents go into git as the durable record of each round.

## What goes here

Per-round triage docs and summaries derived from watching the recordings. **No PII** — these files capture summarized findings, severity, fix status, and the developer's analysis. Verbatim tester quotes are OK if they're short and don't identify the speaker.

## Convention

```
findings/
├── round_001_<YYYY-MM-DD>_findings.md   # filled-in triage table
├── round_001_summary.md                  # post-round summary, action items
├── round_002_<YYYY-MM-DD>_findings.md
├── round_002_summary.md
└── …
```

Round numbers are always 3 digits, zero-padded (`round_001` … `round_010` … `round_100`) — matches the format the preflight scripts produce so directory listings sort correctly.

The date in the findings filename is the start date of the triage pass (when you copy the template), not the date sessions completed.

## How to start a new round's findings file

```bash
cp ../docs/triage_template.md round_$(printf '%03d' N)_$(date +%Y-%m-%d)_findings.md
```

Replace `N` with the round number (the `printf '%03d'` zero-pads it to 3 digits). Then open the new file and fill in the table as you watch each recording.

## Round summary

After all recordings for a round are watched and the findings file is complete, write a `round_NNN_summary.md` that captures:

- Number of sessions completed vs abandoned
- Top 3 critical issues (by tester count)
- Most-quoted pain point
- "Would you pay $4.99/month?" yes-rate
- Fix list with target dates / commit SHAs as fixes ship
- Cost spent on the round

Both files are committed because they're the durable, auditable artifact of each round — useful for: picking up a stalled round later, comparing Round N to Round N+1, justifying scope decisions during Marketplace review, and demonstrating user research effort if a launch metric like the Workspace Marketplace listing's "Beta tested with N users" claim ever needs evidence.
