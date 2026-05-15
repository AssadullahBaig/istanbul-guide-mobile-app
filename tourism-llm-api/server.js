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
  maxRetries: 0,
  timeout: 20000,
});

// Initialize Groq client (using OpenAI SDK)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key",
  baseURL: "https://api.groq.com/openai/v1",
  maxRetries: 0,
  timeout: 20000,
});

// Initialize Pollinations client (using OpenAI SDK)
const pollinations = new OpenAI({
  apiKey: "dummy-key", // Pollinations doesn't require a key
  baseURL: "https://text.pollinations.ai/openai",
  maxRetries: 0,
  timeout: 20000,
});

const PROVIDER_TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS || 20000);

function withTimeout(promise, label) {
  // Prevent unhandled promise rejections if the original promise rejects AFTER the timeout
  promise.catch(() => { });

  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${PROVIDER_TIMEOUT_MS}ms`)),
        PROVIDER_TIMEOUT_MS
      )
    ),
  ]);
}

function cleanJsonText(text) {
  let cleaned = String(text || "").trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length - 3);

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

function localDescription(landmark, language) {
  const isTurkish = String(language).toLowerCase().startsWith("turkish");

  if (isTurkish) {
    return {
      shortDescription: `${landmark}, Istanbul'un tarih, mimari ve kent yasamini bir araya getiren dikkat cekici duraklarindan biridir.`,
      detailedDescription: `${landmark}, sehrin katmanli gecmisini yakindan gormek isteyen ziyaretciler icin guclu bir baslangic noktasi sunar. Cevresindeki sokaklar, meydanlar ve manzaralar Istanbul'un Bizans, Osmanli ve modern donem izlerini bir arada hissettirir. Ziyaret sirasinda yapinin mimari detaylarina, konumuna ve yakin cevresindeki yeme-icme ya da yuruyus rotalarina zaman ayirmak iyi olur.`,
    };
  }

  return {
    shortDescription: `${landmark} is one of Istanbul's memorable stops, combining the city's layered history, architecture, and everyday urban life.`,
    detailedDescription: `${landmark} is a strong starting point for visitors who want to understand Istanbul beyond a quick photo stop. Its surroundings reveal traces of Byzantine, Ottoman, and modern Istanbul, often within a short walk of each other. Plan time to notice the architectural details, nearby streets, and viewpoints, then pair the visit with a relaxed walk or a local cafe nearby.`,
  };
}

function localItinerary(interests, language) {
  const isTurkish = String(language).toLowerCase().startsWith("turkish");
  const interestText = interests.join(", ");

  if (isTurkish) {
    return {
      title: `${interestText} Odakli Istanbul Rotasi`,
      stops: [
        {
          name: "Sultanahmet Meydani",
          shortDescription: "Tarihi yapilari tek yuruyus rotasinda birlestiren klasik bir baslangic noktasi.",
          detailedDescription: "Gune Sultanahmet Meydani'nda baslayarak Istanbul'un en yogun tarihi dokusunu kisa mesafede kesfedebilirsiniz. Ayasofya, Sultanahmet Camii ve cevredeki sokaklar farkli donemlerin izlerini bir arada sunar. Ilgi alanlariniz ne olursa olsun, burasi sehrin kulturunu anlamak icin guclu bir ilk duraktir.",
        },
        {
          name: "Topkapi Sarayi",
          shortDescription: "Osmanli saray yasami, koleksiyonlar ve Bogaz manzarasi icin ideal bir durak.",
          detailedDescription: "Topkapi Sarayi, avlulari, hazine bolumleri ve teras manzaralariyla Istanbul'un imparatorluk gecmisini anlatir. Burada yalnizca tarihi eserleri degil, saray yasaminin nasil organize edildigini de gorebilirsiniz. Ziyareti yavas tempoda yapmak, detaylari kacirmamanizi saglar.",
        },
        {
          name: "Galata ve Karakoy",
          shortDescription: "Tarih, sokak hayati, yeme-icme ve manzara deneyimini birlestiren canli bir bolge.",
          detailedDescription: "Gunun sonunu Galata ve Karakoy tarafinda gecirmek rotaya daha modern ve sosyal bir ton katar. Galata Kulesi cevresinde yuruyebilir, Karakoy sokaklarinda kafe ve tasarim mekanlarini kesfedebilirsiniz. Bolge, fotograf cekmek ve Istanbul'un gunluk ritmini hissetmek icin de cok uygundur.",
        },
      ],
    };
  }

  return {
    title: `Istanbul Route for ${interestText}`,
    stops: [
      {
        name: "Sultanahmet Square",
        shortDescription: "A compact historic starting point with Istanbul's most recognizable monuments.",
        detailedDescription: "Start at Sultanahmet Square to get an immediate sense of Istanbul's layered past. Hagia Sophia, the Blue Mosque, and the surrounding streets give you Byzantine and Ottoman history within a short walk. It is an easy first stop because it works for architecture, history, culture, and photography interests at the same time.",
      },
      {
        name: "Topkapi Palace",
        shortDescription: "A rich palace complex for Ottoman history, collections, courtyards, and Bosphorus views.",
        detailedDescription: "Continue to Topkapi Palace for a slower look at imperial Istanbul. The courtyards, treasury rooms, and terraces show how Ottoman court life was organized and how the city connected to the sea. Give yourself time here because the best parts are in the details and the changing views.",
      },
      {
        name: "Galata and Karakoy",
        shortDescription: "A lively finish that blends historic streets, cafes, views, and modern Istanbul energy.",
        detailedDescription: "End the day around Galata and Karakoy to balance the historic morning with a more contemporary neighborhood feel. Walk near Galata Tower, then drift downhill toward Karakoy for cafes, small shops, and waterfront atmosphere. This stop is especially good for food, street life, photography, and a relaxed evening pace.",
      },
    ],
  };
}

