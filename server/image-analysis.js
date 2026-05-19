import axios from "axios";
import { getEnv } from "./env.js";
import { withRetry } from "./retry.js";

const MOOD_VALUES = new Set([
  "happy",
  "sad",
  "attitude",
  "romantic",
  "energetic",
  "peaceful",
  "nostalgic",
  "aggressive",
  "confident",
  "lonely",
  "party",
]);

const SCENE_VALUES = new Set([
  "selfie",
  "travel",
  "gym",
  "night",
  "party",
  "nature",
  "couple",
  "alone",
  "friends",
  "city",
  "beach",
  "morning",
  "rain",
]);

const COLOR_VALUES = new Set([
  "dark",
  "warm",
  "vibrant",
  "moody",
  "neon",
  "golden",
  "cool",
]);

function parseDataUrl(image) {
  if (!image || typeof image !== "string") return null;
  const match = image.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeAnalysis(parsed) {
  const mood = MOOD_VALUES.has(parsed?.mood) ? parsed.mood : "happy";
  const scene = SCENE_VALUES.has(parsed?.scene_type || parsed?.scene)
    ? parsed.scene_type || parsed.scene
    : "selfie";
  const colorTone = COLOR_VALUES.has(parsed?.color_tone || parsed?.colorTone)
    ? parsed.color_tone || parsed.colorTone
    : "warm";

  return {
    mood,
    scene_type: scene,
    scene,
    color_tone: colorTone,
    colorTone,
    objects: Array.isArray(parsed?.objects) ? parsed.objects.slice(0, 12) : [],
    people_count: Number(parsed?.people_count) || 0,
    animals: Array.isArray(parsed?.animals) ? parsed.animals : [],
    emotions: Array.isArray(parsed?.emotions) ? parsed.emotions : [],
    environment: parsed?.environment || "unknown",
    lighting: parsed?.lighting || "natural",
    vibe: parsed?.vibe || "",
    atmosphere: parsed?.atmosphere || "",
    activity: parsed?.activity || "",
    style: parsed?.style || "",
    confidence: Math.min(Math.max(Number(parsed?.confidence) || 0.7, 0), 1),
    energy: Math.min(Math.max(Number(parsed?.energy) || 5, 1), 10),
    reasoning: Array.isArray(parsed?.reasoning)
      ? parsed.reasoning.slice(0, 4)
      : [],
  };
}

const ANALYSIS_PROMPT = `You are an expert photo analyst for a music recommendation app.
Analyze the image and respond with ONLY valid JSON (no markdown) using this schema:
{
  "mood": "happy|sad|attitude|romantic|energetic|peaceful|nostalgic|aggressive|confident|lonely|party",
  "scene_type": "selfie|travel|gym|night|party|nature|couple|alone|friends|city|beach|morning|rain",
  "color_tone": "dark|warm|vibrant|moody|neon|golden|cool",
  "objects": ["string"],
  "people_count": 0,
  "animals": ["string"],
  "emotions": ["string"],
  "environment": "indoor|outdoor|unknown",
  "lighting": "bright|dim|dark|natural",
  "vibe": "short phrase",
  "atmosphere": "short phrase",
  "activity": "short phrase",
  "style": "aesthetic label",
  "confidence": 0.0-1.0,
  "energy": 1-10,
  "reasoning": ["specific observation about THIS image"]
}
Be specific to what you see — avoid generic defaults.`;

export async function analyzeImageWithGemini(imageDataUrl) {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) return null;

  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: ANALYSIS_PROMPT },
          {
            inline_data: {
              mime_type: parsed.mimeType,
              data: parsed.data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  };

  const response = await withRetry(
    () =>
      axios.post(url, body, {
        headers: { "Content-Type": "application/json" },
        timeout: 45000,
      }),
    { maxRetries: 2 },
  );

  const text =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const json = extractJson(text);
  if (!json) return null;

  return {
    provider: "gemini",
    analysis: normalizeAnalysis(json),
  };
}

export async function analyzeImageWithOpenAI(imageDataUrl) {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) return null;

  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) return null;

  const response = await withRetry(
    () =>
      axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: ANALYSIS_PROMPT },
                {
                  type: "image_url",
                  image_url: {
                    url: imageDataUrl,
                  },
                },
              ],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 45000,
        },
      ),
    { maxRetries: 2 },
  );

  const text = response.data?.choices?.[0]?.message?.content || "";
  const json = extractJson(text);
  if (!json) return null;

  return {
    provider: "openai",
    analysis: normalizeAnalysis(json),
  };
}

export async function analyzeImageMultiProvider(imageDataUrl) {
  try {
    const gemini = await analyzeImageWithGemini(imageDataUrl);
    if (gemini) return gemini;
  } catch (error) {
    console.error("Gemini image analysis failed:", error.message);
  }

  try {
    const openai = await analyzeImageWithOpenAI(imageDataUrl);
    if (openai) return openai;
  } catch (error) {
    console.error("OpenAI image analysis failed:", error.message);
  }

  return null;
}
