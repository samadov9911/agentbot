---
## Task ID: 1
Agent: full-stack-developer
Task: Fix 3 bugs in ai-agent-page.tsx

### Work Task
Fix 3 bugs: (1) EmailComposerDialog client checklist for new/specific clients, (2) CallScriptDialog 2-step AI agent call rewrite, (3) LeadGenerationDialog 3-step goal/contacts form rewrite.

### Work Summary

**Imports added:** Checkbox from @/components/ui/checkbox, Label from @/components/ui/label.

**Bug 1 — EmailComposerDialog:** Added MOCK_CLIENTS (8 clients), selectedClients state, date range filter state. When recipientType=new: scrollable checklist of isNew clients with select/deselect all and count badge. When recipientType=specific: date range filter then filtered checklist. Each item shows name, email, formatted date.

**Bug 2 — CallScriptDialog:** Replaced with 2-step version. Step 1: task description textarea, client phone, company phone with AI note, generate script button. Step 2: editable script, call info summary, "Call from [company phone]" button. Step indicator and back navigation.

**Bug 3 — LeadGenerationDialog:** Replaced with 3-step version. Step 1: goal textarea, client phone, email. Step 2: AI email draft preview, approval mode radio (auto/manual). Step 3: success message, email preview, summary card. Step indicators and navigation.

**Lint fix:** Moved setState calls from useEffect to handleDialogClose callback to fix react-hooks/set-state-in-effect error.

**All existing components left untouched. Zero lint errors. Dev server compiles successfully.**
