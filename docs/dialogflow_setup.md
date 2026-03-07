# Dialogflow ES Setup Guide
## Somerset Mirissa Beach Hotel — IHMS Chatbot

---

## 1. GCP Project Setup

### Step 1 — Create GCP Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Name: `somerset-mirissa-ihms`
4. Click **Create**

### Step 2 — Enable Dialogflow API
1. Go to **APIs & Services** → **Library**
2. Search for "Dialogflow API"
3. Click **Enable**

### Step 3 — Create Service Account (for webhook authentication)
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `dialogflow-webhook`
4. Role: `Dialogflow API Client`
5. Click **Create Key** → JSON → download the file
6. Base64 encode it: `base64 < service-account.json | tr -d '\n'`
7. Set as `GOOGLE_APPLICATION_CREDENTIALS_JSON` in your `.env`

---

## 2. Dialogflow ES Agent Setup

### Step 4 — Create Agent
1. Go to [dialogflow.cloud.google.com](https://dialogflow.cloud.google.com)
2. Click **Create Agent**
3. **Agent name:** Somerset Concierge
4. **Default language:** English (en)
5. **Default timezone:** Asia/Colombo
6. **Google Project:** somerset-mirissa-ihms
7. Click **Create**

### Step 5 — Enable Fulfillment (Webhook)
1. In left sidebar → **Fulfillment**
2. Toggle **Webhook** to **Enabled**
3. **URL:** `https://your-backend.railway.app/api/webhook/dialogflow`
4. Click **Save**

---

## 3. Building Intents

### Intent 1: check.availability
**Training phrases:**
- "Are rooms available for January 5 to 10?"
- "I want to book from March 15 to March 20"
- "Do you have rooms for next weekend?"
- "Check availability for 3 nights starting Monday"

**Parameters:**
- `check-in` (sys.date)
- `check-out` (sys.date)

**Fulfillment:** Enable webhook call

---

### Intent 2: room.info
**Training phrases:**
- "Tell me about your suites"
- "What amenities do deluxe rooms have?"
- "What's included in the standard room?"
- "Describe your rooms"

**Fulfillment:** Static responses (no webhook)
**Responses:**
- "We have three room categories: Standard (LKR 25,000/night), Deluxe (LKR 40,000/night), and Suite (LKR 65,000/night). All rooms feature air conditioning, free Wi-Fi, and daily housekeeping."

---

### Intent 3: booking.make
**Training phrases:**
- "I want to book a deluxe room"
- "Book me a suite for 3 nights"
- "Make a reservation"
- "How do I book a room?"

**Parameter:** `room-type` (sys.any)
**Fulfillment:** Enable webhook call

---

### Intent 4: booking.status
**Training phrases:**
- "What's the status of my booking?"
- "Check my reservation ABC123XYZ789"
- "I have confirmation code XYZ"
- "Is my booking confirmed?"

**Parameter:** `confirmation-code` (sys.any)
**Fulfillment:** Enable webhook call

---

### Intent 5: booking.cancel
**Training phrases:**
- "I want to cancel my reservation"
- "Cancel booking ABC123"
- "How do I cancel?"

**Parameter:** `confirmation-code` (sys.any)
**Fulfillment:** Enable webhook call

---

### Intent 6: faq.checkin
**Training phrases:**
- "What time is check-in?"
- "When can I check in?"
- "Check-out time"
- "What are your check-in and check-out times?"

**Responses (static):**
- "Check-in is from 2:00 PM. Check-out is by 11:00 AM. Early check-in may be arranged subject to availability — please mention it in your booking notes."

---

### Intent 7: faq.location
**Training phrases:**
- "Where is the hotel?"
- "How do I get to Somerset?"
- "What's your address?"
- "Location"

**Responses (static):**
- "Somerset Mirissa Beach Hotel is located on Mirissa Beach, Southern Province, Sri Lanka. We are 150km south of Colombo and 15km from Matara. GPS: 5.9478° N, 80.4622° E."

---

### Intent 8: faq.price
**Training phrases:**
- "How much per night?"
- "What are your rates?"
- "Room prices"
- "Cost of staying"

**Responses (static):**
- "Our room rates per night: Standard — LKR 25,000 (up to 2 guests), Deluxe — LKR 40,000 (up to 3 guests, sea view), Suite — LKR 65,000 (up to 4 guests, private plunge pool). All rates are inclusive of breakfast."

---

### Intent 9: Default Fallback
*(Pre-built — modify response)*
- "I'm not sure I understand. You can ask me about room availability, prices, check-in times, or your booking status. For other queries, please call us at +94 41 225 9999 or email info@somersetmirissa.com."

---

## 4. Frontend Integration

### Option A — Dialogflow Messenger (Recommended)

Add to `.env`:
```
VITE_DIALOGFLOW_PROJECT_ID=somerset-mirissa-ihms
VITE_DIALOGFLOW_AGENT_ID=your-agent-id-from-dialogflow
```

The `ChatWidget.tsx` component loads the Dialogflow Messenger script automatically when these env vars are set.

### Get Agent ID
1. In Dialogflow Console → Settings (gear icon)
2. **General** tab → copy the **Agent ID** (not the project ID)

---

## 5. Testing the Webhook Locally

Use ngrok for local development:
```bash
# Terminal 1 — start backend
cd backend && uvicorn app.main:app --reload

# Terminal 2 — expose with ngrok
ngrok http 8000
```

Copy the ngrok HTTPS URL → update in Dialogflow Fulfillment settings.

---

## 6. Deployed Webhook URL

Once deployed to Railway:
```
https://somerset-ihms.railway.app/api/webhook/dialogflow
```

Update this in Dialogflow Fulfillment settings before going live.
