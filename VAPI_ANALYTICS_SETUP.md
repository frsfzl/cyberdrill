# VAPI Call Analytics Setup Guide

## ✅ What's Been Created

### 1. **5 Structured Outputs in VAPI**
- ✅ Phishing Susceptibility Analysis (`6eb967cc-dc95-4a8a-974d-428fc32a11c5`)
- ✅ Red Flags Recognition (`8a1e9532-82d8-4a43-aec3-844761dcdf5b`)
- ✅ Employee Response Analysis (`3a3ba1c9-4185-428d-a66a-3fedc965301c`)
- ✅ Call Quality Metrics (`18be9ae3-e7fb-4cbd-80fb-441f1f8bccbf`)
- ✅ Training Recommendations (`f1dae41a-5a2b-4e81-a18c-00ca1bdc49ba`)

### 2. **VAPI Assistant Updated**
- ✅ All 5 structured outputs attached to assistant `ba8467db-8851-45a4-a11c-1d72e3ee5974`
- ✅ Will automatically analyze every call

### 3. **Backend Integration**
- ✅ Database migration: `supabase-migrations/add-call-analytics.sql`
- ✅ Webhook endpoint: `/api/webhooks/vapi`
- ✅ TypeScript types updated with `CallAnalytics` interface
- ✅ Display component: `CallAnalyticsCard`

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

```bash
# Copy the SQL and run it in Supabase SQL Editor
cat supabase-migrations/add-call-analytics.sql
```

Or manually run in Supabase dashboard:
```sql
ALTER TABLE interactions
ADD COLUMN IF NOT EXISTS call_transcript TEXT,
ADD COLUMN IF NOT EXISTS call_recording_url TEXT,
ADD COLUMN IF NOT EXISTS call_duration INTEGER,
ADD COLUMN IF NOT EXISTS call_analytics JSONB;

CREATE INDEX IF NOT EXISTS idx_interactions_call_analytics ON interactions USING GIN (call_analytics);
```

### Step 2: Configure VAPI Webhook

1. **Go to VAPI Dashboard**: https://dashboard.vapi.ai/assistants
2. **Click on "CyberDrill Vishing Agent"**
3. **Scroll to "Server URL" section**
4. **Enter webhook URL**: `https://YOUR_DOMAIN/api/webhooks/vapi`
   - For local dev with ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/vapi`
   - For production: `https://cyberdrill.com/api/webhooks/vapi`
5. **Save the assistant**

### Step 3: Make a Test Call

1. Create a new campaign with **VAPI delivery**
2. Make sure employee has phone number with `+1` prefix (e.g., `+19192670664`)
3. Launch the campaign
4. Answer the call and interact with the AI
5. After call ends, VAPI will send analytics to webhook (~5-10 seconds delay)

### Step 4: View Analytics

Analytics will be stored in the `interactions` table under `call_analytics` column:

```typescript
{
  "Phishing Susceptibility Analysis": {
    "fellForPhish": true,
    "suspicionLevel": "low",
    "agreedToAction": true,
    "riskLevel": "high"
  },
  "Red Flags Recognition": {
    "redFlagsIdentified": ["unverified_caller"],
    "redFlagsMissed": ["urgency_tactics", "threat_of_consequences"],
    "verificationAttempted": false
  },
  // ... more analytics
}
```

---

## 📊 Using the Analytics Component

Import and use the `CallAnalyticsCard` component:

```tsx
import { CallAnalyticsCard } from "@/components/call-analytics-card";

// In your component:
{interaction.call_analytics && (
  <CallAnalyticsCard
    analytics={interaction.call_analytics}
    callDuration={interaction.call_duration}
    recordingUrl={interaction.call_recording_url}
  />
)}
```

---

## 🧪 Testing the Webhook

### Manual webhook test (optional):
```bash
curl -X POST http://localhost:3000/api/webhooks/vapi \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "call": {
        "id": "test-call-id",
        "startedAt": "2026-02-15T00:00:00Z",
        "endedAt": "2026-02-15T00:02:00Z",
        "transcript": "Test transcript",
        "artifact": {
          "structuredOutputs": {}
        }
      }
    }
  }'
```

---

## 📈 What Gets Analyzed

After each call, AI will analyze:

1. **Susceptibility**
   - Did they fall for the phish?
   - Suspicion level
   - Risk assessment

2. **Red Flags**
   - Which warning signs they caught
   - Which they missed
   - Verification attempts

3. **Response**
   - How they responded
   - Questions asked
   - Emotional state
   - Info shared

4. **Call Quality**
   - Duration
   - Engagement
   - Naturalness
   - Outcome

5. **Training**
   - Strong points
   - Weaknesses
   - Recommended modules
   - Risk score (0-100)
   - Follow-up needed?

---

## 🔧 Troubleshooting

**Webhook not receiving events:**
- Check VAPI assistant has correct Server URL
- Verify your server is publicly accessible
- Check webhook logs: `[VAPI Webhook]` in terminal

**Analytics not showing:**
- Wait 5-10 seconds after call ends for processing
- Check `call_analytics` column in database
- Verify structured outputs are attached to assistant

**Call failed to initiate:**
- Ensure phone number has `+1` prefix for US numbers
- Check VAPI dashboard for call logs
- Verify employee phone number is valid

---

## 🎉 You're All Set!

Once configured, every VAPI call will automatically:
1. Be transcribed
2. Analyzed across 5 dimensions
3. Store results in database
4. Display detailed analytics

Check the interaction details page to see the full `CallAnalyticsCard` in action!
