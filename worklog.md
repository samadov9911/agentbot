---
Task ID: 1
Agent: Main
Task: Fix 4 bugs in agentbot project

Work Log:
- Cloned repo and analyzed project structure
- Identified all 4 bugs and their root causes

Stage Summary:
- Bug 1: Analytics API uses `{u}` instead of `{userId: u}` in bot query + Overview reads `totalConversations`/`totalAppointments` but API returns `stats.conversationsToday`/`stats.appointmentsToday`
- Bug 2: bot-demo-chat creates Lead records but NO Conversation records - dialog list reads from Conversation model
- Bug 3: bookings/route.ts has duplicate GET export concatenated at line 548 causing syntax errors
- Bug 4: Lead deduplication falls back to IP which merges different clients with same IP; should use sessionId
