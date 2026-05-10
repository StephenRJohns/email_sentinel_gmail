#!/usr/bin/env bash
# Step 2a — Enable Google Workspace Marketplace SDK on the Apps Script linked project.
#
# Usage:
#   bash tools/preflight/step2a_enable_sdk.sh                        # prompts
#   bash tools/preflight/step2a_enable_sdk.sh MY-APPS-SCRIPT-PROJECT
#
# The PROJECT_ID is the GCP project linked to the email_sentinel Apps Script
# project — find it in the Apps Script editor under Project Settings →
# Google Cloud Platform (GCP) Project. NOT the sandbox project from step 1.
#
# This only handles the gcloud parts. Steps 2b–2e (App Configuration, Store
# Listing, OAuth consent, install URL) require manual work in Cloud Console.

set -euo pipefail

PROJECT_ID="${1:-}"
if [[ -z "$PROJECT_ID" ]]; then
  echo "Find your project ID in the Apps Script editor:"
  echo "  Project Settings → Google Cloud Platform (GCP) Project → Project number / ID"
  echo ""
  read -rp "GCP project ID linked to email_sentinel Apps Script: " PROJECT_ID
fi

echo "============================================================"
echo "  Step 2a — Enable Marketplace SDK"
echo "  Project: $PROJECT_ID"
echo "============================================================"
echo ""

echo "Enabling Google Workspace Marketplace SDK..."
gcloud services enable appsmarket.googleapis.com --project="$PROJECT_ID"
echo "  Done."

echo ""
echo "============================================================"
echo "  Automated part complete. Manual steps remaining in Cloud Console:"
echo ""
echo "  Open: https://console.cloud.google.com/apis/api/appsmarket.googleapis.com/googleapps?project=$PROJECT_ID"
echo ""
echo "  2b. APP CONFIGURATION tab — fill in:"
echo "      App name, icon, banner, screenshots"
echo "      OAuth scopes (must match appsscript.json exactly)"
echo "      Developer name, ToS URL, Privacy URL"
echo ""
echo "  2c. STORE LISTING tab — fill in:"
echo "      Short description, category"
echo "      Regions: United States only"
echo "      Language: English"
echo ""
echo "  2d. OAuth consent screen:"
echo "      APIs & Services → OAuth consent screen"
echo "      → Publish App (moves from Testing → In Production)"
echo "      This allows external Google accounts to install (with the"
echo "      unverified-app warning) up to a 100-user cap."
echo ""
echo "  2e. Get the install URL:"
echo "      Back in Marketplace SDK → APP CONFIGURATION or OVERVIEW"
echo "      → look for 'Install URL' or 'Direct install link'."
echo "      Save this URL — it goes into step4b_fill_scripts.sh."
echo ""
echo "  2f. Validate the install URL:"
echo "      Open it in an Incognito window signed into a non-dev Google"
echo "      account. Accept the unverified-app consent. Reload Gmail."
echo "      Confirm the emAIl Sentinel icon appears in the right rail."
echo "============================================================"
