import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const CLAUDE_API_KEY =
  process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

if (!CLAUDE_API_KEY) {
  console.error("❌ CLAUDE_API_KEY or ANTHROPIC_API_KEY not set in .env");
  process.exit(1);
}

console.log("🧪 Testing Claude API directly...\n");

try {
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: "Say 'Claude is working' in one short sentence.",
        },
      ],
    },
    {
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    },
  );

  console.log("✅ Claude response:", response.data.content[0].text);
} catch (error) {
  console.error("❌ Claude test failed:", error.response?.status || error.message);
  process.exit(1);
}
