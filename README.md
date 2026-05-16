<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.



Deployed link: https://ais-pre-dudi23en744g4u5bblxwtm-481120172216.europe-west2.run.app/

## Demo Images

![Demo 1](src/public/demo_01.png)
![Demo 2](src/public/demo_02.png)

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### The Problem
Navigating Nairobi's informal matatu network is challenging due to the lack of official routing feeds and a heavy reliance on dynamic, culturally-contextual information. Commuters often struggle with complex stage aliases, unwritten rules about weather affecting fares, and unpredictable traffic patterns. Intelligence Hub solves this by acting as a deeply experienced local commuter agent, decoding the chaos to provide accurate, multi-hop routing advice complete with real-time conditions.

### Agent Architecture
- **Core Agent**: Powered by the `gemini-1.5-flash` model via the `@google/genai` SDK, acting as "The Nairobi Transit Virtuoso".
- **Knowledge Grounding**: The agent references a hardcoded `KNOWLEDGE_BASE` for static route and hub awareness.
- **Tools**: It leverages the native `googleSearch` tool and a custom server-side `get_traffic_report` tool to evaluate real-time road conditions.
- **Communication & State**: A React frontend queries an Express backend (`/api/chat`). The backend orchestrates the Gemini API calls (including function executions for tools) and maintains long-term invisible conversation memory using Firebase Firestore.

### Interacting with the Deployed Version
1. Open the application link and click **COMMUTER SIGN IN** to authenticate via Google.
2. Type in your current location and destination (e.g., *"I'm at Kencom and need to get to Roysambu"*).
3. Intelligence Hub will analyze the routes and provide structured advice: the best stage, the Matatu number/SACCO, transfer logic, and live alerts based on real-time traffic.
4. You can toggle the map view to see visualizations of major Nairobi termini (like Railways or Green Park).


## Team Members & Roles

- **Tevin** 
- **Daisy** 
- **MaryAnn** 
- **Fredrick** 
- **Sam** 