async function generateFromApis(prompt) {
  let lastError;

  // 1. Try Gemini
  try {
    if (process.env.GOOGLE_API_KEY) {
      console.log("Attempting generation with Google Gemini...");
      const result = await withTimeout(geminiModel.generateContent(prompt), "Gemini");
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
    const completion = await withTimeout(
      pollinations.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "openai", // Reverted back to the original model as requested
        response_format: { type: "json_object" }
      }),
      "Pollinations"
    );
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.warn("Pollinations API failed:", error.message);
    lastError = error;
  }

  // 3. Try Groq
  try {
    if (process.env.GROQ_API_KEY) {
      console.log("Attempting generation with Groq...");
      const completion = await withTimeout(
        groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama3-8b-8192",
          response_format: { type: "json_object" }
        }),
        "Groq"
      );
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
      const completion = await withTimeout(
        openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo",
          response_format: { type: "json_object" }
        }),
        "OpenAI"
      );
      return completion.choices[0].message.content.trim();
    }
  } catch (error) {
    console.warn("OpenAI API failed:", error.message);
    lastError = error;
  }

  throw new Error("All AI API providers failed or no API keys are configured.");
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "tourism-llm-api",
    providers: {
      gemini: Boolean(process.env.GOOGLE_API_KEY),
      pollinations: true,
      groq: Boolean(process.env.GROQ_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
  });
});

// Generate descriptions for Istanbul landmarks/places
app.post("/generate-description", async (req, res) => {
  const { landmark, language = "English" } = req.body;

  try {
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
    text = cleanJsonText(text);

    let shortDescription = "";
    let detailedDescription = "";

    try {
      const parsedData = JSON.parse(text);
      shortDescription = parsedData.shortDescription || text;
      detailedDescription = parsedData.detailedDescription || text;
    } catch (parseError) {
      console.error("Failed to parse JSON from AI:", text);
      const fallback = localDescription(landmark, language);
      shortDescription = fallback.shortDescription;
      detailedDescription = fallback.detailedDescription;
    }

    res.json({
      landmark,
      language,
      shortDescription,
      detailedDescription
    });

  } catch (error) {
    console.error("AI providers unavailable, using local description:", error.message);
    res.json({
      landmark,
      language,
      ...localDescription(landmark, language),
      source: "local-fallback",
    });
  }
});

// Generate a personalized itinerary based on user interests
app.post("/generate-itinerary", async (req, res) => {
  const { interests, language = "English" } = req.body;

  try {
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
    text = cleanJsonText(text);

    let title = "Your Istanbul Itinerary";
    let stops = [];

    try {
      const parsedData = JSON.parse(text);
      title = parsedData.title || title;
      stops = parsedData.stops || [];
    } catch (parseError) {
      console.error("Failed to parse JSON from AI:", text);
      return res.json({
        ...localItinerary(interests, language),
        source: "local-fallback",
      });
    }

    res.json({
      title,
      stops
    });

  } catch (error) {
    console.error("AI providers unavailable, using local itinerary:", error.message);
    res.json({
      ...localItinerary(interests, language),
      source: "local-fallback",
    });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Istanbul Guide API running on port ${PORT}`);
  console.log(`Using fallback chain: Gemini -> Pollinations -> Groq -> OpenAI`);
});
