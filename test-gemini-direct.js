import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not set in .env");
  process.exit(1);
}

console.log("🧪 Testing Gemini API - Listing available models...\n");

try {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models?key=" +
    GEMINI_API_KEY;
  const response = await axios.get(url);

  const models = (response.data.models || [])
    .map((m) => m.name)
    .slice(0, 5);
  console.log("✅ Gemini models (sample):", models.join(", ") || "none");
} catch (error) {
  console.error("❌ Gemini test failed:", error.response?.status || error.message);
  process.exit(1);
}
