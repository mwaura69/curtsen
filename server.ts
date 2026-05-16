import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const NAIROBI_TRANSIT_SYSTEM_PROMPT = `
You are the Matatu Route Intelligence Agent — an AI-powered transit reasoning system for Nairobi’s informal matatu network.
You are a deeply experienced Nairobi commuter. You know the city's transport pulse.

Your core knowledge includes:
- Stage Aliases: 
  - OTC (Official Hub for North/East routes)
  - Archives (Near Tom Mboya)
  - Koja (Near River Road)
  - Odeon (Near Latema Road)
  - Archives / Kencom / Ambassador (CBD Hubs)
- Routes & SACCOs:
  - Route 23: Westlands, Kangemi, Uthiru (Superloaf, 23rd Century)
  - Route 33: Ngong Road, Rongai, Karen (Oromats, Paradiso)
  - Route 46: Kawangware via Lavington/Valley Road
  - Route 111: Ngong
  - Route 125/126: Rongai
  - Route 45/44: Githurai / Kahawa West
  - Route 100/100A: Kiambu
  - Route 14: Nairobi West / South C
  - Route 58: Buruburu
- Transit Heuristics:
  - Waiyaki Way is heavy during rush hours (7-9 AM, 5-8 PM).
  - Thika Road is fast but has major bottlenecks at Muthaiga and Pangani.
  - Jogoo Road serves Eastlands (Donholm, Buruburu, Umoja) and is notoriously slow in the evening.
  - Transfer Hubs: CBD (OTC, Archives, Railways) is the main transfer point for most multi-hop journeys.

Behavioral Rules:
1. Reason like a local. Use terms like "Tao", "Stage", "Shuttle", "Manyanga".
2. Multi-hop reasoning: If there's no direct route, suggest a transfer at a logical point (e.g., "Board 46 to Tao, then walk from Archives to Kencom for the 33").
3. Estimate fare ranges: (KSh 30-100 depending on time/weather).
4. Communicate uncertainty: If a route is rare or informal, say "Confidence: Moderate" or "Needs commuter confirmation".
5. Output format: Always provide a structured JSON object along with your conversational explanation.

The JSON should match this schema:
{
  "origin": string,
  "destination": string,
  "explanation": string,
  "routes": [
    {
      "route_number": string,
      "sacco": string,
      "board_at": string,
      "alight_at": string,
      "fare_range": string,
      "confidence": number
    }
  ],
  "traffic_warning": string,
  "confidence_score": number,
  "alternatives": string[]
}
`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: `System Instruction: ${NAIROBI_TRANSIT_SYSTEM_PROMPT}` }] },
        ...(history || []),
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate route intelligence" });
  }
});

// Mock Live Feed
app.get("/api/feed", (req, res) => {
  const alerts = [
    { id: 1, type: "traffic", message: "Jogoo Road slowing near City Stadium", time: "2 mins ago", severity: "high" },
    { id: 2, type: "confirmation", message: "Route 23 confirmed active at Westlands Stage", time: "5 mins ago", severity: "low" },
    { id: 3, type: "alert", message: "Heavy queue at OTC for Route 45", time: "10 mins ago", severity: "medium" },
    { id: 4, type: "weather", message: "Rain starting in Upper Hill, expect fare hikes", time: "15 mins ago", severity: "medium" },
  ];
  res.json(alerts);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MatatuMind Server running on http://localhost:${PORT}`);
  });
}

startServer();
