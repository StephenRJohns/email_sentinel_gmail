# YouTube Video Descriptions — emAIl Sentinel

---

## 1. Configure Starter Rules in emAIl Sentinel

**Title:** Configure Starter Rules in emAIl Sentinel

**Description:**
```
Learn how to get emAIl Sentinel running in minutes using the built-in Starter Rules — pre-written AI monitoring rule templates you can activate and edit without writing anything from scratch.

In this tutorial you will learn how to:
• Open the Starter Rules section from the emAIl Sentinel sidebar
• Browse the available templates — payment issues, customer escalations, security alerts, and more
• Add one or more starter rules to your active rule list with a single tap
• Edit the added rules to pick your preferred alert channels
• Open any email and click "Evaluate this email" to put your rules to work immediately

Starter Rules are the fastest path from install to first alert. Pick the templates that match your workflow and customize from there. emAIl Sentinel reads only the email you have open, only when you click Evaluate this email — it never scans your mailbox in the background.

Step-by-step written guide:
https://drive.google.com/file/d/1oK1xBZMaEhCTMyNfKD5KW8qCjk25KR6t/view?usp=sharing

Full help documentation:
https://emailsentinel.jjjjjenterprises.com/help.html

Community discussions:
https://github.com/StephenRJohns/email_sentinel/discussions

emAIl Sentinel is coming soon to the Google Workspace Marketplace.

#emAIlSentinel #GmailAddOn #GoogleWorkspace #GmailAutomation #AIEmailMonitoring #EmailAlerts #GeminiAI #GoogleWorkspaceTips
```

---

## 2. Configure Customer Escalation Rules In emAIl Sentinel

**Title:** Configure Customer Escalation Rules In emAIl Sentinel

**Description:**
```
Learn how to create and customize AI-powered rules in emAIl Sentinel to catch customer escalations, cancellation requests, and refund inquiries in your Gmail.

In this tutorial you will learn how to:
• Open the Rules section from the emAIl Sentinel sidebar
• Write a plain-English rule description — no keywords or regex required
• Configure one or more alert channels: SMS, Google Chat, Google Calendar, Google Sheets, Google Tasks, Google Docs, or an external integration
• Save and enable your rule, then check any email against it with "Evaluate this email"

Open an email, click Evaluate this email, and the Gemini AI model checks it against your rule criteria on the spot. You describe what matters to you in plain English; emAIl Sentinel does the rest — it reads only the email you have open, only when you click Evaluate this email, and never scans your mailbox in the background.

Step-by-step written guide:
https://drive.google.com/file/d/1_bCyLgw-4UI4DOanq4d0VxinmF6F9Y8j/view?usp=sharing

Full help documentation:
https://emailsentinel.jjjjjenterprises.com/help.html

Community discussions:
https://github.com/StephenRJohns/email_sentinel/discussions

emAIl Sentinel is coming soon to the Google Workspace Marketplace.

#emAIlSentinel #GmailAddOn #GoogleWorkspace #CustomerEscalation #AIEmailMonitoring #EmailAlerts #GeminiAI #GmailAutomation
```

---

## 3. Evaluate An Email On Demand In emAIl Sentinel

> **OUTDATED (2026-07-26):** the recorded video shows the old scheduled-scan / "Scan email now" flow — re-record on the contextual-only build before upload. Description below is already rewritten for the new flow.

**Title:** Evaluate An Email On Demand In emAIl Sentinel

**Description:**
```
Learn how to evaluate any open email against your rules on demand and review the activity log in emAIl Sentinel — the AI-powered email alerting add-on for Google Workspace.

In this tutorial you will learn how to:
• Open an email and find emAIl Sentinel's "Evaluate this email" button in the side panel
• Run an on-demand evaluation — every enabled rule is checked against the open message
• Read the Evaluation result card, with a per-rule match or no-match verdict and the AI's reasoning
• Review the activity log to confirm that rules evaluated correctly and alerts were dispatched

emAIl Sentinel reads only the email you have open, only when you click Evaluate this email — it never scans your mailbox in the background. For always-on, real-time monitoring, see the separate self-hosted emAIl Sentinel Pro at https://jjjjjenterprises.com/emailsentinel/pro.

Step-by-step written guide:
https://drive.google.com/file/d/15x8a0Y90KYB5Bozoy7SjxmgcXpM7iOA1/view?usp=sharing

Full help documentation:
https://emailsentinel.jjjjjenterprises.com/help.html

Community discussions:
https://github.com/StephenRJohns/email_sentinel/discussions

emAIl Sentinel is coming soon to the Google Workspace Marketplace.

#emAIlSentinel #GmailAddOn #GoogleWorkspace #GmailAutomation #AIEmailMonitoring #EmailScanning #GoogleWorkspaceTips
```

