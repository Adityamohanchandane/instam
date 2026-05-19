import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY not set in .env");
  process.exit(1);
}

console.log("🧪 Testing OpenAI API directly...\n");

try {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "Say 'OpenAI is working' in one short sentence.",
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  console.log("✅ OpenAI response:", response.data.choices[0].message.content);
} catch (error) {
  console.error("❌ OpenAI test failed:", error.response?.status || error.message);
  process.exit(1);
}
