import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Generate descriptions for Istanbul landmarks/places
app.post("/generate-description", async (req, res) => {
  try {
    const { landmark, language = "English" } = req.body;

    if (!landmark) {
      return res.status(400).json({ error: "Landmark name is required" });
    }

    const prompt = `
Generate two descriptions for the Istanbul landmark "${landmark}" in ${language}:

1. Short description (2-3 sentences)
2. Detailed description (5-6 sentences)

Make it informative and beautiful for tourists visiting Istanbul.
Format your response with "SHORT:" and "DETAILED:" labels.
`;

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    let shortDescription = "";
    let detailedDescription = "";

    if (text.includes("SHORT:") && text.includes("DETAILED:")) {
      const shortMatch = text.match(/SHORT:([\s\S]*?)(?=DETAILED:|$)/);
      const detailedMatch = text.match(/DETAILED:([\s\S]*?)$/);

      shortDescription = shortMatch ? shortMatch[1].trim() : text;
      detailedDescription = detailedMatch ? detailedMatch[1].trim() : text;
    } else {
      // Fallback if format isn't followed
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean up potential markdown formatting from Gemini
    if (text.startsWith("\`\`\`json")) {
      text = text.substring(7);
    }
    if (text.startsWith("\`\`\`")) {
      text = text.substring(3);
    }
    if (text.endsWith("\`\`\`")) {
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
  console.log(`Using Google Gemini API with model: gemini-2.5-flash`);
});