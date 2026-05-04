#!/usr/bin/env bash
# Sequential Cypress spec runner — stops on first failure.
# Usage: ./run-sequential.sh
# Prints: [N/TOTAL] Running: <spec>  then  ✓ PASS or ✗ FAIL

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Spec list (ordered from fastest/most stable to slowest) ──────────────────
SPECS=(
  "cypress/e2e/system/logger.cy.js"
  "cypress/e2e/system/mediaUrlValidation.cy.js"
  "cypress/e2e/system/publishProject.cy.js"
  "cypress/e2e/blockBuilder/css-injection-scoping.cy.js"
  "cypress/e2e/blockBuilder/quick-save-version-rendering.cy.js"
  "cypress/e2e/blockBuilder/save-dialog.cy.js"
  "cypress/e2e/blockBuilder/tab-selection.cy.js"
  "cypress/e2e/blockBuilder/undo-history-floor.cy.js"
  "cypress/e2e/blockBuilder/tree-view-hierarchy.cy.js"
  "cypress/e2e/blockBuilder/css-gui.cy.js"
  "cypress/e2e/blockBuilder/content-tab-lexical-editor.cy.js"
  "cypress/e2e/blockBuilder/block-builder.cy.js"
  "cypress/e2e/aiAssistant/ai-router-mutation-flow.cy.js"
  "cypress/e2e/aiAssistant/ai-assistant-panel.cy.js"
  "cypress/e2e/aiAssistant/ai-inline-streaming-smoke.cy.js"
  "cypress/e2e/aiAssistant/ai-intent-confirmation-flow.cy.js"
  "cypress/e2e/aiAssistant/ai-3phase-flow.cy.js"
  "cypress/e2e/login/login.cy.js"
  "cypress/e2e/signUp/singup.cy.js"
  "cypress/e2e/forgotPassword/forgotPassword.cy.js"
  "cypress/e2e/continueAsGuest/continueAsGuest.cy.js"
  "cypress/e2e/homePage/homepage.cy.js"
  "cypress/e2e/accountPage/account.cy.js"
  "cypress/e2e/billing/billing.cy.js"
  "cypress/e2e/effects/effects.cy.js"
  "cypress/e2e/videoBackground/videoBackground.cy.js"
  "cypress/e2e/inlineEditor/inlineEditor.cy.js"
  "cypress/e2e/interactions/interactions.cy.js"
  "cypress/e2e/localization/localization.cy.js"
  "cypress/e2e/abTesting/ab-testing.cy.js"
)

TOTAL=${#SPECS[@]}
PASSED=0
FAILED=0
FAIL_SPEC=""
FAIL_REASON=""

echo ""
echo -e "${CYAN}============================================================${RESET}"
echo -e "${CYAN}  Blinkpage Cypress Sequential Runner — ${TOTAL} specs${RESET}"
echo -e "${CYAN}============================================================${RESET}"
echo ""

for i in "${!SPECS[@]}"; do
  SPEC="${SPECS[$i]}"
  IDX=$((i + 1))
  echo -e "${CYAN}[${IDX}/${TOTAL}] Running: ${SPEC}${RESET}"

  # Run spec and capture output + exit code
  OUTPUT_FILE=$(mktemp /tmp/cypress_output_XXXXXX.log)

  set +e
  npx cypress run --spec "$SPEC" --headless 2>&1 | tee "$OUTPUT_FILE"
  EXIT_CODE=${PIPESTATUS[0]}
  set -e

  if [ "$EXIT_CODE" -eq 0 ]; then
    echo -e "  ${GREEN}✓ PASS${RESET}"
    PASSED=$((PASSED + 1))
    rm -f "$OUTPUT_FILE"
  else
    # Extract the failure reason from the output
    FAIL_REASON=$(grep -E "(AssertionError|Error:|failing|CypressError|expected)" "$OUTPUT_FILE" | head -5 || echo "See output above")
    echo -e "  ${RED}✗ FAIL — ${SPEC}${RESET}"
    echo -e "  ${YELLOW}Failure summary:${RESET}"
    echo "$FAIL_REASON" | while IFS= read -r line; do
      echo "    $line"
    done
    FAILED=$((FAILED + 1))
    FAIL_SPEC="$SPEC"
    rm -f "$OUTPUT_FILE"

    echo ""
    echo -e "${RED}============================================================${RESET}"
    echo -e "${RED}  STOPPED on first failure.${RESET}"
    echo -e "${RED}  Spec: ${FAIL_SPEC}${RESET}"
    echo -e "${RED}  Passed so far: ${PASSED}${RESET}"
    echo -e "${RED}============================================================${RESET}"
    exit 1
  fi

  echo ""
done

echo -e "${GREEN}============================================================${RESET}"
echo -e "${GREEN}  All ${TOTAL} specs passed.  ✓${RESET}"
echo -e "${GREEN}============================================================${RESET}"
