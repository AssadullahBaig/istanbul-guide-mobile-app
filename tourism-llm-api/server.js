import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "dummy_key");
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key",
});

// Initialize Groq client (using OpenAI SDK)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key",
  baseURL: "https://api.groq.com/openai/v1",
});

// Initialize Pollinations client (using OpenAI SDK)
const pollinations = new OpenAI({
  apiKey: "dummy-key", // Pollinations doesn't require a key
  baseURL: "https://text.pollinations.ai/openai",
});

async function generateFromApis(prompt) {
  let lastError;

  // 1. Try Gemini
  try {
    if (process.env.GOOGLE_API_KEY) {
      console.log("Attempting generation with Google Gemini...");
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    }
  } catch (error) {
    console.warn("Gemini API failed:", error.message);
    lastError = error;
  }

  // 2. Try Pollinations (No API Key Required)
  try {
    console.log("Attempting generation with Pollinations AI...");
    const completion = await pollinations.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai", // Pollinations defaults to a good open model
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.warn("Pollinations API failed:", error.message);
    lastError = error;
  }

  // 3. Try Groq
  try {
    if (process.env.GROQ_API_KEY) {
      console.log("Attempting generation with Groq...");
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-8b-8192", 
      });
      return completion.choices[0].message.content.trim();
    }
  } catch (error) {
    console.warn("Groq API failed:", error.message);
    lastError = error;
  }

  // 4. Try OpenAI
  try {
    if (process.env.OPENAI_API_KEY) {
      console.log("Attempting generation with OpenAI...");
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
      });
      return completion.choices[0].message.content.trim();
    }
  } catch (error) {
    console.warn("OpenAI API failed:", error.message);
    lastError = error;
  }

  throw new Error("All AI API providers failed or no API keys are configured.");
}

// Generate descriptions for Istanbul landmarks/places
app.post("/generate-description", async (req, res) => {
  try {
    const { landmark, language = "English" } = req.body;

    if (!landmark) {
      return res.status(400).json({ error: "Landmark name is required" });
    }

    const prompt = `
Generate two descriptions for the Istanbul landmark "${landmark}" in ${language}.

You MUST return YOUR ENTIRE RESPONSE as a valid JSON object exactly following this structure. Do NOT wrap it in markdown block quotes.
{
  "shortDescription": "A 2-3 sentence engaging short description",
  "detailedDescription": "A 5-6 sentence detailed history and guide for tourists"
}
`;

    let text = await generateFromApis(prompt);

    // Clean up potential markdown formatting
    if (text.startsWith("```json")) text = text.substring(7);
    if (text.startsWith("```")) text = text.substring(3);
    if (text.endsWith("```")) text = text.substring(0, text.length - 3);
    text = text.trim();

    let shortDescription = "";
    let detailedDescription = "";

    try {
      const parsedData = JSON.parse(text);
      shortDescription = parsedData.shortDescription || text;
      detailedDescription = parsedData.detailedDescription || text;
    } catch (parseError) {
      console.error("Failed to parse JSON from AI:", text);
      shortDescription = text;
      detailedDescription = text;
    }

    res.json({
      landmark,
      language,
      shortDescription,
      detailedDescription
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to generate description: " + error.message });
  }
});

// Generate a personalized itinerary based on user interests
app.post("/generate-itinerary", async (req, res) => {
  try {
    const { interests, language = "English" } = req.body;

    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ error: "An array of interests is required" });
    }

    const interestString = interests.join(", ");

    const prompt = `
Generate a highly personalized, 3-stop day itinerary for a tourist visiting Istanbul in ${language}. 
The user is specifically interested in: ${interestString}.

You MUST return YOUR ENTIRE RESPONSE as a valid JSON object exactly following this structure. Do NOT wrap it in markdown block quotes.
{
  "title": "Catchy title for the day",
  "stops": [
    {
      "name": "Name of the place",
      "shortDescription": "1 sentence explaining why it fits their interests",
      "detailedDescription": "3-4 sentences giving a rich, detailed history and explaining exactly what they will do there"
    }
  ]
}
`;

    let text = await generateFromApis(prompt);

    // Clean up potential markdown formatting
    if (text.startsWith("```json")) {
      text = text.substring(7);
    }
    if (text.startsWith("```")) {
      text = text.substring(3);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }

    text = text.trim();

    let title = "Your Istanbul Itinerary";
    let stops = [];

    try {
      const parsedData = JSON.parse(text);
      title = parsedData.title || title;
      stops = parsedData.stops || [];
    } catch (parseError) {
      console.error("Failed to parse JSON from AI:", text);
      return res.status(500).json({ error: "AI returned invalid format." });
    }

    res.json({
      title,
      stops
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to generate itinerary: " + error.message });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Istanbul Guide API running on port ${PORT}`);
  console.log(`Using fallback chain: Gemini -> Pollinations -> Groq -> OpenAI`);
});