---

## 4. Configure Google Chat Integration in emAIl Sentinel

**Title:** Configure Google Chat Integration in emAIl Sentinel

**Description:**
```
Learn how to send AI-generated email alerts directly to a Google Chat space using emAIl Sentinel — the Gmail monitoring add-on for Google Workspace.

In this tutorial you will learn how to:
• Navigate to the Google Chat section in emAIl Sentinel Settings
• Create an incoming webhook in your Google Chat space
• Add the webhook URL and a display name in emAIl Sentinel
• Attach your Chat space to a rule as an alert destination
• Verify that alert messages post to your Chat space when an evaluated email matches

When you click "Evaluate this email" on an open message and it matches a rule, emAIl Sentinel generates a plain-English alert summary using the Gemini AI model and posts it directly to your configured Chat space.

Step-by-step written guide:
https://drive.google.com/file/d/1zcq3VPEwUMFxjLU1E50tPxuKBq3s6oiW/view?usp=sharing

Full help documentation:
https://emailsentinel.jjjjjenterprises.com/help.html

Community discussions:
https://github.com/StephenRJohns/email_sentinel/discussions

emAIl Sentinel is coming soon to the Google Workspace Marketplace.

#emAIlSentinel #GoogleChat #GmailAddOn #GoogleWorkspace #AIEmailMonitoring #ChatAlerts #GeminiAI #GoogleWorkspaceTips
```

---

## 5. Configure emAIl Sentinel Integration With Cloudflare MCP

**Title:** Configure emAIl Sentinel Integration With Cloudflare MCP

**Description:**
```
Learn how to connect emAIl Sentinel to any MCP-compatible tool — Asana, Microsoft Teams, your own internal systems, or any service that exposes an MCP server — using a free Cloudflare Workers deployment. No OAuth flow, no bot tokens: approximately 40 lines of JavaScript and a free Cloudflare account.

In this tutorial you will learn how to:
• Understand how the Model Context Protocol (MCP) works as an open standard for AI-to-tool communication
• Copy the ready-to-deploy Worker code from the emAIl Sentinel Help card
• Deploy the Cloudflare Workers MCP server (Cloudflare Workers are free, with no expiring credentials)
• Add the deployed server URL to emAIl Sentinel's External Integrations settings
• Configure a rule to call your MCP server tool when an evaluated email matches
• Test the integration end to end

MCP is the same open protocol used by Claude Desktop, Cursor, and other AI agent frameworks. emAIl Sentinel speaks it natively, so evaluating a matching email can trigger any tool that exposes an MCP server. The Cloudflare Worker in this video is the simplest starting point; you can point emAIl Sentinel at any MCP server you need once you understand the pattern.

External integrations are free for everyone — like every alert channel in emAIl Sentinel.

Learn more about MCP:
https://modelcontextprotocol.io/docs/getting-started/intro

Step-by-step written guide:
https://drive.google.com/file/d/13yLdfmdsr0N9UBFo7K1hVyO-9WywU8qb/view?usp=sharing

External integrations help documentation:
https://emailsentinel.jjjjjenterprises.com/help.html#channels

Community discussions:
https://github.com/StephenRJohns/email_sentinel/discussions

emAIl Sentinel is coming soon to the Google Workspace Marketplace.

#emAIlSentinel #MCP #ModelContextProtocol #CloudflareWorkers #GmailAddOn #GoogleWorkspace #AIEmailMonitoring #EmailAutomation #GeminiAI
```

---

## Upload checklist

- [ ] Category: **Science & Technology**
- [ ] Visibility: Public (or Unlisted until Marketplace review is complete)
- [ ] Playlist: create an "emAIl Sentinel Tutorials" playlist and add all five
- [ ] Thumbnail: use the Guidde cover frame (purple envelope + "AI Email Monitoring" wordmark) — consistent branding across all five
- [ ] Pin a comment on each video with the PDF link and help page link for quick access
