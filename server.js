const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();

// Render provides PORT automatically.
// Locally it will use 3000.
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing");
    process.exit(1);
}

// Gemini AI
const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

console.log("====================================");
console.log("🌱 FarmFusionAI SERVER");
console.log("====================================");
console.log("🤖 Gemini AI initialized");
console.log("====================================");

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Simple health/test endpoint
app.get("/test", (req, res) => {
    console.log("✅ TEST REQUEST RECEIVED");

    res.status(200).json({
        status: "ok",
        message: "FarmFusionAI server is working"
    });
});

// Chat endpoint
app.post("/chat", async (req, res) => {

    const { message, language } = req.body;

    console.log("\n🌱 FarmFusionAI REQUEST");
    console.log("Question:", message);

    if (!message) {
        return res.status(400).json({
            reply: "Please ask a question."
        });
    }

    try {

        console.time("Gemini response");

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
           contents: `
You are FarmFusionAI, a quick farming assistant for Kerala farmers.

Answer the farmer's question directly.

Language instruction:
${language === "ml"
    ? "Reply ONLY in Malayalam. Do not reply in English. Use simple, natural Malayalam that Kerala farmers can easily understand."
    : "Reply in simple English."}

Rules:
- Keep the answer SHORT.
- Maximum 5 bullet points.
- Give practical actions the farmer can do today.
- Do not write long explanations.
- Do not repeat the question.
- Do not use markdown headings.

Farmer's question:
${message}
`

        });

        console.timeEnd("Gemini response");

        const reply = response.text || "No response received.";

        console.log("✅ ANSWER RECEIVED");
        console.log("AI:", reply);

        return res.status(200).json({
            reply: reply
        });

    } catch (error) {

        console.error("❌ GEMINI ERROR:", error.message);

        return res.status(500).json({
            reply: "Gemini is temporarily busy. Please try again."
        });
    }
});

// IMPORTANT FOR RENDER:
// Listen on 0.0.0.0, not localhost.
app.listen(PORT, "0.0.0.0", () => {

    console.log("====================================");
    console.log("🌱 FarmFusionAI SERVER");
    console.log("====================================");
    console.log("✅ Server running");
    console.log(`🌐 Listening on 0.0.0.0:${PORT}`);
    console.log("🤖 Gemini AI ready");
    console.log("====================================");

});
