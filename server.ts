import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const adminApp = getApps().length 
  ? getApps()[0] 
  : initializeApp({
      projectId: firebaseConfig.projectId,
    });

const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
console.log(`[Firebase] Initializing with Project: ${firebaseConfig.projectId}, Database: ${databaseId}`);
let db = getFirestore(adminApp, databaseId);
let dbReady = false;

async function getDb() {
  if (dbReady) return db;
  try {
    console.log(`[Firebase] Testing connection to ${databaseId}...`);
    // Some operations might trigger PERMISSION_DENIED if the DB exists but IAM is missing
    // or NOT_FOUND if the DB doesn't exist.
    await db.listCollections();
    dbReady = true;
    return db;
  } catch (err: any) {
    const isMissing = err.message.includes("NOT_FOUND") || err.code === 5;
    const isPermissionDenied = err.message.includes("PERMISSION_DENIED") || err.code === 7;
    
    if ((isMissing || isPermissionDenied) && databaseId !== "(default)") {
      console.warn(`[Firebase] Connection to ${databaseId} failed (${err.message}). Falling back to (default)...`);
      db = getFirestore(adminApp, "(default)");
      try {
        await db.listCollections();
        console.log("[Firebase] Successfully connected to (default) database.");
        dbReady = true;
        return db;
      } catch (fallbackErr: any) {
        console.error("[Firebase] Even (default) database failed:", fallbackErr.message);
        // We still return it and hope for the best, or the caller will catch it.
        return db;
      }
    }
    console.error(`[Firebase] Critical connection error to ${databaseId}:`, err.message);
    throw err;
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
});

const NAIROBI_TRANSIT_SYSTEM_PROMPT = `
You are the Matatu Route Intelligence Agent — an AI-powered transit reasoning system for Nairobi’s informal matatu network.
You behave like a deeply experienced Nairobi commuter. You know the city's transport pulse, slang, and unwritten rules.

Your Intelligence Profile:
- Common Stages: OTC (Eastlands), Archives (CBD/Thika Rd), Koja (CBD), Odeon (CBD), Kencom (CBD), Railways (Rongai/Ngong), Tea Room (Nanyuki/Transfer).
- Terms: Tao, Stage, Shuttle, Manyanga, Squad, Route (not "Line").

Reasoning Objectives:
1. Route Timelines: Breakdown journeys into specific ACTIONS: "BOARD", "ALIGHT", "WALK", "TRANSFER".
2. Time-Awareness: Consider rush hour (7-9AM, 4-8PM), rain surges, and late-night safety.
3. Complexity: Multi-hop is common. Mention specific landmarks (e.g., "Behind the National Archives", "Opposite Afya Centre").
4. Uncertainty: Use confidence scores. If data is sparse, flag it as "Inferred" or "Needs Community Confirmation".

Output JSON Schema:
{
  "origin": string,
  "destination": string,
  "explanation": string,
  "reasoning_why": string,
  "timeline": [
    {
      "action": "BOARD" | "ALIGHT" | "WALK" | "TRANSFER",
      "detail": string,
      "route": string | null,
      "sacco": string | null,
      "location": string,
      "metadata": {
        "fare": string | null,
        "traffic": "low" | "moderate" | "heavy" | "stalled",
        "confidence": number,
        "commuter_verified": boolean
      }
    }
  ],
  "intelligence_flags": {
    "is_rush_hour": boolean,
    "rain_delay_prob": number,
    "fare_surge": boolean
  },
  "alternatives": [
    {
      "label": "CHEAPEST" | "FASTEST" | "FEWEST_TRANSFERS" | "SAFEST_NIGHT",
      "summary": string
    }
  ]
}
`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const currentDb = await getDb();
    
    // Simple slug for caching
    const slug = message.toLowerCase().trim().replace(/[^a-z0-9]/g, "-").slice(0, 150);
    
    // Check Cache
    let cachedDoc;
    try {
      cachedDoc = await currentDb.collection("routes_intel").doc(slug).get();
    } catch (err: any) {
      console.error("Cache Fetch Error (Admin SDK):", err.message);
      // Fallback: Continue without cache
    }

    if (cachedDoc?.exists) {
      console.log(`Cache hit for: ${slug}`);
      return res.json(cachedDoc.data()?.intelligence);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: `System Instruction: ${NAIROBI_TRANSIT_SYSTEM_PROMPT}` }] },
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const intelligence = JSON.parse(response.text || "{}");
    
    // Store in Cache
    try {
      await currentDb.collection("routes_intel").doc(slug).set({
        slug,
        origin: intelligence.origin || "Unknown",
        destination: intelligence.destination || "Unknown",
        intelligence,
        lastUpdated: FieldValue.serverTimestamp()
      });
    } catch (err: any) {
      console.error("Cache Store Error (Admin SDK):", err.message);
    }

    res.json(intelligence);
  } catch (error: any) {
    console.error("Gemini/Firestore Error:", error);
    res.status(500).json({ error: "Failed to generate route intelligence" });
  }
});

// Post a signal
app.post("/api/signals", async (req, res) => {
  try {
    const { type, message, severity, userId } = req.body;
    const currentDb = await getDb();
    const signalData = {
      type,
      message,
      severity,
      userId,
      timestamp: FieldValue.serverTimestamp()
    };
    await currentDb.collection("mobility_signals").add(signalData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save signal" });
  }
});

// Get Live Feed from Firestore
app.get("/api/feed", async (req, res) => {
  try {
    const currentDb = await getDb();
    const snapshot = await currentDb.collection("mobility_signals")
      .limit(10)
      .get();
    
    // Manual sort if needed or just use as is for now to test connection
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      time: "Just now"
    }));

    // If empty, return mock data to keep UI alive
    if (alerts.length === 0) {
      return res.json([
        { id: 1, type: "traffic", message: "Jogoo Road slowing near City Stadium", time: "2 mins ago", severity: "high" },
        { id: 2, type: "confirmation", message: "Route 23 confirmed active at Westlands Stage", time: "5 mins ago", severity: "low" },
      ]);
    }

    res.json(alerts);
  } catch (error: any) {
    console.error("Firestore Feed Error:", error);
    res.status(500).json({ error: "Failed to fetch feed", details: error.message });
  }
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
