const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

console.log("====================================");
console.log("🌱 KRISHIAI SERVER");
console.log("====================================");
console.log("🤖 Gemini AI initialized");
console.log("====================================");

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/test", (req, res) => {
    console.log("✅ TEST REQUEST RECEIVED");

    res.json({
        status: "ok",
        message: "KrishiAI server is working"
    });
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  console.log("\n🌱 KRISHIAI REQUEST");
  console.log("Question:", message);

  if (!message) {
      return res.status(400).json({
          reply: "Please ask a question."
      });
  }

  try {
      console.time("Gemini response");

      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `
    You are KrishiAI, a quick farming assistant for Kerala farmers.
    
    Answer the farmer's question directly.
    Keep the answer SHORT: maximum 5 bullet points.
    Use simple English.
    Give practical actions the farmer can do today.
    Do not write long explanations.
    Do not repeat the question.
    Do not use markdown headings.
    
    Farmer's question:
    ${message}
    `
    });

      console.timeEnd("Gemini response");

      const reply = response.text || "No response received.";

      console.log("✅ ANSWER RECEIVED");
      console.log("AI:", reply);

      return res.json({ reply });

  } catch (error) {
      console.error("❌ GEMINI ERROR:", error.message);

      return res.status(500).json({
          reply: "Gemini is temporarily busy. Please try again."
      });
  }
});

app.listen(PORT, () => {

    console.log("====================================");
    console.log("🌱 KRISHIAI SERVER");
    console.log("====================================");
    console.log("✅ Server running");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("🤖 Gemini AI ready");
    console.log("====================================");

});