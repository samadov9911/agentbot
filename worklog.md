---
Task ID: 1
Agent: main
Task: Integrate Vapi.ai for real AI voice calls in "Звонки клиентам"

Work Log:
- Read and analyzed existing fake call implementation (CallScriptDialog, CallHistoryDialog, /api/calls)
- Updated Prisma schema: added vapiApiKey, vapiPhoneId, vapiPhone to User model; callType, vapiCallId, cost to CallLog
- Generated Prisma client
- Created /api/vapi/settings/route.ts (GET/POST/DELETE) for managing Vapi API key & phone number
- Rewrote /api/calls/route.ts to make real calls via Vapi.ai REST API with proper system prompts per call type
- Created /api/vapi/webhook/route.ts for receiving Vapi call status updates (transcript, summary, duration, cost)
- Completely redesigned CallScriptDialog with Vapi integration:
  - VapiSettingsDialog for API key & phone number configuration
  - Call type selection cards (confirmation, reminder, follow_up, custom)
  - Client phone input only (company phone from Vapi settings)
  - Connection status indicator
  - Real-time call status display
- Updated CallHistoryDialog with call type badges, status colors, and cost display
- Updated capabilities card text ("Позвонить" button, "Vapi.ai" badge)
- Fixed unused variable (loadingSettings)
- Ran lint — clean
- Pushed as commit 9e48d57

Stage Summary:
- Vapi.ai is fully integrated for real AI voice calls
- Customer configures their own Vapi API key and phone number
- 4 call types: confirmation, reminder, follow-up, custom
- Webhook endpoint receives transcript, summary, duration, cost from Vapi
- Each customer pays Vapi directly (no telephony costs on our side)
- Next: customer needs to set up Vapi account, get API key, buy phone number, configure in settings

---
Task ID: 2
Agent: main
Task: Implement real lead generation campaigns with email + AI calls in "Привлечение клиентов"

Work Log:
- Analyzed existing LeadGenerationDialog: it was fake (setTimeout 2000ms), no real email/call sending
- Company data was entered manually each time despite being in DB (user.company, user.vapiPhone, user.emailFrom)
- Created /api/lead-campaign/route.ts — real campaign API:
  - Sends emails via Resend with company-branded HTML template
  - Initiates AI calls via Vapi with campaign-specific system prompt
  - Supports 3 recipient modes: all clients, manual phones, manual emails
  - Returns real results: emailsSent, emailsFailed, callsInitiated, callsFailed
- Rewrote LeadGenerationDialog completely:
  - Step 1: Loads company data from /api/user-settings and /api/vapi/settings (no manual input)
  - Two channel toggles: Email (via Resend) + AI Calls (via Vapi)
  - Vapi configuration status shown with warning if not set up
  - Three recipient modes with appropriate inputs
  - Step 2: Confirmation screen with full campaign parameters summary
  - Step 3: Real results with stats cards, error list
- Updated card description and badge to reflect real functionality
- Fixed syntax error in lead-campaign route (missing closing parenthesis)
- Lint clean, pushed as commit 39e75b8

Stage Summary:
- Lead generation is now fully functional with real email + AI call capabilities
- Company name, email, phone auto-loaded from user profile & Vapi settings
- Each customer acts under their own brand identity
- Two independent channels: email through Resend, calls through Vapi
- Campaign results tracked in AnalyticsEvent

